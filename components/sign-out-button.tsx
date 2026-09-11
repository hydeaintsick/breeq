"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton({
  className,
  children = "Sign out",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void signOut({ redirectTo: "/" });
      }}
    >
      {children}
    </button>
  );
}
