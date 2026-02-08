import { redirect } from "@sveltejs/kit";
import type { ArmorConfig } from "../contracts";
import { queryParamsCreate } from "@nekm/core";
import { ROUTE_PATH_REDIRECT_LOGOUT } from "./redirect-logout";
import type { RouteFactory } from "./routes";
import { urlConcat } from "../utils/utils";
import { randomUUID } from "node:crypto";
import { COOKIE_STATE, cookieSet } from "../utils/cookie";

export const ROUTE_PATH_LOGOUT = "/_armor/logout";

export const routeLogoutFactory: RouteFactory = (config: ArmorConfig) => {
	// Check if the oauth provider supports a logout path.
	if (!config.oauth.logoutEndpoint) {
		return undefined;
	}

	return {
		path: ROUTE_PATH_LOGOUT,
		async handle({ event }) {
			const state = randomUUID();
			cookieSet(event.cookies, COOKIE_STATE, state);

			const params = queryParamsCreate({
				logout_uri: urlConcat(event.url.origin, ROUTE_PATH_REDIRECT_LOGOUT),
				client_id: config.oauth.clientId,
				state,
			});

			throw redirect(302, `${config.oauth.logoutEndpoint}?${params}`);
		},
	};
};
