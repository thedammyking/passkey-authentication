import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers, cookies } from "next/headers";
import { cache } from "react";

import { createCaller, type AppRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createQueryClient } from "./query-client";
import { getIronSession } from "iron-session";
import { SESSION_OPTIONS } from "@/lib/constants";
import type { SessionData } from "@/types";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);

  return createTRPCContext({
    headers: heads,
    session,
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
