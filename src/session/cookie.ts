import { RequestEvent } from "@sveltejs/kit";
import {
	COOKIE_REDIRECT,
	COOKIE_TOKENS,
	cookieDelete,
	cookieGet,
	cookieGetAndDelete,
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

function cookieSessionSetRedirect(
	{ cookies }: Pick<RequestEvent, "cookies">,
	path: string,
): void {
	cookieSet(cookies, COOKIE_REDIRECT, path);
}

function cookieSessionGetRedirect({
	cookies,
}: Pick<RequestEvent, "cookies">): string | undefined {
	return cookieGetAndDelete<string>(cookies, COOKIE_REDIRECT);
}

export const armorCookieSession: ArmorConfig["session"] = {
	getTokens: armorCookieSessionGet,
	login: cookieSessionLogin,
	logout: cookieSessionLogout,
	setRedirect: cookieSessionSetRedirect,
	getRedirect: cookieSessionGetRedirect,
};
