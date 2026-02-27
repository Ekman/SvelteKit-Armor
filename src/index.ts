import { redirect, type Handle } from "@sveltejs/kit";
import { ROUTE_PATH_LOGIN } from "./routes/login";
import type { ArmorConfig, ArmorOpenIdConfig, ArmorTokens } from "./contracts";
import { routeCreate } from "./routes/routes";
import { ArmorOpenIdConfigError } from "./errors";
import { armorCreateRefresh } from "./utils/refresh";

export type { ArmorConfig, ArmorTokens };
export { armorCookieSession, armorCookieSessionGet } from "./session/cookie";
export { armorCreateRefresh } from "./utils/refresh";

export function armor(config: ArmorConfig): Handle {
	const routeByPath = routeCreate(config);
	const refresh = armorCreateRefresh(config);

	return async ({ event, resolve }) => {
		const route = routeByPath.get(event.url.pathname);

		if (route && route.method === event.request.method) {
			return route.handle({ event, resolve });
		}

		const tokens = await config.session.getTokens(event);

		if (!tokens) {
			throw redirect(302, ROUTE_PATH_LOGIN);
		}

		return refresh.ensureValidToken(event, tokens, () => resolve(event));
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
			refreshEndpoint: body.token_endpoint,
		},
	};
}
