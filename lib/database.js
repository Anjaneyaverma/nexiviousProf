import "server-only";

import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  defaultServices,
  defaultSettings,
  defaultTechnologies,
} from "./default-content";

const databasePath =
  process.env.DATABASE_PATH || path.join(process.cwd(), ".data", "nexivious.sqlite");
const databaseUrl =
  process.env.TURSO_DATABASE_URL ||
  `file:${databasePath.replaceAll("\\", "/")}`;
const isLocalDatabase = databaseUrl.startsWith("file:");
const authToken = process.env.TURSO_AUTH_TOKEN;

if (isLocalDatabase) {
  mkdirSync(path.dirname(databasePath), { recursive: true });
} else if (!authToken) {
  throw new Error("TURSO_AUTH_TOKEN is required when using TURSO_DATABASE_URL.");
}

const database = createClient({
  url: databaseUrl,
  ...(authToken ? { authToken } : {}),
});

let initialization;

async function initializeDatabase() {
  await database.batch(
    [
      `CREATE TABLE IF NOT EXISTS site_content (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        settings TEXT NOT NULL,
        services TEXT NOT NULL,
        technologies TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        project TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new'
          CHECK (status IN ('new', 'read', 'archived')),
        created_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at)",
    ],
    "write",
  );
  await database.execute({
    sql: `INSERT OR IGNORE INTO site_content
      (id, settings, services, technologies, updated_at)
      VALUES (1, ?, ?, ?, ?)`,
    args: [
      JSON.stringify(defaultSettings),
      JSON.stringify(defaultServices),
      JSON.stringify(defaultTechnologies),
      new Date().toISOString(),
    ],
  });
}

function ensureInitialized() {
  if (!initialization) {
    initialization = initializeDatabase();
  }
  return initialization;
}

export async function getSiteContent() {
  await ensureInitialized();
  const result = await database.execute(
    "SELECT settings, services, technologies FROM site_content WHERE id = 1",
  );
  const row = result.rows[0];

  if (!row) {
    throw new Error("The Nexivious website content record is missing.");
  }

  return {
    settings: { ...defaultSettings, ...JSON.parse(row.settings) },
    services: JSON.parse(row.services),
    technologies: JSON.parse(row.technologies),
  };
}

export async function saveSiteContent(content) {
  await ensureInitialized();
  const result = await database.execute({
    sql: `UPDATE site_content
      SET settings = ?, services = ?, technologies = ?, updated_at = ?
      WHERE id = 1`,
    args: [
      JSON.stringify(content.settings),
      JSON.stringify(content.services),
      JSON.stringify(content.technologies),
      new Date().toISOString(),
    ],
  });

  if (result.rowsAffected !== 1) {
    throw new Error("Website content could not be saved.");
  }
}

export async function createInquiry({ name, email, project }) {
  await ensureInitialized();
  const result = await database.execute({
    sql: "INSERT INTO inquiries (name, email, project, created_at) VALUES (?, ?, ?, ?)",
    args: [name, email, project, new Date().toISOString()],
  });

  return Number(result.lastInsertRowid);
}

export async function listInquiries() {
  await ensureInitialized();
  const result = await database.execute(
    `SELECT id, name, email, project, status, created_at AS createdAt
     FROM inquiries ORDER BY created_at DESC`,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    email: row.email,
    project: row.project,
    status: row.status,
    createdAt: row.createdAt,
  }));
}

export async function updateInquiryStatus(id, status) {
  await ensureInitialized();
  const result = await database.execute({
    sql: "UPDATE inquiries SET status = ? WHERE id = ?",
    args: [status, id],
  });

  return result.rowsAffected;
}
