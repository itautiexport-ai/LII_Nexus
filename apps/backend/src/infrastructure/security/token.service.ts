import crypto from "crypto";

/* Refresh tokens are opaque random strings. We store only a SHA-256 hash of
   the token server-side, so a DB leak alone does not expose usable tokens,
   and revocation is a simple row update. */
export const RefreshTokenService = {
  generate(): string {
    return crypto.randomBytes(48).toString("hex");
  },
  hash(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  },
};
