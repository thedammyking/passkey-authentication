import { env } from "@/env";
import { sign, verify } from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

class Jwt {
  private secret: Secret;
  constructor() {
    if (!env.NEXTAUTH_SECRET) {
      throw new Error("NEXTAUTH_SECRET is not set");
    }
    this.secret = env.NEXTAUTH_SECRET;
  }

  public encode<T extends object>(payload: T, options?: SignOptions) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return sign(payload, this.secret, {
      expiresIn: 60 * 10,
      ...options,
    });
  }

  public decode<T>(token: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return verify(token, this.secret) as T;
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new Jwt();
