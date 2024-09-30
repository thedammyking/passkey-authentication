import { type User, passkeys } from "@/server/db/schema";
import {
  type ExistingUserVerificationInput,
  type NewUserVerificationInput,
  type VerifyResponse,
} from "@/types";
import { type PublicKeyCredentialOptions } from "@/types";
import { env } from "@/env";
import type { db } from "@/server/db";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import {
  type AuthenticatorTransportFuture,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import { eq } from "drizzle-orm";
import type { UserService } from "./UserService";

export class PasskeyService {
  constructor(
    private db: db,
    private userService: UserService,
  ) {}

  async generateOptions(email: string): Promise<PublicKeyCredentialOptions> {
    const user = await this.userService.findUserByEmail(email);

    return user
      ? this.generateAuthentication(user.id)
      : this.generateRegistration(email);
  }

  private async generateRegistration(
    email: string,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return await generateRegistrationOptions({
      rpName: env.RP_NAME,
      rpID: env.RP_ID,
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

  private async generateAuthentication(
    userId: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const userPasskeys = await this.db
      .select()
      .from(passkeys)
      .where(eq(passkeys.userId, userId));
    return await generateAuthenticationOptions({
      rpID: env.RP_ID,
      allowCredentials: userPasskeys.map((passkey) => ({
        id: passkey.credentialId,
        transports: passkey.transports.split(
          ",",
        ) as AuthenticatorTransportFuture[],
      })),
    });
  }

  async verifyPasskey(
    input: NewUserVerificationInput | ExistingUserVerificationInput,
    credentialOptions: PublicKeyCredentialOptions,
  ): Promise<VerifyResponse> {
    const isNewUser = await this.userService.isNewUser(input.email);

    return isNewUser
      ? this.handleNewUserRegistration(
          input as NewUserVerificationInput,
          credentialOptions as PublicKeyCredentialCreationOptionsJSON,
        )
      : this.handleExistingUserAuthentication(
          input as ExistingUserVerificationInput,
          credentialOptions as PublicKeyCredentialRequestOptionsJSON,
        );
  }

  private async handleNewUserRegistration(
    input: NewUserVerificationInput,
    credentialOptions: PublicKeyCredentialCreationOptionsJSON,
  ): Promise<VerifyResponse> {
    const verification = await verifyRegistrationResponse({
      response: input.attestationResponse,
      expectedChallenge: credentialOptions.challenge,
      expectedOrigin: env.RP_ORIGIN,
      expectedRPID: env.RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { error: "Authentication failed" };
    }

    const newUser = await this.userService.createUser(input.email);
    if (!newUser) {
      return { error: "User creation failed" };
    }

    await this.createNewPasskey(
      newUser,
      input,
      credentialOptions,
      verification.registrationInfo,
    );

    return { data: { verified: true, user: newUser } };
  }

  private async handleExistingUserAuthentication(
    input: ExistingUserVerificationInput,
    credentialOptions: PublicKeyCredentialRequestOptionsJSON,
  ): Promise<VerifyResponse> {
    const user = await this.userService.findUserByEmail(input.email);
    if (!user) {
      return { error: "User not found" };
    }

    const passkey = await this.db.query.passkeys.findFirst({
      where: eq(passkeys.credentialId, input.attestationResponse.id),
    });

    if (!passkey) {
      return { error: "Passkey not found" };
    }

    const verification = await verifyAuthenticationResponse({
      response: input.attestationResponse,
      expectedChallenge: credentialOptions.challenge,
      expectedOrigin: env.RP_ORIGIN,
      expectedRPID: env.RP_ID,
      authenticator: {
        credentialID: passkey.credentialId,
        credentialPublicKey: passkey.publicKey,
        counter: Number(passkey.counter),
        transports: passkey.transports.split(
          ",",
        ) as AuthenticatorTransportFuture[],
      },
    });

    if (!verification.verified) {
      return { error: "Authentication failed" };
    }

    await this.updatePasskeyCounter(input, verification);

    return { data: { verified: true, user } };
  }

  private async createNewPasskey(
    user: User,
    input: NewUserVerificationInput,
    credentialOptions: PublicKeyCredentialCreationOptionsJSON,
    registrationInfo: VerifiedRegistrationResponse["registrationInfo"],
  ): Promise<void> {
    if (!registrationInfo) return;
    await this.db.insert(passkeys).values({
      userId: user.id,
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

  private async updatePasskeyCounter(
    input: ExistingUserVerificationInput,
    verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>,
  ): Promise<void> {
    await this.db
      .update(passkeys)
      .set({ counter: BigInt(verification.authenticationInfo.newCounter) })
      .where(eq(passkeys.credentialId, input.attestationResponse.id));
  }
}
