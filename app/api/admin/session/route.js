import { NextResponse } from "next/server";
import {
  adminCookieName,
  adminCookieOptions,
  isAdminConfigured,
  isAdminRequest,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";

export function GET(request) {
  const configured = isAdminConfigured();
  return NextResponse.json({
    configured,
    authenticated: configured && isAdminRequest(request),
  });
}

export function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(adminCookieName, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}
