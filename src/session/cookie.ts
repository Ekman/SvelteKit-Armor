import { RequestEvent } from "@sveltejs/kit";
import {
	COOKIE_TOKENS,
	cookieDelete,
	cookieGet,
	cookieSet,
} from "../utils/cookie";
import { ArmorConfig, ArmorTokens } from "../contracts";
import { ArmorAuthMissingError } from "../errors";

function cookieSessionGetTokens({
	cookies,
}: RequestEvent): ArmorTokens | undefined {
	return cookies.get(COOKIE_TOKENS) as ArmorTokens | undefined;
}

export function cookieSessionLogin(
	{ cookies }: RequestEvent,
	tokens: ArmorTokens,
): void {
	cookieSet(cookies, COOKIE_TOKENS, tokens);
}

function cookieSessionLogout({ cookies }: RequestEvent): void {
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
	getTokens: cookieSessionGetTokens,
	login: cookieSessionLogin,
	logout: cookieSessionLogout,
};
