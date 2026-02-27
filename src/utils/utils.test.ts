import { describe, test, expect, vi, beforeEach, afterEach, it } from "vitest";
import { isTokenExchange, shouldRefresh, urlConcat } from "./utils";

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

const MINUTES_MS = 60 * 1000;
const NOW = 1_000_000_000_000;
const toSeconds = (ms: number) => ms / 1000;

beforeEach(() => vi.setSystemTime(NOW));
afterEach(() => vi.useRealTimers());

describe("shouldRefresh", () => {
	test.each([
		{
			description: "expires in 10 minutes — should not refresh",
			idTokenExp: toSeconds(NOW + 10 * MINUTES_MS),
			accessTokenExp: toSeconds(NOW + 10 * MINUTES_MS),
			expected: false,
		},
		{
			description: "expires in 4 minutes — within 5 min threshold",
			idTokenExp: toSeconds(NOW + 4 * MINUTES_MS),
			accessTokenExp: toSeconds(NOW + 4 * MINUTES_MS),
			expected: true,
		},
		{
			description: "already expired",
			idTokenExp: toSeconds(NOW - MINUTES_MS),
			accessTokenExp: toSeconds(NOW - MINUTES_MS),
			expected: true,
		},
		{
			description: "access token is a string — falls back to idToken exp",
			idTokenExp: toSeconds(NOW + 4 * MINUTES_MS),
			accessTokenExp: "raw-string-token",
			expected: true,
		},
		{
			description: "access token expires sooner than id token",
			idTokenExp: toSeconds(NOW + 10 * MINUTES_MS),
			accessTokenExp: toSeconds(NOW + 2 * MINUTES_MS),
			expected: true,
		},
		{
			description: "id token expires sooner than access token",
			idTokenExp: toSeconds(NOW + 2 * MINUTES_MS),
			accessTokenExp: toSeconds(NOW + 10 * MINUTES_MS),
			expected: true,
		},
	])("$description", ({ idTokenExp, accessTokenExp, expected }) => {
		const tokens = {
			idToken: { exp: idTokenExp },
			accessToken:
				typeof accessTokenExp === "string"
					? accessTokenExp
					: { exp: accessTokenExp },
		};
		// @ts-expect-error It's OK
		expect(shouldRefresh(tokens)).toBe(expected);
	});
});
