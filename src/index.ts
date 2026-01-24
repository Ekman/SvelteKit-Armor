import { error, redirect, type Handle } from "@sveltejs/kit";
import { ROUTE_PATH_LOGIN } from "./routes/login";
import type { ArmorConfig } from "./contracts";
import { ROUTE_PATH_LOGOUT } from "./routes/logout";
import { routeCreate } from "./routes/routes";

export const ARMOR_LOGIN = ROUTE_PATH_LOGIN;
export const ARMOR_LOGOUT = ROUTE_PATH_LOGOUT;

export function armor(config: ArmorConfig): Handle {
	const routes = routeCreate(config);

	return async ({ event, resolve }) => {
		const routeHandle = routes.get(event.url.pathname);

		if (routeHandle) {
			await routeHandle({ event, resolve });

			// Handle should redirect. If it doesn't, something is wrong.
			throw error(500, "Illegal state");
		}

		const sessionExists = await config.session.exists(event);

		if (!sessionExists) {
			throw redirect(302, ROUTE_PATH_LOGIN);
		}

		return resolve(event);
	}
}
