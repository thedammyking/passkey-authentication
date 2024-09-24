import { createTable } from "@/lib/utils";
import { sql } from "drizzle-orm";
import {
  uuid,
  varchar,
  uniqueIndex,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

export const users = createTable(
  "user",
  {
    id: uuid("id").unique().primaryKey().defaultRandom(),
    firstname: varchar("firstname", { length: 255 }),
    lastname: varchar("lastname", { length: 255 }),
    gender: varchar("gender", { length: 255 }),
    birthdate: date("birthdate"),
    profilePicture: varchar("profile_picture", { length: 255 }),
    bio: varchar("bio", { length: 255 }),
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

export type User = typeof users.$inferSelect;
