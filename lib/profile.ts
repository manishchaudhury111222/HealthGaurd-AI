import { DEMO_USER_ID, getDb } from "./db"
import type { ExerciseLevel, Sex, UserProfile } from "./types"

interface UserRow {
  id: string
  name: string
  email: string | null
  age: number | null
  sex: string | null
  height_cm: number | null
  weight_kg: number | null
  blood_group: string | null
  conditions: string
  medications: string
  allergies: string
  lifestyle_smoking: number
  lifestyle_alcohol: number
  lifestyle_exercise: string
  created_at: string
  updated_at: string
}

function rowToProfile(r: UserRow): UserProfile {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    age: r.age,
    sex: (r.sex as Sex) ?? null,
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    bloodGroup: r.blood_group,
    conditions: JSON.parse(r.conditions || "[]") as string[],
    medications: JSON.parse(r.medications || "[]") as string[],
    allergies: JSON.parse(r.allergies || "[]") as string[],
    lifestyle: {
      smoking: !!r.lifestyle_smoking,
      alcohol: !!r.lifestyle_alcohol,
      exercise: (r.lifestyle_exercise as ExerciseLevel) || "moderate",
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function getProfile(): UserProfile {
  const db = getDb()
  const row = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(DEMO_USER_ID) as UserRow
  return rowToProfile(row)
}

export type ProfileUpdate = Partial<
  Omit<UserProfile, "id" | "createdAt" | "updatedAt">
>

export function saveProfile(update: ProfileUpdate): UserProfile {
  const db = getDb()
  const current = getProfile()
  const merged: UserProfile = {
    ...current,
    ...update,
    lifestyle: { ...current.lifestyle, ...(update.lifestyle ?? {}) },
    updatedAt: new Date().toISOString(),
  }

  db.prepare(
    `UPDATE users SET
       name = ?, email = ?, age = ?, sex = ?, height_cm = ?, weight_kg = ?,
       blood_group = ?, conditions = ?, medications = ?, allergies = ?,
       lifestyle_smoking = ?, lifestyle_alcohol = ?, lifestyle_exercise = ?,
       updated_at = ?
     WHERE id = ?`,
  ).run(
    merged.name,
    merged.email,
    merged.age,
    merged.sex,
    merged.heightCm,
    merged.weightKg,
    merged.bloodGroup,
    JSON.stringify(merged.conditions),
    JSON.stringify(merged.medications),
    JSON.stringify(merged.allergies),
    merged.lifestyle.smoking ? 1 : 0,
    merged.lifestyle.alcohol ? 1 : 0,
    merged.lifestyle.exercise,
    merged.updatedAt,
    DEMO_USER_ID,
  )

  return merged
}

export function bmi(p: UserProfile): number | null {
  if (!p.heightCm || !p.weightKg) return null
  const m = p.heightCm / 100
  return Math.round((p.weightKg / (m * m)) * 10) / 10
}

export function bmiCategory(value: number | null): {
  label: string
  tone: "low" | "ok" | "warn" | "high"
} | null {
  if (value == null) return null
  if (value < 18.5) return { label: "Underweight", tone: "warn" }
  if (value < 25) return { label: "Normal", tone: "ok" }
  if (value < 30) return { label: "Overweight", tone: "warn" }
  return { label: "Obese", tone: "high" }
}
