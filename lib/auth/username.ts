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

const GUEST_ADJECTIVES = [
  "galactic",
  "cosmic",
  "lunar",
  "solar",
  "neon",
  "amber",
  "misty",
  "swift",
  "quiet",
  "wild",
  "astral",
  "velvet",
  "golden",
  "silver",
  "bright",
  "polar",
] as const;

const GUEST_ANIMALS = [
  "antelope",
  "gecko",
  "otter",
  "falcon",
  "heron",
  "panda",
  "lynx",
  "ibis",
  "moth",
  "hare",
  "crane",
  "koala",
  "puma",
  "raven",
  "badger",
  "finch",
  "wren",
  "fox",
  "owl",
] as const;

/** The handle minted before animal names, including `player51` and `player_482911`. */
export function isStockGuestHandle(username: string) {
  return /^player(?:_\d+|\d+)?$/.test(username);
}

/** `galacticantelope44` — one word, fits the 20-character handle. */
export async function guestUsername() {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const adjective = GUEST_ADJECTIVES[randomInt(GUEST_ADJECTIVES.length)];
    const animal = GUEST_ANIMALS[randomInt(GUEST_ANIMALS.length)];
    const candidate = `${adjective}${animal}${randomInt(10, 100)}`;
    if (candidate.length > 20) continue;

    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  return uniqueUsername(`gecko${randomInt(100000, 999999)}`);
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
