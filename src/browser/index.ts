import { ArmorRefreshError } from "../errors";

export interface ArmorBrowserRefresh {
	readonly idToken: string;
	readonly accessToken: string;
	readonly expiresAt: Date;
}

export const ARMOR_REFRESH = "/_armor/refresh";
export const ARMOR_LOGIN = "/_armor/login";

export async function armorBrowserRefresh(): Promise<ArmorBrowserRefresh> {
	const response = await fetch(ARMOR_REFRESH, {
		method: "POST",
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		if (response.status === 401) {
			// eslint-disable-next-line no-undef
			window.location.href = ARMOR_LOGIN;
			throw new ArmorRefreshError("Redirecting to login");
		}

		const error = await response.text();
		throw new ArmorRefreshError(`Could not refresh token: ${error}`);
	}

	return response.json();
}
