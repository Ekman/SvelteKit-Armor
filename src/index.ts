import { error, redirect, type Handle, Cookies } from "@sveltejs/kit";
import { ROUTE_PATH_LOGIN } from "./routes/login";
import type { ArmorConfig, ArmorOpenIdConfig, ArmorTokens } from "./contracts";
import { ROUTE_PATH_LOGOUT } from "./routes/logout";
import { routeCreate } from "./routes/routes";
import { COOKIE_TOKENS, cookieGet } from "./utils/cookie";
import { throwIfUndefined } from "@nekm/core";
import { ArmorOpenIdConfigError } from "./errors";

export type { ArmorConfig, ArmorTokens };

export const ARMOR_LOGIN = ROUTE_PATH_LOGIN;
export const ARMOR_LOGOUT = ROUTE_PATH_LOGOUT;

export function armor(config: ArmorConfig): Handle {
	const routes = routeCreate(config);
	const sessionExists =
		config.session?.exists ??
		((event) => Boolean(event.cookies.get(COOKIE_TOKENS)));

	return async ({ event, resolve }) => {
		const routeHandle = routes.get(event.url.pathname);

		if (routeHandle) {
			await routeHandle({ event, resolve });

			// Handle should redirect. If it doesn't, something is wrong.
			throw error(500, "Illegal state");
		}

		const exists = await sessionExists(event);

		if (!exists) {
			throw redirect(302, ROUTE_PATH_LOGIN);
		}

		return resolve(event);
	};
}

/**
 * Some IdP's expose a /.well-known/openid-configuiration that specifies how to configure.
 * Use that to autoconfigure your instance.
 * @param fetch
 * @param config
 */
export async function armorFromOpenIdConfig(
	fetch: typeof global.fetch,
	config: ArmorOpenIdConfig,
) {
	const url =
		config.oauth.openIdConfigUrl ??
		`${config.oauth.baseUrl}/.well-known/openid-configuration`;

	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		const text = await response.text();
		throw new ArmorOpenIdConfigError(text);
	}

	const body = await response.json();

	return armor({
		...config,
		oauth: {
			...config.oauth,
			tokenEndpoint: body.token_endpoint,
			authorizeEndpoint: body.authorization_endpoint,
			issuer: body.issuer,
			jwksUrl: body.jwks_uri,
			logoutEndpoint: body.end_session_endpoint ?? undefined,
		},
	});
}

export function armorCookiesGetTokens(cookies: Cookies): ArmorTokens {
	const tokens = cookieGet<ArmorTokens>(cookies, COOKIE_TOKENS);
	throwIfUndefined(tokens);
	return tokens;
}
