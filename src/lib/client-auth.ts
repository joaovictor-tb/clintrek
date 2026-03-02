import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const COOKIE_NAME = "clintrek-client-session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function generateToken(): string {
  return crypto.randomUUID();
}

export async function createClientSession(
  clientId: string,
  organizationId: string,
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.clientSession.create({
    data: {
      clientId,
      organizationId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function getClientSession(token: string) {
  const session = await prisma.clientSession.findUnique({
    where: { token },
    include: {
      client: true,
      organization: true,
    },
  });

  if (!session) return null;

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await prisma.clientSession.delete({ where: { id: session.id } });
    return null;
  }

  // Check if client is soft-deleted
  if (session.client.deletedAt) {
    await prisma.clientSession.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export async function deleteClientSession(token: string): Promise<void> {
  await prisma.clientSession.deleteMany({ where: { token } });
}

export async function setClientSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/portal",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getClientSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearClientSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/portal",
    maxAge: 0,
  });
}
