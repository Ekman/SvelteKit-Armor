import {error, redirect, type Handle, RequestEvent} from "@sveltejs/kit";
import { ROUTE_PATH_LOGIN } from "./routes/login";
import type {ArmorConfig, ArmorTokens} from "./contracts";
import { ROUTE_PATH_LOGOUT } from "./routes/logout";
import { routeCreate } from "./routes/routes";
import {COOKIE_TOKENS, cookieGet} from "./utils/cookie";
import {throwIfUndefined} from "@nekm/core";

export const ARMOR_LOGIN = ROUTE_PATH_LOGIN;
export const ARMOR_LOGOUT = ROUTE_PATH_LOGOUT;

export function armor(config: ArmorConfig): Handle {
	const routes = routeCreate(config);
	const sessionExists = config.session.exists
		?? ((event) => Boolean(event.cookies.get(COOKIE_TOKENS)))

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
	}
}

export function armorGetTokens(event: RequestEvent): ArmorTokens {
	const tokens = cookieGet<ArmorTokens>(event.cookies, COOKIE_TOKENS);
	throwIfUndefined(tokens);
	return tokens;
}
