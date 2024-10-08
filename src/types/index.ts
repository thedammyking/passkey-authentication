import type { getPasskeyVerificationInputSchema } from "@/lib/utils";
import type { User } from "@/server/db/schema";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { IronSession } from "iron-session";
import type { z } from "zod";

export type ApiResponse<T> =
  | {
      data: T;
      error?: never;
    }
  | {
      data?: never;
      error: string;
    };

export type PublicKeyCredentialOptions =
  | PublicKeyCredentialCreationOptionsJSON
  | PublicKeyCredentialRequestOptionsJSON;

export type GenerateOptionsResponse = ApiResponse<{
  options: PublicKeyCredentialOptions;
  isNewUser: boolean;
}>;

export type VerifyResponse = ApiResponse<{
  verified: boolean;
  user: User;
}>;

export type NewUserVerificationInput = z.infer<
  ReturnType<typeof getPasskeyVerificationInputSchema<RegistrationResponseJSON>>
>;

export type ExistingUserVerificationInput = z.infer<
  ReturnType<
    typeof getPasskeyVerificationInputSchema<AuthenticationResponseJSON>
  >
>;

export type SessionData = {
  user: User | null;
  credentialOptions: PublicKeyCredentialOptions | null;
};

export type Session = IronSession<SessionData>;
