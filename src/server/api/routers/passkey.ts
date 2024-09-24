/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { type Passkey, passkeys, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { RP_ID, RP_NAME, RP_ORIGIN } from "@/lib/constants";
import TempStore from "@/lib/temp-store";
import { db } from "@/server/db";
import type {
  ExistingUserVerificationInput,
  GenerateOptionsResponse,
  NewUserVerificationInput,
  PublicKeyCredentialOptions,
  VerifyResponse,
} from "@/types";
import { getPasskeyVerificationInputSchema } from "@/lib/utils";
import jwt from "@/lib/jwt";
import { type Context } from "@/server/api/trpc";
import { type VerifiedRegistrationResponse } from "@simplewebauthn/server";

const publicKeyCredentialOptionsStore =
  new TempStore<PublicKeyCredentialOptions>();

// Helper function to generate registration options
async function generateRegistration(
  email: string,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  return await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: email,
    attestationType: "none",
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });
}

// Helper function to generate authentication options
async function generateAuthentication(
  userId: string,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const userPasskeys = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.userId, userId));
  return await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: userPasskeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports.split(
        ",",
      ) as AuthenticatorTransportFuture[],
    })),
  });
}

async function handleNewUserRegistration(
  ctx: Context,
  input: NewUserVerificationInput,
  credentialOptions: PublicKeyCredentialCreationOptionsJSON,
  verification: VerifiedRegistrationResponse,
): Promise<VerifyResponse> {
  const newUser = (
    await ctx.db.insert(users).values({ email: input.email }).returning()
  )[0];
  const { registrationInfo } = verification;

  if (newUser && registrationInfo) {
    await ctx.db.insert(passkeys).values({
      userId: newUser.id,
      webAuthnUserId: credentialOptions.user.id,
      credentialId: registrationInfo.credentialID,
      publicKey: registrationInfo.credentialPublicKey,
      counter: BigInt(registrationInfo.counter),
      deviceType: registrationInfo.credentialDeviceType,
      backupStatus: registrationInfo.credentialBackedUp,
      transports:
        input.attestationResponse.response.transports?.join(",") ?? "",
    });
  }

  const verificationToken = jwt.encode({ userId: newUser?.id });
  publicKeyCredentialOptionsStore.remove(input.email);

  return {
    data: {
      verificationToken,
      verified: true,
    },
  };
}

async function handleExistingUserAuthentication(
  ctx: Context,
  user: { id: string },
  input: ExistingUserVerificationInput,
  credentialOptions: PublicKeyCredentialRequestOptionsJSON,
  passkey: Passkey,
): Promise<VerifyResponse> {
  const verification = await verifyAuthenticationResponse({
    response: input.attestationResponse,
    expectedChallenge: credentialOptions.challenge,
    expectedOrigin: RP_ORIGIN,
    expectedRPID: RP_ID,
    authenticator: {
      credentialID: passkey.credentialId,
      credentialPublicKey: passkey.publicKey,
      counter: Number(passkey.counter),
      transports: passkey.transports.split(
        ",",
      ) as AuthenticatorTransportFuture[],
    },
  });

  if (verification.verified) {
    await ctx.db
      .update(passkeys)
      .set({ counter: BigInt(verification.authenticationInfo.newCounter) })
      .where(eq(passkeys.credentialId, input.attestationResponse.id));

    const verificationToken = jwt.encode({ userId: user.id });
    publicKeyCredentialOptionsStore.remove(input.email);

    return {
      data: {
        verificationToken,
        verified: verification.verified,
      },
    };
  }

  return { error: "Assertion verification failed" };
}

export const passkeyRouter = createTRPCRouter({
  generateOptions: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .query(async ({ ctx, input }): Promise<GenerateOptionsResponse> => {
      try {
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.email, input.email),
        });
        const isNewUser = !user;
        const options = isNewUser
          ? await generateRegistration(input.email)
          : await generateAuthentication(user.id);

        publicKeyCredentialOptionsStore.set(
          isNewUser ? input.email : user.id,
          options,
        );
        return {
          data: { options, isNewUser },
        };
      } catch (error) {
        const _error = error as Error;
        return {
          error: _error.message,
        };
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
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.email, input.email),
        });

        const isNewUser = !user;

        const credentialOptions = publicKeyCredentialOptionsStore.get(
          isNewUser ? input.email : user.id,
        );

        if (!credentialOptions) {
          return { error: "No credential options found" };
        }

        if (isNewUser) {
          const verification = await verifyRegistrationResponse({
            response: input.attestationResponse as RegistrationResponseJSON,
            expectedChallenge: credentialOptions.challenge,
            expectedOrigin: RP_ORIGIN,
            expectedRPID: RP_ID,
          });

          return verification.verified
            ? await handleNewUserRegistration(
                ctx,
                input as NewUserVerificationInput,
                credentialOptions as PublicKeyCredentialCreationOptionsJSON,
                verification,
              )
            : { error: "Attestation verification failed" };
        } else {
          const passkey = await ctx.db.query.passkeys.findFirst({
            where: eq(passkeys.credentialId, input.attestationResponse.id),
          });

          if (!passkey) {
            return { error: "Authenticator is not registered with this site" };
          }

          return await handleExistingUserAuthentication(
            ctx,
            user,
            input as ExistingUserVerificationInput,
            credentialOptions as PublicKeyCredentialRequestOptionsJSON,
            passkey,
          );
        }
      } catch (error) {
        const _error = error as Error;
        return {
          error: _error.message,
        };
      }
    }),
});
