/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import type { db } from "@/server/db";
import { type User, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export class UserService {
  constructor(private db: db) {}

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async createUser(email: string): Promise<User | undefined> {
    const [newUser] = await this.db.insert(users).values({ email }).returning();
    return newUser;
  }

  async isNewUser(email: string): Promise<boolean> {
    const user = await this.findUserByEmail(email);
    return !user;
  }
}
