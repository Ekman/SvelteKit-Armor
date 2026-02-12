import { ArmorConfig } from "../contracts";
import { JWTPayload, jwtVerify, JWTVerifyGetKey, JWTVerifyOptions } from "jose";
import {throwIfUndefined} from "@nekm/core";
import {JWTInvalid} from "jose/errors";

function jwtIsCompactJwt(token: string): boolean {
	// Must be three base64url segments
	const parts = token.trim().split('.');
	return parts.length === 3 && parts.every(p => p.length > 0);
}

export function jwtVerifyIdToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	idToken: string,
): Promise<JWTPayload> {
	const payload = jwtVerifyToken(
		jwks,
		{
			issuer: config.oauth.issuer,
			audience: config.oauth.clientId,
		},
		idToken,
	);
	throwIfUndefined(payload);
	return payload;
}

export function jwtVerifyAccessToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	accessToken: string,
): Promise<JWTPayload | undefined> {
	const opts: JWTVerifyOptions = { issuer: config.oauth.issuer };

	if (config.oauth.audience) {
		opts.audience = config.oauth.audience;
	}

	return jwtVerifyToken(jwks, opts, accessToken);
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

		const {payload} = await jwtVerify(token, jwks, opts);
		return payload;
	} catch (e) {
		if (e instanceof JWTInvalid && /compact JWS/ig.test(e.message)) {
			return undefined;
		}

		throw e;
	}
}
