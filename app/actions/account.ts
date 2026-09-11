"use server";

import { compare, hash } from "bcryptjs";
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
    select: { username: true, email: true, name: true },
  });

  if (!current) {
    return { error: "Account not found." };
  }

  let nextEmail: string | null = current.email;

  if (!email) {
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

export async function setAlternativeLogin(input: {
  alias: string;
  password: string;
  confirmPassword: string;
  currentPassword?: string;
}): Promise<{ ok: true } | { error: string }> {
  const sessionUser = await requireUser();
  const alias = normalizeUsername(input.alias);
  const password = input.password;
  const confirmPassword = input.confirmPassword;
  const currentPassword = input.currentPassword ?? "";

  if (!isValidUsername(alias)) {
    return {
      error: "Alias must be 3–20 letters, numbers, or underscores.",
    };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const current = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { username: true, name: true, passwordHash: true },
  });

  if (!current) {
    return { error: "Account not found." };
  }

  if (current.passwordHash) {
    if (!currentPassword) {
      return { error: "Enter your current password." };
    }

    const valid = await compare(currentPassword, current.passwordHash);
    if (!valid) {
      return { error: "Current password is not right." };
    }
  }

  try {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        username: alias,
        name: current.name === current.username || !current.name ? alias : current.name,
        passwordHash: await hash(password, 12),
        passwordSetAt: new Date(),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "That alias is already taken." };
    }

    console.error("setAlternativeLogin failed", error);
    return { error: "Could not save your password login. Try again." };
  }

  return { ok: true };
}

export async function revokeAlternativeLogin(): Promise<{ ok: true } | { error: string }> {
  const sessionUser = await requireUser();
  const current = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });

  if (!current) {
    return { error: "Account not found." };
  }

  if (!current.passwordHash) {
    return { error: "No password login to revoke." };
  }

  try {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        passwordHash: null,
        passwordSetAt: null,
      },
    });
  } catch (error) {
    console.error("revokeAlternativeLogin failed", error);
    return { error: "Could not revoke your password login. Try again." };
  }

  return { ok: true };
}
