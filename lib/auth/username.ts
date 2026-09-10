import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidUsername(raw: string) {
  return USERNAME_PATTERN.test(normalizeUsername(raw));
}

export function slugifyUsername(raw: string) {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  return slug.length >= 3 ? slug : `player_${randomInt(1000, 9999)}`;
}

export async function uniqueUsername(raw: string) {
  let candidate = slugifyUsername(raw);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!taken) {
      return candidate;
    }

    const suffix = String(randomInt(10, 99));
    candidate = `${slugifyUsername(raw).slice(0, 18)}${suffix}`;
  }

  return `player_${randomInt(100000, 999999)}`;
}
