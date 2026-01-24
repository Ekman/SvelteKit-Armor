import {Cookies} from "@sveltejs/kit";

const cookieDeleteOptions = Object.freeze({ path: '/' });

const cookieSetOptions = Object.freeze({
	...cookieDeleteOptions,
	httpOnly: true,
	secure: true,
	sameSite: 'lax',
	maxAge: 1800, // 30 minutes
},);

export function cookieSet(cookies: Cookies, key: string, value: string) {
	cookies.set(key, value, cookieSetOptions);
}

export function cookieGetAndDelete(cookies: Cookies, key: string): string | undefined {
	const value = cookies.get(key);

	if (!value) {
		return undefined;
	}

	cookies.delete(key, cookieDeleteOptions);

	return value;
}
