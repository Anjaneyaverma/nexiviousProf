import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";
import { getSiteContent, saveSiteContent } from "../../../../lib/database";
import { readJsonObject } from "../../../../lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingFields = [
  "heroTitle",
  "heroAccent",
  "heroDescription",
  "introTitle",
  "introAccent",
  "introDescription",
  "contactEmail",
  "contactLocation",
];

function isText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function validSettings(settings) {
  return settingFields.every((field) => {
    const maxLength = field.endsWith("Description") ? 1_500 : field === "contactEmail" ? 254 : field === "contactLocation" ? 100 : 180;
    return isText(settings[field], maxLength);
  }) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail.trim());
}

function validateContent(value) {
  if (!value || typeof value !== "object") return null;
  const settings = value.settings;
  const services = value.services;
  const technologies = value.technologies;

  if (!settings || !validSettings(settings)) {
    return null;
  }

  if (
    !Array.isArray(services) ||
    services.length < 1 ||
    services.length > 12 ||
    services.some(
      (service) =>
        !service ||
        typeof service !== "object" ||
        !isText(service.title, 100) ||
        !isText(service.description, 1_000) ||
        !Array.isArray(service.tags) ||
        service.tags.length > 8 ||
        service.tags.some((tag) => !isText(tag, 40)),
    )
  ) {
    return null;
  }

  if (
    !Array.isArray(technologies) ||
    technologies.length > 12 ||
    technologies.some(
      (technology) =>
        !technology ||
        typeof technology !== "object" ||
        !isText(technology.title, 100) ||
        !isText(technology.items, 300),
    )
  ) {
    return null;
  }

  return {
    settings: Object.fromEntries(
      settingFields.map((field) => [field, settings[field].trim()]),
    ),
    services: services.map((service, index) => ({
      number: String(index + 1).padStart(2, "0"),
      icon: ["web", "mobile", "layers", "spark", "cloud", "support"][index % 6],
      title: service.title.trim(),
      description: service.description.trim(),
      tags: service.tags.map((tag) => tag.trim()),
    })),
    technologies: technologies.map((technology) => ({
      title: technology.title.trim(),
      items: technology.items.trim(),
    })),
  };
}

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Please sign in to access the admin area." }, { status: 401 });
  }
  return NextResponse.json(await getSiteContent(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Please sign in to access the admin area." }, { status: 401 });
  }

  const body = await readJsonObject(request, 50_000);
  if (body.error) return NextResponse.json({ error: body.error }, { status: 400 });

  const content = validateContent(body.value);
  if (!content) {
    return NextResponse.json(
      { error: "Check the content fields and try again. Some entries are empty or too long." },
      { status: 400 },
    );
  }

  await saveSiteContent(content);
  return NextResponse.json({ message: "Website content saved." });
}
