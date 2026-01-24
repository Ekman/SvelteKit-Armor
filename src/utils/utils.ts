import { strTrimEnd } from "@nekm/core";
import type {ArmorTokenExchange} from "../contracts";

export function urlConcat(origin: string, path: string): string {
	return `${strTrimEnd(origin, "/")}/${path}`;
}

export function isTokenExchange(value: unknown): value is ArmorTokenExchange {
	if (typeof value !== 'object' || value === null) return false;

	const obj = value as Record<string, unknown>;

	return (
		typeof obj.access_token === 'string' &&
		obj.token_type === 'Bearer' &&
		typeof obj.expires_in === 'number' &&
		// Optional fields
		(typeof obj.id_token === 'string' || obj.id_token === undefined) &&
		(typeof obj.refresh_token === 'string' || obj.refresh_token === undefined) &&
		(typeof obj.scope === 'string' || obj.scope === undefined)
	);
}

