"use client";

import React from "react";
import { logout } from "../actions";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  isLoggedIn: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ isLoggedIn }) => {
  const router = useRouter();
  const handleLogout = async () => {
    await logout();
  };

  const handleGetStarted = async () => {
    router.push("/get-started");
  };

  return (
    <button
      onClick={isLoggedIn ? handleLogout : handleGetStarted}
      className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
    >
      {isLoggedIn ? "Sign out" : "Get Started"}
    </button>
  );
};

export default LogoutButton;
