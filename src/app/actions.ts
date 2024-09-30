"use server";

import { SESSION_OPTIONS } from "@/lib/constants";
import { api } from "@/trpc/server";
import type { SessionData } from "@/types";
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
  return await api.passkey.verify({
    email,
    attestationResponse,
  });
}

export async function getSessionData() {
  return await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
}

export async function logout() {
  const session = await getSessionData();
  session.destroy();
}
