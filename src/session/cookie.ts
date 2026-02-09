import { RequestEvent } from "@sveltejs/kit";
import {
	COOKIE_TOKENS,
	cookieDelete,
	cookieGet,
	cookieSet,
} from "../utils/cookie";
import { ArmorConfig, ArmorTokens } from "../contracts";
import { ArmorAuthMissingError } from "../errors";

export function armorCookieSessionExists({ cookies }: RequestEvent): boolean {
	return Boolean(cookies.get(COOKIE_TOKENS));
}

export function armorCookieSessionLogin(
	{ cookies }: RequestEvent,
	tokens: ArmorTokens,
): void {
	cookieSet(cookies, COOKIE_TOKENS, tokens);
}

export function armorCookieSessionLogout({ cookies }: RequestEvent): void {
	cookieDelete(cookies, COOKIE_TOKENS);
}

export function armorCookieSessionGet({ cookies }: RequestEvent): ArmorTokens {
	const tokens = cookieGet<ArmorTokens>(cookies, COOKIE_TOKENS);

	if (!tokens) {
		throw new ArmorAuthMissingError();
	}

	return tokens;
}

export const armorCookieSession: ArmorConfig["session"] = {
	exists: armorCookieSessionExists,
	login: armorCookieSessionLogin,
	logout: armorCookieSessionLogout,
};
