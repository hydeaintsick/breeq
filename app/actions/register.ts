"use server";

import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/auth/paths";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";

export async function registerAccount(input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { error: string }> {
  const username = normalizeUsername(input.username);
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!isValidUsername(username)) {
    return {
      error: "Username must be 3–20 letters, numbers, or underscores.",
    };
  }

  if (!email.includes("@") || email.length > 254) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    await prisma.user.create({
      data: {
        username,
        name: username,
        email,
        passwordHash: await hash(password, 12),
        role: isAdminEmail(email) ? "ADMIN" : "PLAYER",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "That username or email is already taken." };
    }

    console.error("registerAccount failed", error);
    return { error: "Could not create your account. Try again." };
  }

  return { ok: true };
}
