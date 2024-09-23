"use server";

import { api } from "@/trpc/server";

export const isUserRegistered = async (email: string) => {
  try {
    return await api.user.status({ email });
  } catch (error) {
    throw error;
  }
};
