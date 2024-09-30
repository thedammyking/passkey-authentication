import "server-only";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { cache } from "react";
import { createCaller, type AppRouter } from "@/server/api/root";
import { createQueryClient } from "./query-client";
import { createContext } from "@/lib/create-context";

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
