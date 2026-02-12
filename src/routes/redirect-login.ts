import { redirect } from "@sveltejs/kit";
import type {
	ArmorConfig,
	ArmorIdToken,
	ArmorTokenExchange,
} from "../contracts";
import { queryParamsCreate, throwIfUndefined } from "@nekm/core";
import { createRemoteJWKSet } from "jose";
import type { RouteFactory } from "./routes";
import { urlConcat, isTokenExchange } from "../utils/utils";
import { jwtVerifyAccessToken, jwtVerifyIdToken } from "../utils/jwt";
import { eventStateValidOrThrow } from "../utils/event";

export const ROUTE_PATH_REDIRECT_LOGIN = "/_armor/redirect/login";

export const routeRedirectLoginFactory: RouteFactory = (
	config: ArmorConfig,
) => {
	const jwksUrl = new URL(
		config.oauth.jwksEndpoint ??
			urlConcat(config.oauth.baseUrl, ".well-known/jwks.json"),
	);

	const tokenUrl =
		config.oauth.tokenEndpoint ??
		urlConcat(config.oauth.baseUrl, "oauth2/token");

	const scope = config.oauth.scope ?? "openid profile email";

	async function exchangeCodeForToken(
		fetch: typeof global.fetch,
		origin: string,
		code: string,
	): Promise<ArmorTokenExchange> {
		const params: Record<string, string> = {
			grant_type: "authorization_code",
			client_id: config.oauth.clientId,
			client_secret: config.oauth.clientSecret,
			code,
			redirect_uri: urlConcat(origin, ROUTE_PATH_REDIRECT_LOGIN),
			scope,
		};

		if (config.oauth.audience) {
			params.audience = config.oauth.audience;
		}

		const response = await fetch(tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: new URLSearchParams(params).toString(),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Token exchange failed: ${error}`);
		}

		const token = await response.json();

		if (!isTokenExchange(token)) {
			throw new Error("Response is not a valid token exchange.");
		}

		return token;
	}

	return {
		path: ROUTE_PATH_REDIRECT_LOGIN,
		async handle({ event }) {
			eventStateValidOrThrow(event);

			const error = event.url.searchParams.get("error") ?? undefined;

			if (error) {
				const error_description =
					event.url.searchParams.get("error_description") ?? undefined;

				if (!config.oauth.errorLoginRedirectPath) {
					return new Response(`${error}\n${error_description}`.trimEnd(), {
						headers: {
							"Content-Type": "text/plain",
						},
					});
				}

				const errorParams = queryParamsCreate({ error, error_description });
				throw redirect(
					302,
					`${config.oauth.errorLoginRedirectPath}?${errorParams}`,
				);
			}

			const code = event.url.searchParams.get("code") ?? undefined;
			throwIfUndefined(code);

			const exchange = await exchangeCodeForToken(
				event.fetch,
				event.url.origin,
				code,
			);

			const jwks = createRemoteJWKSet(jwksUrl);

			const [idToken, accessToken] = await Promise.all([
				jwtVerifyIdToken(config, jwks, exchange.id_token),
				jwtVerifyAccessToken(config, jwks, exchange.access_token),
			]);

			await config.session.login(event, {
				exchange,
				idToken: idToken as ArmorIdToken,
				// Generally, IdP's require an audience to get a JWT
				// access token. Most cases, this doesn't matter.
				accessToken: accessToken ?? exchange.access_token,
			});

			throw redirect(302, "/");
		},
	};
};
