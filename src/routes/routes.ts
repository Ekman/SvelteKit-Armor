import type { Handle } from "@sveltejs/kit";
import type { ArmorConfig } from "../contracts";
import { routeLoginFactory } from "./login";
import { routeLogoutFactory } from "./logout";
import { routeRedirectLogoutFactory } from "./redirect-logout";
import { routeRedirectLoginFactory } from "./redirect-login";

export interface Route {
	readonly path: string;
	readonly handle: Handle;
}

export type RouteFactory = (config: ArmorConfig) => Route | undefined;

const routeFactories = Object.freeze([
	routeLoginFactory,
	routeLogoutFactory,
	routeRedirectLoginFactory,
	routeRedirectLogoutFactory,
]);

export function routeCreate(config: ArmorConfig): Map<string, Handle> {
	return new Map(
		routeFactories
			.map(routeFactory => routeFactory(config))
			.filter(route => Boolean(route))
			// @ts-expect-error Incorrect typing error.
			.map(route => [route.path, route.handle]),
	);
}
