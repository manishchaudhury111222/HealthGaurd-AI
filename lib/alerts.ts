import { DEMO_USER_ID, getDb, uuid } from "./db"
import { getProfile } from "./profile"
import { getAllPredictions } from "./storage"
import type { AlertKind, PredictionResult, RiskLevel, SmartAlert, UserProfile } from "./types"

interface AlertRow {
  id: string
  user_id: string
  created_at: string
  kind: string
  severity: string
  title: string
  message: string
  dismissed: number
}

function rowToAlert(r: AlertRow): SmartAlert {
  return {
    id: r.id,
    createdAt: r.created_at,
    kind: r.kind as AlertKind,
    severity: r.severity as RiskLevel,
    title: r.title,
    message: r.message,
    dismissed: !!r.dismissed,
  }
}

function insertAlert(a: Omit<SmartAlert, "id" | "createdAt" | "dismissed">) {
  const db = getDb()
  const id = uuid()
  const createdAt = new Date().toISOString()
  db.prepare(
    `INSERT INTO alerts (id, user_id, created_at, kind, severity, title, message, dismissed)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
  ).run(id, DEMO_USER_ID, createdAt, a.kind, a.severity, a.title, a.message)
}

function alertExists(kind: AlertKind, withinDays: number): boolean {
  const db = getDb()
  const cutoff = new Date(Date.now() - withinDays * 86400_000).toISOString()
  const row = db
    .prepare(
      `SELECT id FROM alerts
       WHERE user_id = ? AND kind = ? AND dismissed = 0 AND created_at >= ?
       LIMIT 1`,
    )
    .get(DEMO_USER_ID, kind, cutoff) as { id: string } | undefined
  return !!row
}

/**
 * Smart-alert rules engine. Re-evaluated after each new prediction.
 * Each rule is idempotent over a sliding time window so we don't spam users.
 */
export function evaluateAlerts(): SmartAlert[] {
  const profile = getProfile()
  const predictions = getAllPredictions() // sorted DESC

  if (predictions.length > 0) {
    runTrendWorseningRule(predictions)
    runRecurringSymptomRule(predictions)
    runHighRiskRepeatRule(predictions)
  }
  runLifestyleRule(profile)
  runCheckupDueRule(predictions)

  return listAlerts()
}

// Rule 1: 3 of last 5 predictions are Medium+ risk → trend worsening
function runTrendWorseningRule(preds: PredictionResult[]) {
  if (alertExists("trend_worsening", 7)) return
  const last5 = preds.slice(0, 5)
  if (last5.length < 3) return
  const elevated = last5.filter((p) => p.risk !== "Low").length
  if (elevated >= 3) {
    insertAlert({
      kind: "trend_worsening",
      severity: "Medium",
      title: "Health trend worsening",
      message: `${elevated} of your last ${last5.length} assessments came back at Medium or High risk. Consider booking a check-up to investigate the pattern.`,
    })
  }
}

// Rule 2: same symptom appears in 3+ predictions in last 30 days → recurring
function runRecurringSymptomRule(preds: PredictionResult[]) {
  if (alertExists("recurring_symptom", 14)) return
  const cutoff = Date.now() - 30 * 86400_000
  const recent = preds.filter((p) => new Date(p.createdAt).getTime() >= cutoff)
  const counts = new Map<string, number>()
  for (const p of recent) {
    for (const s of p.input.symptoms) {
      const key = s.toLowerCase()
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }
  for (const [symptom, n] of counts) {
    if (n >= 3) {
      insertAlert({
        kind: "recurring_symptom",
        severity: "Medium",
        title: "Recurring symptom detected",
        message: `"${capitalize(symptom)}" has shown up in ${n} of your recent assessments. Persistent symptoms warrant a clinical evaluation.`,
      })
      break
    }
  }
}

// Rule 3: 2+ High-risk results in 14 days → urgent care suggestion
function runHighRiskRepeatRule(preds: PredictionResult[]) {
  if (alertExists("high_risk_repeat", 7)) return
  const cutoff = Date.now() - 14 * 86400_000
  const highs = preds.filter(
    (p) => p.risk === "High" && new Date(p.createdAt).getTime() >= cutoff,
  )
  if (highs.length >= 2) {
    insertAlert({
      kind: "high_risk_repeat",
      severity: "High",
      title: "Multiple high-risk assessments",
      message: `You've had ${highs.length} High-risk results in the past 14 days. Please consult a clinician promptly.`,
    })
  }
}

// Rule 4: lifestyle warnings based on profile
function runLifestyleRule(profile: UserProfile) {
  if (alertExists("lifestyle_warning", 30)) return
  const reasons: string[] = []
  if (profile.lifestyle.smoking) reasons.push("smoking")
  if (profile.lifestyle.alcohol) reasons.push("regular alcohol use")
  if (profile.lifestyle.exercise === "none") reasons.push("low physical activity")
  if (reasons.length >= 2) {
    insertAlert({
      kind: "lifestyle_warning",
      severity: "Medium",
      title: "Lifestyle risk factors",
      message: `Your profile indicates ${reasons.join(", ")}. Reducing these factors significantly lowers long-term disease risk.`,
    })
  }
}

// Rule 5: no assessment in 90 days → suggest a check-in
function runCheckupDueRule(preds: PredictionResult[]) {
  if (alertExists("checkup_due", 30)) return
  if (preds.length === 0) return
  const last = new Date(preds[0].createdAt).getTime()
  const days = Math.floor((Date.now() - last) / 86400_000)
  if (days >= 90) {
    insertAlert({
      kind: "checkup_due",
      severity: "Low",
      title: "Time for a check-in",
      message: `It's been ${days} days since your last assessment. Run a quick symptom check to keep your health profile current.`,
    })
  }
}

export function listAlerts(includeDismissed = false): SmartAlert[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT * FROM alerts
       WHERE user_id = ?${includeDismissed ? "" : " AND dismissed = 0"}
       ORDER BY created_at DESC`,
    )
    .all(DEMO_USER_ID) as AlertRow[]
  return rows.map(rowToAlert)
}

export function dismissAlert(id: string): boolean {
  const db = getDb()
  const info = db
    .prepare("UPDATE alerts SET dismissed = 1 WHERE id = ? AND user_id = ?")
    .run(id, DEMO_USER_ID)
  return info.changes > 0
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
