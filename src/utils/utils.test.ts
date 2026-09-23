import { describe, test, expect, vi, afterEach, it } from "vitest";
import type { ArmorConfig, ArmorIdToken } from "../contracts";
import {
	armorOauthResolve,
	exchangeToTokens,
	isTokenExchange,
	safeRedirectPath,
	urlConcat,
} from "./utils";

describe("utils", () => {
	it("should be able to concat URL with path", () => {
		expect(urlConcat("https://foo.example/", "bar")).toBe(
			"https://foo.example/bar",
		);
	});

	it("can detect a valid ArmorTokenExchange", () => {
		const token = {
			access_token: "abc123",
			token_type: "Bearer",
			expires_in: 3600,
		};
		expect(isTokenExchange(token)).toBe(true);
	});
});

describe("safeRedirectPath", () => {
	test.each([
		{ value: "/dashboard", expected: "/dashboard" },
		{ value: "/a/b?x=1", expected: "/a/b?x=1" },
		{ value: "//evil.com", expected: "/" },
		{ value: "/\\evil.com", expected: "/" },
		{ value: "https://evil.com", expected: "/" },
		{ value: "", expected: "/" },
		{ value: undefined, expected: "/" },
	])("$value -> $expected", ({ value, expected }) => {
		expect(safeRedirectPath(value)).toBe(expected);
	});
});

function configWithOauth(oauth: Record<string, unknown>): ArmorConfig {
	return {
		session: {},
		oauth: {
			clientId: "client-id",
			clientSecret: "client-secret",
			issuer: "https://idp.example",
			...oauth,
		},
	} as unknown as ArmorConfig;
}

describe("armorOauthResolve", () => {
	test.each([
		{
			description: "derives every endpoint from baseUrl",
			oauth: { baseUrl: "https://idp.example/" },
			expected: {
				tokenEndpoint: "https://idp.example/oauth2/token",
				authorizeEndpoint: "https://idp.example/oauth2/authorize",
				jwksEndpoint: "https://idp.example/.well-known/jwks.json",
				scope: "openid profile email",
			},
		},
		{
			description: "explicit endpoints win over the baseUrl defaults",
			oauth: {
				tokenEndpoint: "https://idp.example/token",
				authorizeEndpoint: "https://idp.example/authorize",
				jwksEndpoint: "https://idp.example/keys",
			},
			expected: {
				tokenEndpoint: "https://idp.example/token",
				authorizeEndpoint: "https://idp.example/authorize",
				jwksEndpoint: "https://idp.example/keys",
				scope: "openid profile email",
			},
		},
		{
			description: "a configured scope replaces the default",
			oauth: { baseUrl: "https://idp.example", scope: "openid offline_access" },
			expected: {
				tokenEndpoint: "https://idp.example/oauth2/token",
				authorizeEndpoint: "https://idp.example/oauth2/authorize",
				jwksEndpoint: "https://idp.example/.well-known/jwks.json",
				scope: "openid offline_access",
			},
		},
	])("$description", ({ oauth, expected }) => {
		expect(armorOauthResolve(configWithOauth(oauth))).toEqual({
			...expected,
			issuer: "https://idp.example",
			clientId: "client-id",
			clientSecret: "client-secret",
		});
	});
});

describe("exchangeToTokens", () => {
	const NOW = 1_000_000_000_000;

	afterEach(() => vi.useRealTimers());

	test.each([
		{ expiresIn: 3600, expected: NOW + 3_600_000 },
		{ expiresIn: 43199, expected: NOW + 43_199_000 },
		{ expiresIn: 0, expected: NOW },
	])(
		"expires_in $expiresIn becomes epoch ms $expected",
		({ expiresIn, expected }) => {
			vi.useFakeTimers();
			vi.setSystemTime(NOW);

			const idToken = {
				iss: "https://idp.example",
				sub: "user-1",
				aud: "client-id",
				exp: 1779474532,
				iat: 1779431332,
			} satisfies ArmorIdToken;

			const tokens = exchangeToTokens(
				{
					access_token: "access",
					id_token: "id",
					token_type: "Bearer",
					expires_in: expiresIn,
				},
				idToken,
			);

			expect(tokens.expiresAt).toBe(expected);
			expect(tokens).not.toHaveProperty("accessToken");
			expect(tokens.idToken).toBe(idToken);
		},
	);
});
