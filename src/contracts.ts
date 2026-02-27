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
	readonly accessToken: ArmorAccessToken | string;
	readonly expiresAt: Date;
}

interface OauthBaseUrl {
	readonly baseUrl: string;

	readonly jwksEndpoint?: never;
	readonly authorizeEndpoint?: never;
	readonly logoutEndpoint?: never;
	readonly tokenEndpoint?: never;
	readonly refreshEndpoint?: never;
}

interface OauthEndpoints {
	readonly baseUrl?: never;

	readonly jwksEndpoint: string;
	readonly authorizeEndpoint: string;
	readonly logoutEndpoint?: string;
	readonly tokenEndpoint: string;
	readonly refreshEndpoint: string;
}

type OauthEndpointsOrBaseUrl = OauthBaseUrl | OauthEndpoints;
type LoggerFunction = (
	message: string,
	params?: Record<string, unknown>,
) => void;

export interface ArmorConfig {
	readonly session: {
		readonly login: (
			event: RequestEvent,
			tokens: ArmorTokens,
		) => Promise<void> | void;
		readonly logout: (event: RequestEvent) => Promise<void> | void;
		readonly getTokens: (
			event: RequestEvent,
		) => Promise<ArmorTokens | undefined> | ArmorTokens | undefined;
	};
	readonly oauth: OauthEndpointsOrBaseUrl & {
		readonly clientId: string;
		readonly clientSecret: string;
		readonly issuer: string;
		readonly scope?: string;
		readonly audience?: string;
		/**
		 * When redirecting a user to the oauth logout flow,
		 * what should we name the return to parameter? I.e.
		 * the parameter that decides where to redirect the
		 * user back.
		 * @default {string} logout_uri
		 */
		readonly logoutReturnToParam?: string;
		/**
		 * If an error occurs, where should we redirect the
		 * user? Should be an internal path. There'll be more
		 * information as query parameters:
		 * 1. error
		 * 2. error_description
		 * @default {undefined} Armor will throw an error
		 */
		readonly errorLoginRedirectPath?: string;
	};
	readonly logger?: {
		readonly debug?: LoggerFunction;
		readonly info?: LoggerFunction;
		readonly warning?: LoggerFunction;
		readonly error?: LoggerFunction;
	};
}

export interface ArmorOpenIdConfig extends Pick<ArmorConfig, "session"> {
	readonly oauth: Pick<
		ArmorConfig["oauth"],
		| "clientId"
		| "clientSecret"
		| "scope"
		| "audience"
		| "logoutReturnToParam"
		| "errorLoginRedirectPath"
	> & {
		readonly openIdConfigEndpoint: string;
	};
}
