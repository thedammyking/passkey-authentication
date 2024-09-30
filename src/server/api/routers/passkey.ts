import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import type {
  ExistingUserVerificationInput,
  GenerateOptionsResponse,
  NewUserVerificationInput,
  VerifyResponse,
} from "@/types";
import { getPasskeyVerificationInputSchema } from "@/lib/utils";
import { PasskeyService } from "@/server/api/services/PasskeyService";
import { UserService } from "@/server/api/services/UserService";

export const passkeyRouter = createTRPCRouter({
  generateOptions: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }): Promise<GenerateOptionsResponse> => {
      try {
        const userService = new UserService(ctx.db);
        const passkeyService = new PasskeyService(ctx.db, userService);

        const options = await passkeyService.generateOptions(input.email);
        const isNewUser = await userService.isNewUser(input.email);

        ctx.session.credentialOptions = options;
        await ctx.session.save();

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

        const credentialOptions = ctx.session.credentialOptions;

        if (!credentialOptions) {
          return { error: "Authentication failed" };
        }

        const result = await passkeyService.verifyPasskey(
          input as NewUserVerificationInput | ExistingUserVerificationInput,
          credentialOptions,
        );

        ctx.session.credentialOptions = null;
        ctx.session.user = result.data?.user ?? null;
        await ctx.session.save();

        return result;
      } catch (error) {
        return { error: (error as Error).message };
      }
    }),
});
