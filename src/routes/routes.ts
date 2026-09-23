import type { Handle } from "@sveltejs/kit";
import type { JWTVerifyGetKey } from "jose";
import type { ArmorConfig, ArmorOauth } from "../contracts";
import { routeLoginFactory } from "./login";
import { routeLogoutFactory } from "./logout";
import { routeRedirectLogoutFactory } from "./redirect-logout";
import { routeRedirectLoginFactory } from "./redirect-login";

export interface Route {
	readonly path: string;
	readonly handle: Handle;
}

export type RouteFactory = (
	config: ArmorConfig,
	oauth: ArmorOauth,
	jwks: JWTVerifyGetKey,
) => Route | undefined;

const routeFactories = Object.freeze([
	routeLoginFactory,
	routeLogoutFactory,
	routeRedirectLoginFactory,
	routeRedirectLogoutFactory,
]);

export function routeByPathFactory(
	config: ArmorConfig,
	oauth: ArmorOauth,
	jwks: JWTVerifyGetKey,
): Map<string, Route> {
	// @ts-expect-error Incorrect typing error.
	return new Map(
		routeFactories
			.map((routeFactory) => routeFactory(config, oauth, jwks))
			.filter((route) => Boolean(route))
			// @ts-expect-error Incorrect typing error.
			.map((route) => [route.path, route]),
	);
}
