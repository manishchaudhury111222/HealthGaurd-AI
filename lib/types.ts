export type RiskLevel = "Low" | "Medium" | "High"

export type Gender = "male" | "female" | "other"

export type Sex = "male" | "female" | "other" | "prefer_not_say"

export type ExerciseLevel = "none" | "light" | "moderate" | "intense"

export interface PredictionInput {
  age: number
  gender: Gender
  symptoms: string[]
  duration: number // days
}

export interface PredictionResult {
  id: string
  disease: string
  risk: RiskLevel
  confidence: number // 0-100
  suggestions: string[]
  explanation: string
  createdAt: string
  input: PredictionInput
}

export interface UserProfile {
  id: string
  name: string
  email: string | null
  age: number | null
  sex: Sex | null
  heightCm: number | null
  weightKg: number | null
  bloodGroup: string | null
  conditions: string[]
  medications: string[]
  allergies: string[]
  lifestyle: {
    smoking: boolean
    alcohol: boolean
    exercise: ExerciseLevel
  }
  createdAt: string
  updatedAt: string
}

export type AlertKind =
  | "trend_worsening"
  | "recurring_symptom"
  | "high_risk_repeat"
  | "lifestyle_warning"
  | "checkup_due"

export interface SmartAlert {
  id: string
  createdAt: string
  kind: AlertKind
  severity: RiskLevel
  title: string
  message: string
  dismissed: boolean
}
