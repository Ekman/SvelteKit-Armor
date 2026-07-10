import { strTrimEnd, strTrimStart } from "@nekm/core";
import type {
	ArmorAccessToken,
	ArmorIdToken,
	ArmorTokenExchange,
	ArmorTokens,
} from "../contracts";

export function urlConcat(origin: string, path: string): string {
	return [strTrimEnd(origin, "/"), strTrimStart(path, "/")].join("/");
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

const MINUTES_MS = 60 * 1000;

export function shouldRefresh(
	tokens: Pick<ArmorTokens, "idToken" | "accessToken">,
	nowDate?: Date,
): boolean {
	const now = nowDate?.getTime() ?? Date.now();

	const idExpiry = tokens.idToken.exp * 1000;

	const accessExpiry =
		typeof tokens.accessToken !== "string" &&
		"exp" in tokens.accessToken &&
		tokens.accessToken.exp !== undefined
			? tokens.accessToken.exp * 1000
			: Infinity;

	return Math.min(idExpiry, accessExpiry) < now + 5 * MINUTES_MS;
}

export function createExpiresAt(seconds: number): Date {
	const now = new Date();
	now.setSeconds(now.getSeconds() + seconds);
	return now;
}

export function exchangeToTokens(
	exchange: ArmorTokenExchange,
	idToken: ArmorIdToken,
	accessToken?: ArmorAccessToken,
): ArmorTokens {
	return {
		exchange,
		idToken: idToken as ArmorIdToken,
		// Generally, IdP's require an audience to get a JWT
		// access token. Most cases, this doesn't matter.
		accessToken: accessToken ?? exchange.access_token,
		expiresAt: createExpiresAt(exchange.expires_in),
	};
}
