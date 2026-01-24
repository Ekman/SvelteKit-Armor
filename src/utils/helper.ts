import { strTrimEnd } from "@nekm/core";
import type {ArmorTokenExchange} from "../contracts";

export const STATE_KEY = 'oauth_state';

export function urlConcat(origin: string, path: string): string {
	return `${strTrimEnd(origin, "/")}/${path}`;
}

export function isTokenExchange(value: unknown): value is ArmorTokenExchange {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as any).access_token === 'string' &&
		(value as any).token_type === 'Bearer' &&
		typeof (value as any).expires_in === 'number' &&
		// Optional fields
		(typeof (value as any).id_token === 'string' || (value as any).id_token === undefined) &&
		(typeof (value as any).refresh_token === 'string' || (value as any).refresh_token === undefined) &&
		(typeof (value as any).scope === 'string' || (value as any).scope === undefined)
	);
}
