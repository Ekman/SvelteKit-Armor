import { strTrimEnd, strTrimStart } from "@nekm/core";
import type {
	ArmorConfig,
	ArmorIdToken,
	ArmorOauth,
	ArmorTokenExchange,
	ArmorTokens,
} from "../contracts";

export function urlConcat(origin: string, path: string): string {
	return [strTrimEnd(origin, "/"), strTrimStart(path, "/")].join("/");
}

export function armorOauthResolve(config: ArmorConfig): ArmorOauth {
	const { oauth } = config;

	return {
		tokenEndpoint:
			oauth.tokenEndpoint ?? urlConcat(oauth.baseUrl, "oauth2/token"),
		authorizeEndpoint:
			oauth.authorizeEndpoint ?? urlConcat(oauth.baseUrl, "oauth2/authorize"),
		jwksEndpoint:
			oauth.jwksEndpoint ?? urlConcat(oauth.baseUrl, ".well-known/jwks.json"),
		issuer: oauth.issuer,
		clientId: oauth.clientId,
		clientSecret: oauth.clientSecret,
		scope: oauth.scope ?? "openid profile email",
	};
}

export function safeRedirectPath(value: string | undefined): string {
	if (!value || !value.startsWith("/")) {
		return "/";
	}

	if (value.startsWith("//") || value.startsWith("/\\")) {
		return "/";
	}

	return value;
}

export function isTokenExchange(value: unknown): value is ArmorTokenExchange {
	if (typeof value !== "object" || value === null) return false;

	const obj = value as Record<string, unknown>;

	return (
		typeof obj.access_token === "string" &&
		obj.token_type === "Bearer" &&
		typeof obj.expires_in === "number" &&
		// Optional fields
		(typeof obj.id_token === "string" || obj.id_token === undefined) &&
		(typeof obj.refresh_token === "string" ||
			obj.refresh_token === undefined) &&
		(typeof obj.scope === "string" || obj.scope === undefined)
	);
}

export function createExpiresAt(seconds: number): number {
	return Date.now() + seconds * 1000;
}

export function exchangeToTokens(
	exchange: ArmorTokenExchange,
	idToken: ArmorIdToken,
): ArmorTokens {
	return {
		exchange,
		idToken,
		expiresAt: createExpiresAt(exchange.expires_in),
	};
}
