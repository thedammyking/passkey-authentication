import { clsx, type ClassValue } from "clsx";
import { customType, pgTableCreator } from "drizzle-orm/pg-core";
import { twMerge } from "tailwind-merge";

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
  data: string;
  notNull: false;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
  toDriver(val: string) {
    let newVal = val;
    if (val.startsWith("0x")) {
      newVal = val.slice(2);
    }

    return Buffer.from(newVal, "hex");
  },
  fromDriver(val: unknown) {
    return (val as Buffer).toString("hex");
  },
});
