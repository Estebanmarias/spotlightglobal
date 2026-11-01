import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

const ACCESS_TTL_SECONDS = 15 * 60;

function secret() {
  return process.env.BACKUP_ACCESS_SECRET || "";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function verifyBackupPin(pin: string) {
  const stored = process.env.BACKUP_PIN_HASH || "";
  const [salt, encodedHash] = stored.split(":");
  if (!salt || !encodedHash || !/^\d{8}$/.test(pin)) return false;
  const actual = scryptSync(pin, salt, 32);
  const expected = Buffer.from(encodedHash, "base64url");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export function setBackupAccessCookie(response: NextResponse, userId: string) {
  if (!secret()) return;
  const expires = Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS;
  const value = `${userId}.${expires}`;
  response.cookies.set("backup_access", `${value}.${sign(value)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin/backups",
    maxAge: ACCESS_TTL_SECONDS,
  });
}

export function hasBackupAccess(request: NextRequest, userId: string) {
  const token = request.cookies.get("backup_access")?.value || "";
  const [tokenUserId, expiresText, signature] = token.split(".");
  const expires = Number(expiresText);
  if (!secret() || tokenUserId !== userId || !signature || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  const value = `${tokenUserId}.${expiresText}`;
  const expected = sign(value);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
