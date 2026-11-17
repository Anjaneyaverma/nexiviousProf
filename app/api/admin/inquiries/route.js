import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";
import { listInquiries, updateInquiryStatus } from "../../../../lib/database";
import { readJsonObject } from "../../../../lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = new Set(["new", "read", "archived"]);

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Please sign in to access the admin area." }, { status: 401 });
  }
  return NextResponse.json({ inquiries: await listInquiries() }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Please sign in to access the admin area." }, { status: 401 });
  }

  const body = await readJsonObject(request, 1_000);
  if (body.error) return NextResponse.json({ error: body.error }, { status: 400 });

  const id = Number(body.value.id);
  const status = body.value.status;
  if (!Number.isSafeInteger(id) || id < 1 || !statuses.has(status)) {
    return NextResponse.json({ error: "A valid inquiry and status are required." }, { status: 400 });
  }

  if (!(await updateInquiryStatus(id, status))) {
    return NextResponse.json({ error: "That inquiry could not be found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Inquiry updated." });
}
