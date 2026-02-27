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
import { throwIfUndefined } from "@nekm/core";
import { ROUTE_PATH_LOGIN } from "../routes/login";

export function armorCreateRefresh(config: ArmorConfig) {
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
	): Promise<ArmorTokenExchange> => {
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

		return {
			...json,
			refresh_token: json.refresh_token ?? refreshToken,
		};
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
					console.log("Refreshing tokens...");

					throwIfUndefined(tokens.exchange.refresh_token);

					const newExchange = await refresh(
						fetch,
						tokens.exchange.refresh_token,
					);

					const jwks = createRemoteJWKSet(jwksUrl);

					const [idToken, accessToken] = await Promise.all([
						jwtVerifyIdToken(config, jwks, newExchange.id_token),
						jwtVerifyAccessToken(config, jwks, newExchange.access_token),
					]);

					validTokens = exchangeToTokens(
						newExchange,
						idToken as ArmorIdToken,
						accessToken,
					);

					await config.session.login(event, tokens);
				}

				return fn(validTokens);
			} catch (error) {
				if (error instanceof ArmorRefreshError) {
					throw redirect(302, ROUTE_PATH_LOGIN);
				}

				throw error;
			}
		},
	};
}
