import { bytea, createTable } from "@/lib/utils";
import {
  uuid,
  varchar,
  uniqueIndex,
  bigint,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const passkeys = createTable(
  "passkey",
  {
    id: uuid("id").unique().primaryKey().defaultRandom(),
    credentialId: varchar("credential_id", { length: 255 }).notNull(),
    publicKey: bytea("public_key").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    webAuthnUserId: varchar("webauthn_user_id", { length: 255 }).notNull(),
    deviceType: varchar("device_type", { length: 255 }).notNull(),
    counter: bigint("counter", { mode: "bigint" }).notNull(),
    backupStatus: boolean("backup_status").notNull(),
    transports: varchar("transports", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (passkey) => ({
    userIdIndex: uniqueIndex("user_id_idx").on(passkey.userId),
  }),
);

export type Passkey = typeof passkeys.$inferInsert;
