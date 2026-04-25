import Database from "better-sqlite3"
import path from "node:path"
import fs from "node:fs"

let _db: Database.Database | null = null

function getDataDir(): string {
  const candidates = [
    process.env.HEALTHGUARD_DB_DIR,
    path.join(process.cwd(), "data"),
    "/tmp/healthguard",
  ].filter(Boolean) as string[]

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true })
      const probe = path.join(dir, ".write-probe")
      fs.writeFileSync(probe, "ok")
      fs.unlinkSync(probe)
      return dir
    } catch {
      continue
    }
  }
  return "/tmp"
}

export const DEMO_USER_ID = "demo-user"

export function getDb(): Database.Database {
  if (_db) return _db
  const dir = getDataDir()
  const file = path.join(dir, "healthguard.db")
  _db = new Database(file)
  _db.pragma("journal_mode = WAL")
  _db.pragma("foreign_keys = ON")
  migrate(_db)
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      age INTEGER,
      sex TEXT,
      height_cm INTEGER,
      weight_kg INTEGER,
      blood_group TEXT,
      conditions TEXT NOT NULL DEFAULT '[]',
      medications TEXT NOT NULL DEFAULT '[]',
      allergies TEXT NOT NULL DEFAULT '[]',
      lifestyle_smoking INTEGER NOT NULL DEFAULT 0,
      lifestyle_alcohol INTEGER NOT NULL DEFAULT 0,
      lifestyle_exercise TEXT NOT NULL DEFAULT 'moderate',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      disease TEXT NOT NULL,
      risk TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      suggestions TEXT NOT NULL,
      explanation TEXT NOT NULL,
      input_age INTEGER NOT NULL,
      input_gender TEXT NOT NULL,
      input_symptoms TEXT NOT NULL,
      input_duration INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_user_created
      ON predictions(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      kind TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      dismissed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_user
      ON alerts(user_id, dismissed, created_at DESC);
  `)

  // Seed demo user
  const existing = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(DEMO_USER_ID)
  if (!existing) {
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO users (id, name, email, age, sex, height_cm, weight_kg, blood_group, conditions, medications, allergies, lifestyle_smoking, lifestyle_alcohol, lifestyle_exercise, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      DEMO_USER_ID,
      "Demo User",
      "demo@healthguard.ai",
      32,
      "prefer_not_say",
      null,
      null,
      null,
      "[]",
      "[]",
      "[]",
      0,
      0,
      "moderate",
      now,
      now,
    )
  }
}

export function uuid(): string {
  return crypto.randomUUID()
}
