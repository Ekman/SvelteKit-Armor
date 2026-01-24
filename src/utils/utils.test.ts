import { isTokenExchange, urlConcat } from "./utils";

describe("utils", () => {
	it("should be able to concat URL with path", () => {
		expect(urlConcat("https://foo.example/", "bar")).toBe(
			"https://foo.example/bar",
		);
	});

	it("can detect a valid ArmorTokenExchange", () => {
		const token = {
			access_token: "abc123",
			token_type: "Bearer",
			expires_in: 3600,
		};
		expect(isTokenExchange(token)).toBe(true);
	});
});
