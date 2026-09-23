import { describe, test, expect, vi, afterEach } from "vitest";
import { isRedirect, type RequestEvent } from "@sveltejs/kit";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { armor } from "./index";
import { armorRedirectToLogin } from "./routes/login";
import type { ArmorConfig, ArmorTokens } from "./contracts";

const ISSUER = "https://idp.example";
const CLIENT_ID = "client-id";
const JWKS_URL = "https://idp.example/.well-known/jwks.json";

function eventAt(path: string): RequestEvent {
	const store = new Map<string, string>();

	return {
		url: new URL(`https://app.example${path}`),
		cookies: {
			get: (key: string) => store.get(key),
			set: (key: string, value: string) => store.set(key, value),
			delete: (key: string) => store.delete(key),
		},
		fetch: vi.fn(),
	} as unknown as RequestEvent;
}

const tokens = {
	exchange: {
		access_token: "access",
		id_token: "id",
		token_type: "Bearer",
		expires_in: 3600,
	},
	idToken: {
		iss: ISSUER,
		sub: "user-1",
		aud: CLIENT_ID,
		exp: 1779474532,
		iat: 1779431332,
	},
	expiresAt: 1779474532000,
} satisfies ArmorTokens;

function configWith(
	session: Partial<ArmorConfig["session"]>,
	requireLogin?: ArmorConfig["requireLogin"],
	oauth?: Record<string, unknown>,
): ArmorConfig {
	return {
		session: {
			login: vi.fn(),
			logout: vi.fn(),
			getTokens: vi.fn(),
			setRedirect: vi.fn(),
			getRedirect: vi.fn(),
			...session,
		},
		oauth: {
			baseUrl: ISSUER,
			clientId: CLIENT_ID,
			clientSecret: "client-secret",
			issuer: ISSUER,
			...oauth,
		},
		requireLogin,
	} as unknown as ArmorConfig;
}

const LOGOUT_ROUTES_ENABLED = { logoutEndpoint: `${ISSUER}/logout` };

async function ignoringRouteFailure(fn: () => Promise<unknown>): Promise<void> {
	await fn().catch(() => undefined);
}

async function redirectOf(fn: () => unknown): Promise<string> {
	try {
		await fn();
	} catch (error) {
		if (isRedirect(error)) {
			return error.location;
		}
		throw error;
	}
	throw new Error("Expected a redirect.");
}

describe("handle gate", () => {
	test.each([
		{
			description: "resolves when the session has tokens",
			getTokens: () => tokens,
			path: "/dashboard",
		},
		{
			description: "resolves without reading tokens when login is not required",
			getTokens: undefined,
			path: "/public",
			requireLogin: () => false,
		},
	])("$description", async ({ getTokens, path, requireLogin }) => {
		const getTokensSpy = vi.fn(getTokens);
		const resolve = vi.fn(() => new Response("ok"));

		const { handle } = armor(
			configWith({ getTokens: getTokensSpy }, requireLogin),
		);

		const response = await handle({ event: eventAt(path), resolve });

		expect(await response.text()).toBe("ok");
		expect(resolve).toHaveBeenCalledOnce();
		expect(getTokensSpy).toHaveBeenCalledTimes(requireLogin ? 0 : 1);
	});

	test.each([
		{ path: "/dashboard", expected: "/_armor/login?redirect=%2Fdashboard" },
		{
			path: "/a/b?x=1",
			expected: "/_armor/login?redirect=%2Fa%2Fb%3Fx%3D1",
		},
		{ path: "/", expected: "/_armor/login?redirect=%2F" },
	])(
		"no tokens at $path redirects to $expected",
		async ({ path, expected }) => {
			const resolve = vi.fn(() => new Response("ok"));
			const { handle } = armor(configWith({ getTokens: () => undefined }));

			const location = await redirectOf(() =>
				handle({ event: eventAt(path), resolve }),
			);

			expect(location).toBe(expected);
			expect(resolve).not.toHaveBeenCalled();
		},
	);

	test.each([
		"/_armor/login",
		"/_armor/redirect/login",
		"/_armor/logout",
		"/_armor/redirect/logout",
	])("%s short-circuits before the gate", async (path) => {
		const getTokens = vi.fn(() => undefined);
		const resolve = vi.fn(() => new Response("ok"));

		const { handle } = armor(
			configWith(
				{ getTokens },
				() => {
					throw new Error("requireLogin must not run for armor routes.");
				},
				LOGOUT_ROUTES_ENABLED,
			),
		);

		await ignoringRouteFailure(() => handle({ event: eventAt(path), resolve }));

		expect(getTokens).not.toHaveBeenCalled();
	});
});

