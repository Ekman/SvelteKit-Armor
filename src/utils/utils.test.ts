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
		{
			description: "id token expires sooner than access token",
			idTokenExp: 0,
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

// This is a copy+paste from a ZITADEL token.
describe("shouldRefresh ZITADEL", () => {
	it("should be able to parse an access token", () => {
		const tokens = {
			"exchange": {
				"access_token": "eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJjYWJuNEdsOHNaVk5TSGRmIiwidGFnIjoibmRPTXhkRDNFY1ZVZExSZDFXMlVKUSJ9.oNx0_251UaiMYF7RZ5r9Pp_AON4z_utsSLakXrBZ2AU.6ANFbuJuiVPRddcf.uwFdhfR8Mz1_3rZsDE9iTzhPww3_YT5foGfYz8p-OV057ix-vEmbS0-0Iy1sCwha3nH0eywX-UkSU6dEl5w.6ucQdXicu6W1tWgiZekzpw",
				"token_type": "Bearer",
				"expires_in": 43199,
				"id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM3MzkyNzI4OTI0MDQ3MDI3MyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Rldi1ocWNrdWUuZXUxLnppdGFkZWwuY2xvdWQiLCJzdWIiOiIzNzM5MjcyODg1Njk5NzE0NTciLCJhdWQiOlsiMzczOTI3NjU4MjIxNzQ1MzEwIiwiMzczOTI3NDQ2ODYyNDE0NTkzIl0sImV4cCI6MTc3OTQ3NDUzMiwiaWF0IjoxNzc5NDMxMzMyLCJhdXRoX3RpbWUiOjE3Nzk0MzEyMjIsImFtciI6WyJwd2QiXSwiYXpwIjoiMzczOTI3NjU4MjIxNzQ1MzEwIiwiY2xpZW50X2lkIjoiMzczOTI3NjU4MjIxNzQ1MzEwIiwiYXRfaGFzaCI6ImEwcVpfWGFEQ2VwSWVRcDdIdUxDVFEiLCJzaWQiOiIzNzQwMjMyMzM4OTQxMDIxNzQiLCJuYW1lIjoiWklUQURFTCBBZG1pbiIsImdpdmVuX25hbWUiOiJaSVRBREVMIiwiZmFtaWx5X25hbWUiOiJBZG1pbiIsImxvY2FsZSI6ImVuIiwidXBkYXRlZF9hdCI6MTc3OTM3NDAzMiwicHJlZmVycmVkX3VzZXJuYW1lIjoibmlrbGFzQG5pa2xhc2VrbWFuLnNvbHV0aW9ucyIsImVtYWlsIjoibmlrbGFzQG5pa2xhc2VrbWFuLnNvbHV0aW9ucyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.xVjv5YqlmOEzDL0OSDFo0BEWHtPcEXVZyl8n2EJMSMznqOmuxSfEz42Fu0rY2x2xIDWWiFA4NOb6Pf7lB6k81RuAQyMhA1ZkFUfJFCN3zK-coDY8FIHuI9-8BbT7MaKbjc8y7qMH1Wz9qnen5IdZ7ibisDoZ-k9aR6EISIIB9Zzgj4BebOjHJxzTGKIJWhHXqvpb9b5btTU1Ffy0kgVAbwrkqHjWXomrfQ7njOxjSUZbR2OmFZkzCaYngzkQGo16WQUpCD4NfNrNGt7eNYrj2tbE3_vSE8SaFnYxCYjWo0q9MvC2xGZG6LDvK15KutW7BsdYpvuvVMW2dMykZm_zFw"
			},
			"idToken": {
				"iss": "https://dev-hqckue.eu1.zitadel.cloud",
				"sub": "373927288569971457",
				"aud": [
					"373927658221745310",
					"373927446862414593"
				],
				"exp": 1779474532,
				"iat": 1779431332,
				"auth_time": 1779431222,
				"amr": [
					"pwd"
				],
				"azp": "373927658221745310",
				"client_id": "373927658221745310",
				"at_hash": "a0qZ_XaDCepIeQp7HuLCTQ",
				"sid": "374023233894102174",
				"name": "ZITADEL Admin",
				"given_name": "ZITADEL",
				"family_name": "Admin",
				"locale": "en",
				"updated_at": 1779374032,
				"preferred_username": "hello@niklasekman.solutions",
				"email": "hello@niklasekman.solutions",
				"email_verified": true
			},
			"accessToken": "eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJjYWJuNEdsOHNaVk5TSGRmIiwidGFnIjoibmRPTXhkRDNFY1ZVZExSZDFXMlVKUSJ9.oNx0_251UaiMYF7RZ5r9Pp_AON4z_utsSLakXrBZ2AU.6ANFbuJuiVPRddcf.uwFdhfR8Mz1_3rZsDE9iTzhPww3_YT5foGfYz8p-OV057ix-vEmbS0-0Iy1sCwha3nH0eywX-UkSU6dEl5w.6ucQdXicu6W1tWgiZekzpw",
			"expiresAt": "2026-05-22T18:28:51.185Z"
		}

		const now = new Date(2026, 4, 22, 8, 39, 0);

		expect(shouldRefresh(tokens, now)).toBeFalsy();
	});
});
