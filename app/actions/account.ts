"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/auth/paths";
import { requireUser } from "@/lib/auth/session";
import { isValidUsername, normalizeUsername } from "@/lib/auth/username";

export async function updateAccount(input: {
  username: string;
  email: string;
}): Promise<{ ok: true } | { error: string }> {
  const sessionUser = await requireUser();
  const username = normalizeUsername(input.username);
  const email = input.email.trim().toLowerCase();

  if (!isValidUsername(username)) {
    return {
      error: "Username must be 3–20 letters, numbers, or underscores.",
    };
  }

  const current = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { username: true, email: true, passwordHash: true, name: true },
  });

  if (!current) {
    return { error: "Account not found." };
  }

  let nextEmail: string | null = current.email;

  if (!email) {
    if (current.passwordHash) {
      return { error: "Email is required for password sign-in." };
    }
    nextEmail = null;
  } else if (!email.includes("@") || email.length > 254) {
    return { error: "Enter a valid email address." };
  } else {
    nextEmail = email;
  }

  try {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        username,
        name: current.name === current.username || !current.name ? username : current.name,
        email: nextEmail,
        role: isAdminEmail(nextEmail) ? "ADMIN" : undefined,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "That username or email is already taken." };
    }

    console.error("updateAccount failed", error);
    return { error: "Could not update your account. Try again." };
  }

  return { ok: true };
}
