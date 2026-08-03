import bcrypt from "bcryptjs";
import { env } from "../../config/env";

export const BcryptService = {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, env.bcryptSaltRounds);
  },
  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
};
