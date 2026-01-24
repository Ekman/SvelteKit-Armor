import {ArmorConfig} from "../contracts";
import {jwtVerify, JWTVerifyGetKey, JWTVerifyOptions} from "jose";

export function jwtVerifyIdToken(config: ArmorConfig, jwks: JWTVerifyGetKey, idToken: string) {
	return jwtVerifyToken(
		jwks,
		{
			issuer: config.oauth.issuer,
			audience: config.oauth.clientId,
		},
		idToken,
	);
}

export function jwtVerifyAccessToken(config: ArmorConfig, jwks: JWTVerifyGetKey, accessToken: string) {
	return jwtVerifyToken(jwks, { issuer: config.oauth.issuer }, accessToken);
}

async function jwtVerifyToken(jwks: JWTVerifyGetKey, options: JWTVerifyOptions, token: string) {
	const { payload } = await jwtVerify(token, jwks, options);

	return payload;
}
