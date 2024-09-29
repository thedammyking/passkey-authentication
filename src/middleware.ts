// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { User } from "./server/db/schema";
import { cookies } from "next/headers";
import { SESSION_OPTIONS } from "./lib/constants";

const authRoutes: string[] = ["/get-started"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(path);

  const session = await getIronSession<{ user: User }>(
    cookies(),
    SESSION_OPTIONS,
  );

  if (isAuthRoute && session?.user) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
