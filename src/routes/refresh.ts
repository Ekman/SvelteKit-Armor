import { error, json } from "@sveltejs/kit";
import type { ArmorConfig } from "../contracts";
import type { RouteFactory } from "./routes";
import { armorCreateRefresh } from "../utils/refresh";
import { ARMOR_REFRESH } from "../browser";
import { ArmorRefreshError } from "../errors";

export const ROUTE_PATH_REFRESH = ARMOR_REFRESH;

export const routeRefreshFactory: RouteFactory = (config: ArmorConfig) => {
	const refresh = armorCreateRefresh(config);

	return {
		path: ROUTE_PATH_REFRESH,
		method: "POST",
		async handle({ event }) {
			try {
				const tokens = await config.session.getTokens(event);

				if (!tokens) {
					return error(401, "Unauthorized");
				}

				return refresh.ensureValidToken(
					event,
					tokens,
					({ idToken, accessToken }) => {
						return json({ idToken, accessToken });
					},
				);
			} catch (ex) {
				if (ex instanceof ArmorRefreshError) {
					return error(401, "Unauthorized");
				}

				throw ex;
			}
		},
	};
};
