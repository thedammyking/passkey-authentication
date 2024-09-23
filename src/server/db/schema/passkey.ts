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
    publicKey: bytea("public_key"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    counter: bigint("counter", { mode: "bigint" }).notNull(),
    backupStatus: boolean("backup_status").notNull(),
    transports: varchar("transports", { length: 255 }),
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
