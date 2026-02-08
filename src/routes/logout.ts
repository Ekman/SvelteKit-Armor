import { redirect } from "@sveltejs/kit";
import type { ArmorConfig } from "../contracts";
import { queryParamsCreate } from "@nekm/core";
import { ROUTE_PATH_REDIRECT_LOGOUT } from "./redirect-logout";
import type { RouteFactory } from "./routes";
import { urlConcat } from "../utils/utils";

export const ROUTE_PATH_LOGOUT = "/_armor/logout";

export const routeLogoutFactory: RouteFactory = (config: ArmorConfig) => {
	// Check if the oauth provider supports a logout path.
	if (!config.oauth.logoutPath) {
		return undefined;
	}

	const logoutUrl = urlConcat(config.oauth.baseUrl, config.oauth.logoutPath);

	return {
		path: ROUTE_PATH_LOGOUT,
		async handle({ event }) {
			const params = queryParamsCreate({
				logout_uri: urlConcat(event.url.origin, ROUTE_PATH_REDIRECT_LOGOUT),
				client_id: config.oauth.clientId,
			});

			throw redirect(302, `${logoutUrl}?${params}`);
		},
	};
};
