// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { createTable } from "@/lib/utils";
import { sql } from "drizzle-orm";
import { index, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const posts = createTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom().unique(),
    name: varchar("name", { length: 256 }),
    createdById: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    createdByIdIdx: index("created_by_idx").on(example.createdById),
    nameIndex: index("name_idx").on(example.name),
  }),
);