describe("armorRedirectToLogin", () => {
	test.each([
		{ path: "/dashboard", expected: "/_armor/login?redirect=%2Fdashboard" },
		{ path: "/a/b?x=1", expected: "/_armor/login?redirect=%2Fa%2Fb%3Fx%3D1" },
		{ path: "/", expected: "/_armor/login?redirect=%2F" },
	])("$path -> $expected", async ({ path, expected }) => {
		const location = await redirectOf(() =>
			armorRedirectToLogin(eventAt(path)),
		);
		expect(location).toBe(expected);
	});
});

describe("armorVerifyIdToken", () => {
	afterEach(() => vi.unstubAllGlobals());

	async function withLocalJwks() {
		const { privateKey, publicKey } = await generateKeyPair("RS256", {
			extractable: true,
		});
		const jwk = await exportJWK(publicKey);
		const fetchSpy = vi.fn(
			async () =>
				new Response(JSON.stringify({ keys: [{ ...jwk, alg: "RS256" }] }), {
					headers: { "Content-Type": "application/json" },
				}),
		);
		vi.stubGlobal("fetch", fetchSpy);

		const sign = (claims: { iss: string; aud: string }) =>
			new SignJWT({ "cognito:groups": ["admin"] })
				.setProtectedHeader({ alg: "RS256" })
				.setIssuer(claims.iss)
				.setAudience(claims.aud)
				.setSubject("user-1")
				.setIssuedAt()
				.setExpirationTime("1h")
				.sign(privateKey);

		return { sign, fetchSpy };
	}

	test("verifies a token and returns its claims", async () => {
		const { sign } = await withLocalJwks();
		const { armorVerifyIdToken } = armor(configWith({}));

		const claims = await armorVerifyIdToken(
			await sign({ iss: ISSUER, aud: CLIENT_ID }),
		);

		expect(claims.sub).toBe("user-1");
		expect(claims.iss).toBe(ISSUER);
		expect(claims["cognito:groups"]).toEqual(["admin"]);
	});

	test.each([
		{
			description: "wrong issuer",
			claims: { iss: "https://evil.example", aud: CLIENT_ID },
		},
		{
			description: "wrong audience",
			claims: { iss: ISSUER, aud: "other-client" },
		},
	])("rejects a token with the $description", async ({ claims }) => {
		const { sign } = await withLocalJwks();
		const { armorVerifyIdToken } = armor(configWith({}));

		await expect(armorVerifyIdToken(await sign(claims))).rejects.toThrow();
	});

	test("rejects a non-compact string", async () => {
		await withLocalJwks();
		const { armorVerifyIdToken } = armor(configWith({}));

		await expect(armorVerifyIdToken("not-a-jwt")).rejects.toThrow();
	});

	test("fetches the JWKS once across two verifications", async () => {
		const { sign, fetchSpy } = await withLocalJwks();
		const { armorVerifyIdToken } = armor(configWith({}));

		await armorVerifyIdToken(await sign({ iss: ISSUER, aud: CLIENT_ID }));
		await armorVerifyIdToken(await sign({ iss: ISSUER, aud: CLIENT_ID }));

		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(fetchSpy.mock.calls[0][0].toString()).toBe(JWKS_URL);
	});
});
