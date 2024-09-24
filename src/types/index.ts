import type { getPasskeyVerificationInputSchema } from "@/lib/utils";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
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
  verificationToken: string;
  verified: boolean;
}>;

export type NewUserVerificationInput = z.infer<
  ReturnType<typeof getPasskeyVerificationInputSchema<RegistrationResponseJSON>>
>;

export type ExistingUserVerificationInput = z.infer<
  ReturnType<
    typeof getPasskeyVerificationInputSchema<AuthenticationResponseJSON>
  >
>;
