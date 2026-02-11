import { error, redirect, type Handle } from "@sveltejs/kit";
import { ROUTE_PATH_LOGIN } from "./routes/login";
import type { ArmorConfig, ArmorOpenIdConfig, ArmorTokens } from "./contracts";
import { ROUTE_PATH_LOGOUT } from "./routes/logout";
import { routeCreate } from "./routes/routes";
import { ArmorOpenIdConfigError } from "./errors";

export type { ArmorConfig, ArmorTokens };
export { armorCookieSession, armorCookieSessionGet } from "./session/cookie";

export const ARMOR_LOGIN = ROUTE_PATH_LOGIN;
export const ARMOR_LOGOUT = ROUTE_PATH_LOGOUT;

export function armor(config: ArmorConfig): Handle {
	const routes = routeCreate(config);

	return async ({ event, resolve }) => {
		const routeHandle = routes.get(event.url.pathname);

		if (routeHandle) {
			return routeHandle({ event, resolve });
		}

		const exists = await config.session.exists(event);

		if (!exists) {
			throw redirect(302, ROUTE_PATH_LOGIN);
		}

		return resolve(event);
	};
}

/**
 * Some IdP's expose a /.well-known/openid-configuration that specifies how to configure.
 * Use that to create your config.
 * @param config
 * @param fetch
 */
export async function armorConfigFromOpenId(
	config: ArmorOpenIdConfig,
	fetch?: typeof global.fetch,
): Promise<ArmorConfig> {
	const fetchToUse = fetch ?? global.fetch;

	const response = await fetchToUse(config.oauth.openIdConfigEndpoint, {
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		const text = await response.text();
		throw new ArmorOpenIdConfigError(text);
	}

	const body = await response.json();

	return {
		...config,
		oauth: {
			...config.oauth,
			tokenEndpoint: body.token_endpoint,
			authorizeEndpoint: body.authorization_endpoint,
			issuer: body.issuer,
			jwksEndpoint: body.jwks_uri,
			logoutEndpoint: body.end_session_endpoint ?? undefined,
		},
	};
}
