import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "nexivious_admin";
const sessionDuration = 60 * 60 * 12;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

export function isAdminConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      process.env.ADMIN_PASSWORD.length >= 12 &&
      process.env.ADMIN_SESSION_SECRET &&
      Buffer.byteLength(process.env.ADMIN_SESSION_SECRET, "utf8") >= 32,
  );
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 12) {
    throw new Error("Set ADMIN_USERNAME and an ADMIN_PASSWORD of at least 12 characters.");
  }
  getSessionSecret();
  return { username, password };
}

function sign(payload) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function equalText(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function credentialsMatch(username, password, expected) {
  return equalText(username, expected.username) && equalText(password, expected.password);
}

export function createAdminSession(username) {
  const payload = Buffer.from(
    JSON.stringify({ username, expiresAt: Date.now() + sessionDuration * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isAdminRequest(request) {
  if (!isAdminConfigured()) return false;
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return false;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!equalText(signature, sign(payload))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return (
      typeof session.username === "string" &&
      session.username === process.env.ADMIN_USERNAME &&
      Number.isFinite(session.expiresAt) &&
      session.expiresAt > Date.now()
    );
  } catch (error) {
    if (error instanceof SyntaxError) return false;
    throw error;
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionDuration,
  };
}

export const adminCookieName = cookieName;
