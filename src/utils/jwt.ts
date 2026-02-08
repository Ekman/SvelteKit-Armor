import { ArmorConfig } from "../contracts";
import {
	JWTPayload,
	jwtVerify,
	JWTVerifyGetKey,
	JWTVerifyOptions,
} from "jose";

export function jwtVerifyIdToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	idToken: string,
): Promise<JWTPayload> {
	return jwtVerifyToken(
		config,
		jwks,
		{
			issuer: config.oauth.issuer,
			audience: config.oauth.clientId,
		},
		idToken,
	);
}

export function jwtVerifyAccessToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	accessToken: string,
): Promise<JWTPayload> {
	const opts: JWTVerifyOptions = { issuer: config.oauth.issuer };

	if (config.oauth.audience) {
		opts.audience = config.oauth.audience;
	}

	return jwtVerifyToken(
		config,
		jwks,
		opts,
		accessToken,
	);
}

async function jwtVerifyToken(
	config: ArmorConfig,
	jwks: JWTVerifyGetKey,
	opts: JWTVerifyOptions,
	token: string,
): Promise<JWTPayload> {
	const { payload } = await jwtVerify(token, jwks, opts);
	return payload;
}
