import { NextResponse } from "next/server";
import { createInquiry } from "../../../lib/database";
import { readJsonObject } from "../../../lib/request";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await readJsonObject(request, 8_000);
  if (body.error) return NextResponse.json({ error: body.error }, { status: 400 });

  const name = typeof body.value.name === "string" ? body.value.name.trim() : "";
  const email = typeof body.value.email === "string" ? body.value.email.trim() : "";
  const project = typeof body.value.project === "string" ? body.value.project.trim() : "";

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Please enter a name between 2 and 100 characters." }, { status: 400 });
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (project.length < 10 || project.length > 5_000) {
    return NextResponse.json({ error: "Please describe your project in 10 to 5,000 characters." }, { status: 400 });
  }

  await createInquiry({ name, email, project });
  return NextResponse.json(
    { message: "Thanks for reaching out. Your message has been received." },
    { status: 201 },
  );
}
