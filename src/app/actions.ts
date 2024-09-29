/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { SESSION_OPTIONS } from "@/lib/constants";
import type { User } from "@/server/db/schema";
import { api } from "@/trpc/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export async function generateOptions(email: string) {
  return await api.passkey.generateOptions({ email });
}

export async function verifyAttestationResponse(
  email: string,
  attestationResponse: RegistrationResponseJSON | AuthenticationResponseJSON,
) {
  const { data, error } = await api.passkey.verify({
    email,
    attestationResponse,
  });

  if (data?.user && data?.verified) {
    const session = await getSessionData();
    session.user = data.user;
    await session.save();
  }

  return { data: { verified: !!data?.verified }, error };
}

export async function getSessionData() {
  return await getIronSession<{ user: User | null }>(
    cookies(),
    SESSION_OPTIONS,
  );
}

export async function logout() {
  const session = await getSessionData();
  session.destroy();
}
