import { createRemoteJWKSet } from "jose";
import {
	ArmorConfig,
	ArmorIdToken,
	ArmorTokenExchange,
	ArmorTokens,
} from "../contracts";
import { ArmorRefreshError } from "../errors";
import { exchangeToTokens, shouldRefresh, urlConcat } from "./utils";
import { jwtVerifyAccessToken, jwtVerifyIdToken } from "./jwt";
import { redirect, RequestEvent } from "@sveltejs/kit";
import { loginPathWithRedirect } from "../routes/login";

export interface ArmorRefresh {
	readonly refresh: (
		fetch: typeof global.fetch,
		refreshToken: string,
	) => Promise<ArmorTokens>;
	readonly ensureValidToken: <T>(
		event: RequestEvent,
		tokens: ArmorTokens,
		fn: (tokens: ArmorTokens) => T | Promise<T>,
	) => Promise<T>;
}

export function armorRefreshFactory(config: ArmorConfig): ArmorRefresh {
	const refreshEndpoint =
		config.oauth.refreshEndpoint ??
		urlConcat(config.oauth.baseUrl, "oauth2/token");

	const jwksUrl = new URL(
		config.oauth.jwksEndpoint ??
			urlConcat(config.oauth.baseUrl, ".well-known/jwks.json"),
	);

	const refresh = async (
		fetch: typeof global.fetch,
		refreshToken: string,
	): Promise<ArmorTokens> => {
		const body = new URLSearchParams({
			grant_type: "refresh_token",
			client_id: config.oauth.clientId,
			client_secret: config.oauth.clientSecret,
			refresh_token: refreshToken,
		});

		if (config.oauth.scope) {
			body.set("scope", config.oauth.scope);
		}

		const response = await fetch(refreshEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: body.toString(),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new ArmorRefreshError(`Could not refresh token: ${error}`);
		}

		const json: ArmorTokenExchange = await response.json();

		const newExchange = {
			...json,
			refresh_token: json.refresh_token ?? refreshToken,
		};

		config.logger?.debug?.("Exchange code for tokens.", { newExchange });

		const jwks = createRemoteJWKSet(jwksUrl);

		const [idToken, accessToken] = await Promise.all([
			jwtVerifyIdToken(config, jwks, newExchange.id_token),
			jwtVerifyAccessToken(config, jwks, newExchange.access_token),
		]);

		config.logger?.debug?.("Extract and verify tokens.", {
			idToken,
			accessToken,
		});

		const validTokens = exchangeToTokens(
			newExchange,
			idToken as ArmorIdToken,
			accessToken,
		);

		return validTokens;
	};

	return {
		refresh,
		async ensureValidToken<T>(
			event: RequestEvent,
			tokens: ArmorTokens,
			fn: (tokens: ArmorTokens) => T | Promise<T>,
		): Promise<T> {
			try {
				let validTokens = tokens;

				if (shouldRefresh(tokens)) {
					config.logger?.debug?.("Tokens has expired. Refreshing...");

					if (!tokens.exchange.refresh_token) {
						throw redirect(302, loginPathWithRedirect(event));
					}

					validTokens = await refresh(fetch, tokens.exchange.refresh_token);

					await config.session.login(event, validTokens);
				}

				return fn(validTokens);
			} catch (error) {
				if (error instanceof ArmorRefreshError) {
					throw redirect(302, loginPathWithRedirect(event));
				}

				throw error;
			}
		},
	};
}
