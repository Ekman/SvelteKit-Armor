import { redirect } from "@sveltejs/kit";
import type { ArmorConfig } from "../contracts";
import { queryParamsCreate } from "@nekm/core";
import { ROUTE_PATH_REDIRECT_LOGIN } from "./redirect-login";
import { randomUUID } from "node:crypto";
import type { RouteFactory } from "./routes";
import { COOKIE_STATE, cookieSet } from "../utils/cookie";
import { urlConcat } from "../utils/utils";

export const ROUTE_PATH_LOGIN = "/_auth/login";

export const routeLoginFactory: RouteFactory = (config: ArmorConfig) => {
	const authorizeUrl = `${config.oauth.baseUrl}/${config.oauth.authorizePath ?? "/oauth2/authorize"}`;

	return {
		path: ROUTE_PATH_LOGIN,
		async handle({ event }) {
			const state = randomUUID();
			cookieSet(event.cookies, COOKIE_STATE, state);

			const params = queryParamsCreate({
				client_id: config.oauth.clientId,
				response_type: "code",
				redirect_uri: urlConcat(event.url.origin, ROUTE_PATH_REDIRECT_LOGIN),
				state,
			});

			throw redirect(302, `${authorizeUrl}?${params}`);
		},
	};
};
