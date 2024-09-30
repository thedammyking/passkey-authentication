import "server-only";

import { headers, cookies } from "next/headers";
import { cache } from "react";
import { createTRPCContext } from "@/server/api/trpc";
import { getIronSession } from "iron-session";
import { SESSION_OPTIONS } from "@/lib/constants";
import type { SessionData } from "@/types";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request
 */
export const createContext = cache(async (isRSC = true) => {
  const heads = new Headers(headers());

  //this is to ensure that the tRPC call is made from React Server Component
  if (isRSC) heads.set("x-trpc-source", "rsc");

  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);

  return createTRPCContext({
    headers: heads,
    session,
  });
});
