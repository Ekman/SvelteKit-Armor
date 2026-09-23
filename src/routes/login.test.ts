import type { RequestEvent } from "@sveltejs/kit";
import { describe, expect, it, vi } from "vitest";
import type { ArmorConfig } from "../contracts";
import { routeLoginFactory } from "./login";

describe("/_armor/login", () => {
	it("forwards prompt to the authorization endpoint", async () => {
		const setRedirect = vi.fn();
		const config = {
			oauth: {
				clientId: "client-id",
				clientSecret: "client-secret",
				issuer: "https://issuer.test",
				jwksEndpoint: "https://issuer.test/jwks",
				authorizeEndpoint: "https://issuer.test/authorize",
				tokenEndpoint: "https://issuer.test/token",
				refreshEndpoint: "https://issuer.test/token",
			},
			session: {
				setRedirect,
			},
		} as unknown as ArmorConfig;
		const event = {
			url: new URL(
				"https://app.test/_armor/login?redirect=/dashboard&prompt=login",
			),
			cookies: { set: vi.fn() },
		} as unknown as RequestEvent;
		const route = routeLoginFactory(config);

		await expect(
			route?.handle({ event, resolve: vi.fn() }),
		).rejects.toMatchObject({
			status: 302,
			location: expect.stringContaining("prompt=login"),
		});

		expect(setRedirect).toHaveBeenCalledWith(event, "/dashboard");
	});
});
