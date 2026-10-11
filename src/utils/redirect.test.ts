import { describe, expect, it } from "vitest";
import { isRedirect } from "@sveltejs/kit";
import { redirectExternal } from "./redirect";

describe("redirectExternal", () => {
	it("redirects to an external URL", () => {
		const url = "https://idp.example.com/authorize?x=1";

		let thrown: unknown;
		try {
			redirectExternal(302, url);
		} catch (e) {
			thrown = e;
		}

		expect(isRedirect(thrown)).toBe(true);
		expect(thrown).toMatchObject({ status: 302, location: url });
	});
});
