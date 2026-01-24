import {Cookies} from "@sveltejs/kit";

export const COOKIE_TOKENS = 'tokens';
export const COOKIE_STATE = 'state';

const cookieDeleteOptions = Object.freeze({ path: '/' });

const cookieSetOptions = Object.freeze({
	...cookieDeleteOptions,
	httpOnly: true,
	secure: true,
	sameSite: 'lax',
	maxAge: 1800, // 30 minutes
},);

export function cookieSet(cookies: Cookies, key: string, value: string | object) {
	cookies.set(
		key,
		JSON.stringify(value),
		cookieSetOptions,
	);
}

export function cookieGetAndDelete<T>(cookies: Cookies, key: string): T | undefined {
	const value = cookieGet<T>(cookies, key);

	if (value) {
		cookies.delete(key, cookieDeleteOptions);
	}

	return value;
}

export function cookieGet<T>(cookies: Cookies, key: string): T | undefined {
	const value = cookies.get(key);

	return !value ? undefined : JSON.parse(value);
}
