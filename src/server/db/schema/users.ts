import { createTable } from "@/lib/utils";
import { sql } from "drizzle-orm";
import { uuid, varchar, uniqueIndex, timestamp } from "drizzle-orm/pg-core";

export const users = createTable(
  "user",
  {
    id: uuid("id").unique().primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).unique().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (user) => ({
    emailIndex: uniqueIndex("email_idx").on(user.email),
  }),
);
