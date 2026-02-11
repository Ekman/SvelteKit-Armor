import type { RequestEvent } from "@sveltejs/kit";
import type { JWTPayload } from "jose";

// OAuth 2.0 Token Response (RFC 6749 §5.1)
export interface ArmorTokenExchange {
	readonly access_token: string;
	readonly id_token: string;
	readonly token_type: "Bearer";
	readonly expires_in: number;
	readonly refresh_token?: string;
	readonly scope?: string;
}

// Generic OIDC ID Token Claims
export type ArmorIdToken = Required<
	Pick<JWTPayload, "iss" | "sub" | "aud" | "exp" | "iat">
> &
	Omit<JWTPayload, "iss" | "sub" | "aud" | "exp" | "iat">;

export interface ArmorAccessToken extends JWTPayload {
	client_id?: string;
	scope?: string;
	version?: number;
}

export interface ArmorTokens {
	readonly exchange: ArmorTokenExchange;
	readonly idToken: ArmorIdToken;
	readonly accessToken: ArmorAccessToken;
}

interface OauthBaseUrl {
	readonly baseUrl: string;

	readonly jwksEndpoint?: never;
	readonly authorizeEndpoint?: never;
	readonly logoutEndpoint?: never;
	readonly tokenEndpoint?: never;
}

interface OauthEndpoints {
	readonly baseUrl?: never;

	readonly jwksEndpoint: string;
	readonly authorizeEndpoint: string;
	readonly logoutEndpoint?: string;
	readonly tokenEndpoint: string;
	readonly logoutReturnToParam?: string;
}

type OauthEndpointsOrBaseUrl = OauthBaseUrl | OauthEndpoints;

export interface ArmorConfig {
	readonly session: {
		readonly exists: (event: RequestEvent) => Promise<boolean> | boolean;
		readonly login: (
			event: RequestEvent,
			tokens: ArmorTokens,
		) => Promise<void> | void;
		readonly logout: (event: RequestEvent) => Promise<void> | void;
	};
	readonly oauth: OauthEndpointsOrBaseUrl & {
		readonly clientId: string;
		readonly clientSecret: string;
		readonly issuer: string;
		readonly scope?: string;
		readonly audience?: string;
	};
}

export interface ArmorOpenIdConfig extends Pick<ArmorConfig, "session"> {
	readonly oauth: Pick<
		ArmorConfig["oauth"],
		"clientId" | "clientSecret" | "scope" | "audience"
	> & {
		readonly openIdConfigEndpoint: string;
	};
}
