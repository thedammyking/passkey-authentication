/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import TempStore from "@/lib/temp-store";
import type {
  ExistingUserVerificationInput,
  GenerateOptionsResponse,
  NewUserVerificationInput,
  PublicKeyCredentialOptions,
  VerifyResponse,
} from "@/types";
import { getPasskeyVerificationInputSchema } from "@/lib/utils";
import { PasskeyService } from "@/server/api/services/PasskeyService";
import { UserService } from "@/server/api/services/UserService";

const publicKeyCredentialOptionsStore =
  new TempStore<PublicKeyCredentialOptions>();

export const passkeyRouter = createTRPCRouter({
  generateOptions: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }): Promise<GenerateOptionsResponse> => {
      try {
        const userService = new UserService(ctx.db);
        const passkeyService = new PasskeyService(ctx.db, userService);

        const options = await passkeyService.generateOptions(input.email);
        const isNewUser = await userService.isNewUser(input.email);

        publicKeyCredentialOptionsStore.set(input.email, options);

        return { data: { options, isNewUser } };
      } catch (error) {
        return { error: (error as Error).message };
      }
    }),

  verify: publicProcedure
    .input(
      getPasskeyVerificationInputSchema<
        RegistrationResponseJSON | AuthenticationResponseJSON
      >(),
    )
    .query(async ({ ctx, input }): Promise<VerifyResponse> => {
      try {
        const userService = new UserService(ctx.db);
        const passkeyService = new PasskeyService(ctx.db, userService);

        const credentialOptions = publicKeyCredentialOptionsStore.get(
          input.email,
        );
        if (!credentialOptions) {
          return { error: "Authentication failed" };
        }

        const result = await passkeyService.verifyPasskey(
          input as NewUserVerificationInput | ExistingUserVerificationInput,
          credentialOptions,
        );

        publicKeyCredentialOptionsStore.remove(input.email);

        return result;
      } catch (error) {
        return { error: (error as Error).message };
      }
    }),
});
