import { NextResponse } from "next/server";
import {
  adminCookieOptions,
  adminCookieName,
  createAdminSession,
  credentialsMatch,
  getAdminCredentials,
  isAdminConfigured,
} from "../../../../lib/admin-auth";
import { readJsonObject } from "../../../../lib/request";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin access is not configured. Set the required environment variables and restart the server." },
      { status: 503 },
    );
  }

  const body = await readJsonObject(request, 2_000);
  if (body.error) return NextResponse.json({ error: body.error }, { status: 400 });

  const username = typeof body.value.username === "string" ? body.value.username : "";
  const password = typeof body.value.password === "string" ? body.value.password : "";
  const credentials = getAdminCredentials();

  if (
    username.length > 200 ||
    password.length > 1_000 ||
    !credentialsMatch(username, password, credentials)
  ) {
    return NextResponse.json({ error: "The username or password is incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(adminCookieName, createAdminSession(username), adminCookieOptions());
  return response;
}
