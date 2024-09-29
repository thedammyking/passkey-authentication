"use client";

import React from "react";
import { logout } from "../actions";
import type { IronSession } from "iron-session";
import type { User } from "@/server/db/schema";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  session: IronSession<{
    user: User | null;
  }>;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ session }) => {
  const router = useRouter();
  const handleLogout = async () => {
    await logout();
  };

  const handleGetStarted = async () => {
    router.push("/get-started");
  };

  return (
    <button
      onClick={session.user ? handleLogout : handleGetStarted}
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
    >
      {session.user ? "Sign out" : "Get Started"}
    </button>
  );
};

export default LogoutButton;
