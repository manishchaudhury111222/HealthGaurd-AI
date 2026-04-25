import { DEMO_USER_ID, getDb } from "./db"
import type { PredictionResult, Gender, RiskLevel } from "./types"

interface PredictionRow {
  id: string
  user_id: string
  created_at: string
  disease: string
  risk: string
  confidence: number
  suggestions: string
  explanation: string
  input_age: number
  input_gender: string
  input_symptoms: string
  input_duration: number
}

function rowToPrediction(r: PredictionRow): PredictionResult {
  return {
    id: r.id,
    disease: r.disease,
    risk: r.risk as RiskLevel,
    confidence: r.confidence,
    suggestions: JSON.parse(r.suggestions) as string[],
    explanation: r.explanation,
    createdAt: r.created_at,
    input: {
      age: r.input_age,
      gender: r.input_gender as Gender,
      symptoms: JSON.parse(r.input_symptoms) as string[],
      duration: r.input_duration,
    },
  }
}

function ensureSeeded() {
  const db = getDb()
  const count = (
    db.prepare("SELECT COUNT(*) as n FROM predictions WHERE user_id = ?").get(
      DEMO_USER_ID,
    ) as { n: number }
  ).n
  if (count > 0) return

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const seeds: PredictionResult[] = [
    {
      id: "seed-1",
      disease: "Common Cold",
      risk: "Low",
      confidence: 82,
      explanation:
        "Upper respiratory symptoms typical of a seasonal cold. Expected to resolve without intervention.",
      suggestions: ["Rest and hydrate", "Warm fluids", "Saline nasal spray"],
      createdAt: new Date(now - 10 * day).toISOString(),
      input: {
        age: 32,
        gender: "female",
        symptoms: ["Sore throat", "Runny nose"],
        duration: 3,
      },
    },
    {
      id: "seed-2",
      disease: "Influenza (Flu)",
      risk: "Medium",
      confidence: 88,
      explanation:
        "Fever with cough and body aches consistent with seasonal flu.",
      suggestions: ["Stay home", "Fever reducers", "Monitor breathing"],
      createdAt: new Date(now - 5 * day).toISOString(),
      input: {
        age: 32,
        gender: "female",
        symptoms: ["Fever", "Cough", "Body aches"],
        duration: 2,
      },
    },
    {
      id: "seed-3",
      disease: "Tension / Migraine",
      risk: "Low",
      confidence: 74,
      explanation: "Headache with dizziness, likely tension-related.",
      suggestions: ["Hydrate", "Rest", "Reduce screen time"],
      createdAt: new Date(now - 2 * day).toISOString(),
      input: {
        age: 32,
        gender: "female",
        symptoms: ["Headache", "Dizziness"],
        duration: 1,
      },
    },
  ]

  for (const p of seeds) savePrediction(p)
}

export function getAllPredictions(): PredictionResult[] {
  ensureSeeded()
  const db = getDb()
  const rows = db
    .prepare(
      "SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC",
    )
    .all(DEMO_USER_ID) as PredictionRow[]
  return rows.map(rowToPrediction)
}

export function getPredictionById(id: string): PredictionResult | undefined {
  ensureSeeded()
  const db = getDb()
  const row = db
    .prepare("SELECT * FROM predictions WHERE id = ?")
    .get(id) as PredictionRow | undefined
  return row ? rowToPrediction(row) : undefined
}

export function savePrediction(p: PredictionResult): PredictionResult {
  const db = getDb()
  db.prepare(
    `INSERT OR REPLACE INTO predictions
       (id, user_id, created_at, disease, risk, confidence, suggestions, explanation,
        input_age, input_gender, input_symptoms, input_duration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    p.id,
    DEMO_USER_ID,
    p.createdAt,
    p.disease,
    p.risk,
    p.confidence,
    JSON.stringify(p.suggestions),
    p.explanation,
    p.input.age,
    p.input.gender,
    JSON.stringify(p.input.symptoms),
    p.input.duration,
  )
  return p
}

export function clearPredictions(): void {
  const db = getDb()
  db.prepare("DELETE FROM predictions WHERE user_id = ?").run(DEMO_USER_ID)
}
