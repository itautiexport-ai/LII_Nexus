import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface AccessTokenPayload {
  sub: string;      // user id
  email: string;
  roles: string[];
}

export const JwtService = {
  signAccessToken(payload: AccessTokenPayload): string {
    const options: jwt.SignOptions = { expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"] };
    return jwt.sign(payload, env.jwt.accessSecret, options);
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
  },
};
