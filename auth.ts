import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { getAddress, isAddress, verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import { isGoogleEnabled } from "@/lib/auth/google";
import { isAdminEmail, LOGIN_PATH, type Role } from "@/lib/auth/paths";
import { SIWE_NONCE_COOKIE, siweMessage } from "@/lib/auth/siwe";
import { normalizeUsername, uniqueUsername } from "@/lib/auth/username";

const googleEnabled = isGoogleEnabled();

async function withRole<T extends { id: string; email?: string | null; role: Role; username?: string | null; name?: string | null }>(
  user: T,
) {
  if (isAdminEmail(user.email) && user.role !== "ADMIN") {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
      select: { role: true },
    });
    return { ...user, role: updated.role };
  }

  return user;
}

async function findUserForPasswordLogin(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes("@")) {
    return prisma.user.findUnique({
      where: { email: normalized },
    });
  }

  return prisma.user.findUnique({
    where: { username: normalizeUsername(normalized) },
  });
}

function toAuthUser(user: {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: Role;
  username: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    username: user.username,
  };
}

async function authorizeWallet(addressRaw: string, signature: string) {
  if (!isAddress(addressRaw) || !signature) {
    return null;
  }

  const cookieStore = await cookies();
  const nonce = cookieStore.get(SIWE_NONCE_COOKIE)?.value;
  if (!nonce) {
    return null;
  }

  const address = getAddress(addressRaw);
  const message = siweMessage(addressRaw, nonce);
  const valid = await verifyMessage({
    address,
    message,
    signature: signature as `0x${string}`,
  });

  if (!valid) {
    return null;
  }

  cookieStore.delete(SIWE_NONCE_COOKIE);

  const providerAccountId = address.toLowerCase();
  const existing = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "metamask",
        providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existing?.user) {
    return toAuthUser(await withRole(existing.user));
  }

  const username = await uniqueUsername(`m_${address.slice(2, 8)}`);
  const created = await prisma.user.create({
    data: {
      username,
      name: username,
      walletAddress: providerAccountId,
      accounts: {
        create: {
          type: "credentials",
          provider: "metamask",
          providerAccountId,
        },
      },
    },
  });

  return toAuthUser(created);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: LOGIN_PATH,
    error: LOGIN_PATH,
  },
  providers: [
    ...(googleEnabled
      ? [
          // One button for both sign up and sign in: the adapter creates the
          // player on first use and finds them by Google account afterwards.
          // Linking by email is safe here because the `signIn` callback only
          // lets through Google profiles whose email Google has verified.
          Google({
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        address: { label: "Address", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        try {
          const addressRaw =
            typeof credentials?.address === "string" ? credentials.address : "";
          const signature =
            typeof credentials?.signature === "string" ? credentials.signature : "";

          if (addressRaw && signature) {
            return authorizeWallet(addressRaw, signature);
          }

          const identifier =
            typeof credentials?.username === "string" && credentials.username.trim()
              ? credentials.username.trim()
              : typeof credentials?.email === "string"
                ? credentials.email.trim()
                : "";
          const password =
            typeof credentials?.password === "string" ? credentials.password : "";

          if (!identifier || !password) {
            return null;
          }

          const user = await findUserForPasswordLogin(identifier);

          if (!user?.passwordHash) {
            return null;
          }

          const valid = await compare(password, user.passwordHash);
          if (!valid) {
            return null;
          }

          return toAuthUser(await withRole(user));
        } catch (error) {
          console.error("credentials authorize failed", error);
          return null;
        }
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }

      const current = await prisma.user.findUnique({
        where: { id: user.id },
        select: { username: true, email: true, name: true, role: true },
      });

      if (!current) {
        return;
      }

      const username =
        current.username ??
        (await uniqueUsername(current.email?.split("@")[0] ?? current.name ?? "player"));

      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          name: current.name ?? username,
          role: isAdminEmail(current.email) ? "ADMIN" : current.role,
        },
      });
    },
    async linkAccount({ user, account }) {
      // Google only gets this far with a verified email (see `signIn`), so the
      // player's address counts as confirmed from that moment.
      if (account.provider !== "google" || !user.id) {
        return;
      }

      await prisma.user.updateMany({
        where: { id: user.id, emailVerified: null },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true && typeof profile.email === "string";
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      const userId = user?.id ?? (trigger === "update" ? token.sub : undefined);

      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, username: true, email: true, name: true },
        });

        token.role = dbUser?.role ?? "PLAYER";
        token.username = dbUser?.username ?? null;
        token.name = dbUser?.name ?? token.name;
        token.email = dbUser?.email ?? token.email;

        if (isAdminEmail(dbUser?.email) && dbUser?.role !== "ADMIN") {
          await prisma.user.update({
            where: { id: userId },
            data: { role: "ADMIN" },
          });
          token.role = "ADMIN";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? "PLAYER";
        session.user.username =
          typeof token.username === "string" ? token.username : null;
      }

      return session;
    },
  },
});
