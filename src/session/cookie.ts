import { RequestEvent } from "@sveltejs/kit";
import {
	COOKIE_TOKENS,
	cookieDelete,
	cookieGet,
	cookieSet,
} from "../utils/cookie";
import { ArmorConfig, ArmorTokens } from "../contracts";
import { ArmorAuthMissingError } from "../errors";

export function armorCookieSessionGet<T extends ArmorTokens = ArmorTokens>({
	cookies,
}: Pick<RequestEvent, "cookies">): T | undefined {
	return cookieGet<T>(cookies, COOKIE_TOKENS);
}

export function cookieSessionLogin(
	{ cookies }: RequestEvent,
	tokens: ArmorTokens,
): void {
	cookieSet(cookies, COOKIE_TOKENS, tokens);
}

function cookieSessionLogout({ cookies }: Pick<RequestEvent, "cookies">): void {
	cookieDelete(cookies, COOKIE_TOKENS);
}

export function armorCookieSessionGetOrThrow<
	T extends ArmorTokens = ArmorTokens,
>({ cookies }: Pick<RequestEvent, "cookies">): T {
	const tokens = armorCookieSessionGet<T>({ cookies });

	if (!tokens) {
		throw new ArmorAuthMissingError();
	}

	return tokens;
}

export const armorCookieSession: ArmorConfig["session"] = {
	getTokens: armorCookieSessionGet,
	login: cookieSessionLogin,
	logout: cookieSessionLogout,
};
