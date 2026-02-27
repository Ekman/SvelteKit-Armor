import { createRemoteJWKSet } from "jose";
import {
	ArmorConfig,
	ArmorIdToken,
	ArmorTokenExchange,
	ArmorTokens,
} from "../contracts";
import { ArmorRefreshError } from "../errors";
import { createExpiresAt, urlConcat } from "./utils";
import { jwtVerifyAccessToken, jwtVerifyIdToken } from "./jwt";
import { RequestEvent } from "@sveltejs/kit";

export function createRefresh(config: ArmorConfig) {
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

	return async (
		event: RequestEvent,
		tokens: ArmorTokens,
	): Promise<ArmorTokens> => {
		const refreshToken = tokens.exchange?.refresh_token;

		if (!refreshToken) {
			throw new ArmorRefreshError("Could not find refresh token");
		}

		const newExchange = await refresh(event.fetch, refreshToken);

		const jwks = createRemoteJWKSet(jwksUrl);

		const [idToken, accessToken] = await Promise.all([
			jwtVerifyIdToken(config, jwks, newExchange.id_token),
			jwtVerifyAccessToken(config, jwks, newExchange.access_token),
		]);

		return {
			exchange: newExchange,
			idToken: idToken as ArmorIdToken,
			// Generally, IdP's require an audience to get a JWT
			// access token. Most cases, this doesn't matter.
			accessToken: accessToken ?? newExchange.access_token,
			expiresAt: createExpiresAt(newExchange.expires_in),
		};
	};
}
