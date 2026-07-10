import { redirect, type RequestEvent } from "@sveltejs/kit";
import type { ArmorConfig } from "../contracts";
import { queryParamsCreate } from "@nekm/core";
import { ROUTE_PATH_REDIRECT_LOGIN } from "./redirect-login";
import { randomUUID } from "node:crypto";
import type { RouteFactory } from "./routes";
import { COOKIE_STATE, cookieSet } from "../utils/cookie";
import { urlConcat } from "../utils/utils";
import { ARMOR_LOGIN } from "../browser";

export const ROUTE_PATH_LOGIN = ARMOR_LOGIN;

export function loginPathWithRedirect(event: RequestEvent): string {
	const redirectTo = event.url.pathname + event.url.search;
	return `${ROUTE_PATH_LOGIN}?${queryParamsCreate({ redirect: redirectTo })}`;
}

export const routeLoginFactory: RouteFactory = (config: ArmorConfig) => {
	const authorizeEndpoint =
		config.oauth.authorizeEndpoint ??
		urlConcat(config.oauth.baseUrl, "oauth2/authorize");

	const scope = config.oauth.scope ?? "openid profile email";

	return {
		path: ROUTE_PATH_LOGIN,
		async handle({ event }) {
			const state = randomUUID();
			cookieSet(event.cookies, COOKIE_STATE, state);

			const redirectTo = event.url.searchParams.get("redirect") ?? undefined;

			if (redirectTo) {
				await config.session.setRedirect(event, redirectTo);
			}

			const params = {
				client_id: config.oauth.clientId,
				response_type: "code",
				redirect_uri: urlConcat(event.url.origin, ROUTE_PATH_REDIRECT_LOGIN),
				state,
				scope,
				audience: config.oauth.audience,
			};

			const paramsStr = queryParamsCreate(params);

			config.logger?.debug?.("Pre login redirect.", { params, state });

			throw redirect(302, `${authorizeEndpoint}?${paramsStr}`);
		},
	};
};
