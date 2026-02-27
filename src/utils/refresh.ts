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
import { RequestEvent } from "@sveltejs/kit";
import { throwIfUndefined } from "@nekm/core";

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

	const postRefresh = async (
		event: RequestEvent,
		exchange: ArmorTokenExchange,
	): Promise<ArmorTokens> => {
		const jwks = createRemoteJWKSet(jwksUrl);

		const [idToken, accessToken] = await Promise.all([
			jwtVerifyIdToken(config, jwks, exchange.id_token),
			jwtVerifyAccessToken(config, jwks, exchange.access_token),
		]);

		const tokens = exchangeToTokens(
			exchange,
			idToken as ArmorIdToken,
			accessToken,
		);

		await config.session.login(event, tokens);

		return tokens;
	};

	return {
		refresh,
		async ensureValidToken<T>(
			event: RequestEvent,
			tokens: ArmorTokens,
			fn: (tokens: ArmorTokens) => T | Promise<T>,
		): Promise<T> {
			let validTokens = tokens;

			if (shouldRefresh(tokens)) {
				throwIfUndefined(tokens.exchange.refresh_token);
				const newTokens = await refresh(fetch, tokens.exchange.refresh_token);
				validTokens = await postRefresh(event, newTokens);
			}

			return fn(validTokens);
		},
		async handler(
			event: RequestEvent,
			tokens: ArmorTokens,
		): Promise<ArmorTokens> {
			const refreshToken = tokens.exchange?.refresh_token;

			if (!refreshToken) {
				throw new ArmorRefreshError("Could not find refresh token");
			}

			const exchange = await refresh(event.fetch, refreshToken);

			return postRefresh(event, exchange);
		},
	};
}
