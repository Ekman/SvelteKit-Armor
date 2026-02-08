import { ArmorConfig } from "../contracts";
import {
	jwtDecrypt,
	JWTPayload,
	jwtVerify,
	JWTVerifyGetKey,
	JWTVerifyOptions,
} from "jose";

export function jwtVerifyAndDecryptIdToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	idToken: string,
): Promise<JWTPayload> {
	return jwtVerifyAndDecryptToken(
		config,
		jwks,
		{
			issuer: config.oauth.issuer,
			audience: config.oauth.clientId,
		},
		idToken,
	);
}

export function jwtVerifyAndDecryptAccessToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	accessToken: string,
): Promise<JWTPayload> {
	return jwtVerifyAndDecryptToken(
		config,
		jwks,
		{ issuer: config.oauth.issuer },
		accessToken,
	);
}

function jwtIsEncryptedToken(token: string): boolean {
	const parts = token.split(".");
	return parts.length === 5;
}

async function jwtVerifyAndDecryptToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	opts: JWTVerifyOptions,
	token: string,
): Promise<JWTPayload> {
	if (jwtIsEncryptedToken(token)) {
		const secret = new TextEncoder().encode(config.oauth.clientSecret);
		const { payload } = await jwtDecrypt(token, secret, opts);
		return payload;
	}

	const { payload } = await jwtVerify(token, jwks, opts);
	return payload;
}
