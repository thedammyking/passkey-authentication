import { env } from "@/env";
import type { getIronSession } from "iron-session";

type SessionOptions = Parameters<typeof getIronSession>[2];

const TTL = 60 * 60 * 24; // 1 day

export const SESSION_OPTIONS: SessionOptions = {
  cookieName: env.COOKIE_NAME,
  password: env.COOKIE_PASSWORD,
  ttl: TTL,
  cookieOptions: {
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: TTL - 60,
    path: "/",
  },
};
