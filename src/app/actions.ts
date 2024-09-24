"use server";

import { api } from "@/trpc/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";

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
