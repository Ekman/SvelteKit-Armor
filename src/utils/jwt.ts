import { ArmorConfig, type ArmorIdToken } from "../contracts";
import { JWTPayload, jwtVerify, JWTVerifyGetKey, JWTVerifyOptions } from "jose";
import { throwIfUndefined } from "@nekm/core";

function jwtIsCompactJwt(token: string): boolean {
	// Must be three base64url segments
	const parts = token.trim().split(".");
	return parts.length === 3 && parts.every((p) => p.length > 0);
}

export async function jwtVerifyIdToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	idToken: string,
): Promise<ArmorIdToken> {
	const payload = await jwtVerifyToken(
		jwks,
		{
			issuer: config.oauth.issuer,
			audience: config.oauth.clientId,
		},
		idToken,
	);
	throwIfUndefined(payload);
	return payload as ArmorIdToken;
}

function isInvalidCompactJwt(error: unknown): boolean {
	return Boolean(
		typeof error === "object" &&
		error &&
		"message" in error &&
		typeof error.message === "string" &&
		/invalid compact jws/gi.test(error.message),
	);
}

async function jwtVerifyToken(
	jwks: JWTVerifyGetKey,
	opts: JWTVerifyOptions,
	token: string,
): Promise<JWTPayload | undefined> {
	try {
		if (!jwtIsCompactJwt(token)) {
			return undefined;
		}

		const { payload } = await jwtVerify(token, jwks, opts);
		return payload;
	} catch (error) {
		if (isInvalidCompactJwt(error)) {
			return undefined;
		}

		throw error;
	}
}
