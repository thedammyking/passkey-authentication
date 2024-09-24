import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";
import { clsx, type ClassValue } from "clsx";
import { customType, pgTableCreator } from "drizzle-orm/pg-core";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator(
  (name) => `passkey-authentication_${name}`,
);

export const bytea = customType<{
  data: Uint8Array;
  driverData: Buffer;
  notNull: false;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
  toDriver(val: Uint8Array) {
    // Convert Uint8Array to Buffer
    return Buffer.from(val);
  },
  fromDriver(val: Buffer) {
    // Convert Buffer to Uint8Array
    return new Uint8Array(val);
  },
});

export const getPasskeyVerificationInputSchema = <T>() =>
  z.object({
    email: z.string().email(),
    attestationResponse: z.any() as z.ZodType<T>,
  });
