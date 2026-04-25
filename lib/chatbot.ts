/**
 * MediBot clinical reasoning engine.
 *
 * Architecture
 * ------------
 * 1. A weighted symptom-disease knowledge base (similar in spirit to ICD-10
 *    symptom-disease mappings) drives differential diagnosis.
 * 2. Multi-step conversation:
 *      collect_primary -> smart_followup_1 -> smart_followup_2 ->
 *      duration -> severity -> diagnosis
 * 3. After every user turn we recompute the candidate ranking and choose
 *    the most *discriminating* symptom we haven't asked about yet — the
 *    one that best separates the top candidates.
 * 4. Final output is a structured differential with top-3 conditions,
 *    probability scores, risk classification, an explanation of the
 *    reasoning, and recommendations.
 *
 * The reasoning core (`runDifferentialDiagnosis`) is pure and exported,
 * so it can be swapped for an LLM call (e.g. OpenAI, Vercel AI SDK)
 * or a real ML model without touching the conversation layer.
 *   // Replace with real ML model
 */

export type ChatRole = "user" | "bot"

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  timestamp: number
  diagnosis?: DiagnosisSummary
  quickReplies?: string[]
}

export type ChatStep =
  | "greeting"
  | "collect_primary"
  | "smart_followup"
  | "duration"
  | "severity"
  | "done"

export type Severity = "mild" | "moderate" | "severe"

export type ChatbotState = {
  step: ChatStep
  /** Confirmed symptom IDs (canonical keys from SYMPTOM_LIBRARY). */
  confirmed: string[]
  /** Symptoms the user has explicitly denied. */
  denied: string[]
  /** Symptoms we've already asked about — never re-ask. */
  asked: string[]
  /** How many smart follow-up questions we've fired. */
  followupCount: number
  duration?: string
  severity?: Severity
}

export type ConditionMatch = {
  id: string
  name: string
  /** 0–99 integer probability. */
  probability: number
  matchedSymptoms: string[]
  riskLevel: RiskLevel
}

export type RiskLevel = "Low" | "Medium" | "High"

export type DiagnosisSummary = {
  possibleConditions: ConditionMatch[]
  riskLevel: RiskLevel
  explanation: string
  recommendations: string[]
  disclaimer: string
}

export type ProcessResult = {
  state: ChatbotState
  replies: Array<Omit<ChatMessage, "id" | "timestamp" | "role">>
}

const DISCLAIMER =
  "This is not a medical diagnosis. Always consult a licensed healthcare professional for medical advice."

export const INITIAL_STATE: ChatbotState = {
  step: "collect_primary",
  confirmed: [],
  denied: [],
  asked: [],
  followupCount: 0,
}

export const INITIAL_BOT_MESSAGE = {
  content:
    "Hello, I'm MediBot. I can help analyze your symptoms using clinical reasoning. What symptoms are you experiencing right now? You can list more than one.",
  quickReplies: ["Fever", "Headache", "Cough", "Chest pain", "Sore throat", "Nausea"],
}

// --------------------------------------------------------------------
// Symptom library — canonical IDs and the natural-language synonyms
// the matcher will recognise from free-form user input.
// --------------------------------------------------------------------

type SymptomDef = {
  id: string
  label: string
  synonyms: string[]
}

const SYMPTOM_LIBRARY: SymptomDef[] = [
  { id: "fever", label: "fever", synonyms: ["fever", "high temperature", "feverish", "hot", "burning up"] },
  { id: "chills", label: "chills", synonyms: ["chills", "shivering", "shivers"] },
  { id: "cough", label: "cough", synonyms: ["cough", "coughing"] },
  { id: "dry_cough", label: "dry cough", synonyms: ["dry cough"] },
  { id: "wet_cough", label: "wet cough", synonyms: ["wet cough", "phlegm", "mucus", "productive cough"] },
  { id: "sore_throat", label: "sore throat", synonyms: ["sore throat", "throat pain", "painful throat"] },
  { id: "runny_nose", label: "runny nose", synonyms: ["runny nose", "nasal discharge", "running nose"] },
  { id: "congestion", label: "nasal congestion", synonyms: ["congestion", "blocked nose", "stuffy nose", "stuffy"] },
  { id: "sneezing", label: "sneezing", synonyms: ["sneezing", "sneeze"] },
  { id: "headache", label: "headache", synonyms: ["headache", "head pain", "head ache"] },
  { id: "body_ache", label: "body aches", synonyms: ["body ache", "body pain", "muscle pain", "aches", "myalgia"] },
  { id: "fatigue", label: "fatigue", synonyms: ["fatigue", "tired", "tiredness", "exhausted", "weak", "weakness", "low energy"] },
  { id: "nausea", label: "nausea", synonyms: ["nausea", "nauseous", "queasy", "feel sick"] },
  { id: "vomiting", label: "vomiting", synonyms: ["vomiting", "throwing up", "vomit", "puke", "puking"] },
  { id: "diarrhea", label: "diarrhea", synonyms: ["diarrhea", "loose stools", "loose motion", "loose motions"] },
  { id: "abdominal_pain", label: "abdominal pain", synonyms: ["abdominal pain", "stomach ache", "stomach pain", "belly pain", "tummy pain"] },
  { id: "lower_abdominal_pain", label: "lower abdominal pain", synonyms: ["lower abdominal pain", "pelvic pain", "lower belly pain"] },
  { id: "chest_pain", label: "chest pain", synonyms: ["chest pain", "tight chest", "chest tightness", "chest discomfort", "chest pressure"] },
  { id: "shortness_of_breath", label: "shortness of breath", synonyms: ["shortness of breath", "can't breathe", "cannot breathe", "difficulty breathing", "breathless", "out of breath", "trouble breathing"] },
  { id: "wheezing", label: "wheezing", synonyms: ["wheezing", "wheeze"] },
  { id: "palpitations", label: "heart palpitations", synonyms: ["palpitations", "racing heart", "fast heartbeat", "pounding heart"] },
  { id: "arm_pain", label: "left arm pain", synonyms: ["arm pain", "left arm pain", "arm hurts"] },
  { id: "jaw_pain", label: "jaw pain", synonyms: ["jaw pain", "jaw hurts"] },
  { id: "sweating", label: "cold sweats", synonyms: ["sweating", "cold sweat", "cold sweats", "sweaty"] },
  { id: "dizziness", label: "dizziness", synonyms: ["dizziness", "dizzy", "lightheaded", "light-headed", "vertigo"] },
  { id: "loss_of_smell", label: "loss of smell", synonyms: ["loss of smell", "can't smell", "no sense of smell", "anosmia"] },
  { id: "loss_of_taste", label: "loss of taste", synonyms: ["loss of taste", "can't taste", "no sense of taste"] },
  { id: "light_sensitivity", label: "light sensitivity", synonyms: ["light sensitivity", "sensitive to light", "photophobia"] },
  { id: "rash", label: "skin rash", synonyms: ["rash", "skin rash", "hives", "itchy skin"] },
  { id: "itchy_eyes", label: "itchy/watery eyes", synonyms: ["itchy eyes", "watery eyes", "red eyes"] },
  { id: "burning_urination", label: "painful urination", synonyms: ["burning urination", "painful urination", "burns when peeing", "burning pee"] },
  { id: "frequent_urination", label: "frequent urination", synonyms: ["frequent urination", "peeing a lot", "urinate often"] },
  { id: "excessive_thirst", label: "excessive thirst", synonyms: ["excessive thirst", "very thirsty", "always thirsty", "polydipsia"] },
  { id: "weight_loss", label: "unexplained weight loss", synonyms: ["weight loss", "losing weight", "lost weight"] },
  { id: "blurred_vision", label: "blurred vision", synonyms: ["blurred vision", "blurry vision", "vision problems"] },
  { id: "neck_pain", label: "neck stiffness", synonyms: ["neck pain", "stiff neck", "neck stiffness"] },
]

// --------------------------------------------------------------------
// Disease knowledge base — each disease has weighted symptoms.
// Weights: 3 = hallmark, 2 = strong, 1 = supporting.
// --------------------------------------------------------------------

type DiseaseDef = {
  id: string
  name: string
  baseRisk: RiskLevel
  symptoms: Record<string, number>
  recommendations: string[]
}

const DISEASES: DiseaseDef[] = [
  {
    id: "flu",
    name: "Influenza (Flu)",
    baseRisk: "Medium",
    symptoms: { fever: 3, body_ache: 3, fatigue: 2, cough: 2, chills: 2, sore_throat: 1, headache: 1, runny_nose: 1 },
    recommendations: [
      "Rest and stay well hydrated",
      "Take paracetamol or ibuprofen for fever and body aches",
      "Isolate to avoid spreading the virus",
      "See a doctor if symptoms persist beyond 5 days or worsen",
    ],
  },
  {
    id: "covid",
    name: "COVID-like illness",
    baseRisk: "Medium",
    symptoms: { fever: 2, dry_cough: 3, loss_of_smell: 3, loss_of_taste: 3, fatigue: 2, shortness_of_breath: 3, sore_throat: 1, headache: 1, body_ache: 1 },
    recommendations: [
      "Get a COVID-19 test as soon as possible",
      "Isolate from household members",
      "Monitor your oxygen saturation if available",
      "Seek emergency care if breathing becomes difficult",
    ],
  },
  {
    id: "viral_fever",
    name: "Viral Fever",
    baseRisk: "Low",
    symptoms: { fever: 3, fatigue: 2, body_ache: 2, headache: 2, chills: 1 },
    recommendations: [
      "Rest and drink plenty of fluids",
      "Use paracetamol for fever",
      "Consult a doctor if fever lasts more than 3 days",
    ],
  },
  {
    id: "common_cold",
    name: "Common Cold",
    baseRisk: "Low",
    symptoms: { runny_nose: 3, sneezing: 3, congestion: 2, sore_throat: 2, cough: 2, headache: 1, fatigue: 1 },
    recommendations: [
      "Rest and drink warm fluids",
      "Try steam inhalation for congestion",
      "Most cases resolve in 7–10 days",
    ],
  },
  {
    id: "migraine",
    name: "Migraine",
    baseRisk: "Low",
    symptoms: { headache: 3, nausea: 2, vomiting: 1, light_sensitivity: 3, dizziness: 1 },
    recommendations: [
      "Rest in a quiet, dark room",
      "Stay hydrated and avoid known triggers",
      "Consult a neurologist if attacks are frequent",
    ],
  },
  {
    id: "tension_headache",
    name: "Tension Headache",
    baseRisk: "Low",
    symptoms: { headache: 3, neck_pain: 2, fatigue: 1 },
    recommendations: [
      "Take a short break and rest your eyes",
      "Try OTC pain relievers like ibuprofen",
      "Practice stress-reduction techniques",
    ],
  },
  {
    id: "gastroenteritis",
    name: "Gastroenteritis (Stomach Flu)",
    baseRisk: "Medium",
    symptoms: { nausea: 3, vomiting: 3, diarrhea: 3, abdominal_pain: 2, fever: 1, fatigue: 1 },
    recommendations: [
      "Rehydrate with oral rehydration salts (ORS)",
      "Eat bland foods (BRAT: bananas, rice, applesauce, toast)",
      "See a doctor if blood appears in stool or signs of dehydration",
    ],
  },
  {
    id: "food_poisoning",
    name: "Food Poisoning",
    baseRisk: "Medium",
    symptoms: { nausea: 3, vomiting: 3, abdominal_pain: 3, diarrhea: 2, fever: 1 },
    recommendations: [
      "Hydrate frequently with small sips",
      "Avoid solid foods for the first few hours",
      "See a doctor if symptoms persist beyond 48 hours",
    ],
  },
  {
    id: "cardiac",
    name: "Possible Cardiac Event",
    baseRisk: "High",
    symptoms: { chest_pain: 3, shortness_of_breath: 3, arm_pain: 3, jaw_pain: 2, sweating: 2, nausea: 1, dizziness: 1, palpitations: 2 },
    recommendations: [
      "Call emergency services (911 / 112) immediately",
      "Chew an aspirin if not allergic and able to swallow",
      "Do not drive yourself to the hospital",
      "Sit or lie down and try to stay calm",
    ],
  },
  {
    id: "anxiety",
    name: "Anxiety / Panic Attack",
    baseRisk: "Low",
    symptoms: { chest_pain: 1, shortness_of_breath: 2, dizziness: 2, sweating: 2, palpitations: 3, nausea: 1, fatigue: 1 },
    recommendations: [
      "Practice slow, deep belly breathing",
      "Reduce caffeine and stimulants",
      "Speak to a mental health professional if recurring",
    ],
  },
  {
    id: "asthma",
    name: "Asthma Exacerbation",
    baseRisk: "High",
    symptoms: { shortness_of_breath: 3, wheezing: 3, cough: 2, chest_pain: 2, fatigue: 1 },
    recommendations: [
      "Use your rescue inhaler if prescribed",
      "Sit upright and try to breathe slowly",
      "Seek emergency care if breathing does not improve",
    ],
  },
  {
    id: "pneumonia",
    name: "Pneumonia",
    baseRisk: "High",
    symptoms: { cough: 3, wet_cough: 2, fever: 3, shortness_of_breath: 3, chest_pain: 2, fatigue: 2, chills: 2 },
    recommendations: [
      "See a doctor urgently — pneumonia often needs antibiotics",
      "Rest and stay hydrated",
      "Seek emergency care if breathing becomes severely difficult",
    ],
  },
  {
    id: "uti",
    name: "Urinary Tract Infection",
    baseRisk: "Medium",
    symptoms: { burning_urination: 3, frequent_urination: 3, lower_abdominal_pain: 2, fever: 1, fatigue: 1 },
    recommendations: [
      "Schedule a doctor visit — UTIs typically need antibiotics",
      "Drink plenty of water",
      "Avoid caffeine, alcohol and spicy foods until resolved",
    ],
  },
  {
    id: "diabetes",
    name: "Possible Diabetes",
    baseRisk: "Medium",
    symptoms: { excessive_thirst: 3, frequent_urination: 3, fatigue: 2, weight_loss: 2, blurred_vision: 2 },
    recommendations: [
      "Schedule a fasting blood glucose or HbA1c test",
      "Maintain a balanced low-sugar diet",
      "Consult a physician for proper screening",
    ],
  },
  {
    id: "allergy",
    name: "Allergic Reaction",
    baseRisk: "Low",
    symptoms: { sneezing: 3, runny_nose: 2, itchy_eyes: 3, rash: 2, congestion: 2, cough: 1 },
    recommendations: [
      "Take an OTC antihistamine",
      "Avoid known allergens",
      "Seek immediate care if breathing or swallowing is affected",
    ],
  },
]

// --------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------

export function processUserMessage(
  message: string,
  state: ChatbotState,
): ProcessResult {
  const text = message.trim()
  if (!text) {
    return {
      state,
      replies: [
        {
          content:
            "It looks like your message was empty. Could you tell me what symptoms you're experiencing?",
        },
      ],
    }
  }

  switch (state.step) {
    case "greeting":
    case "collect_primary":
      return handlePrimary(text, state)
    case "smart_followup":
      return handleFollowup(text, state)
    case "duration":
      return handleDuration(text, state)
    case "severity":
      return handleSeverity(text, state)
    case "done":
      return handlePostDiagnosis(text, state)
    default:
      return { state, replies: [] }
  }
}

// --------------------------------------------------------------------
// Conversation step handlers
// --------------------------------------------------------------------

function handlePrimary(text: string, state: ChatbotState): ProcessResult {
  const detected = extractSymptoms(text)
  if (detected.length === 0) {
    return {
      state,
      replies: [
        {
          content:
            "I didn't catch a specific symptom. Could you describe what you're feeling? For example: fever, cough, chest pain, nausea, or headache.",
          quickReplies: INITIAL_BOT_MESSAGE.quickReplies,
        },
      ],
    }
  }

  const confirmed = dedupe([...state.confirmed, ...detected])
  const asked = dedupe([...state.asked, ...detected])

  // Emergency triage — if the immediate input contains a red-flag combo,
  // surface a high-risk warning before continuing.
  const replies: ProcessResult["replies"] = []
  if (isEmergency(confirmed)) {
    replies.push({
      content:
        "Important: the symptoms you mentioned can be signs of a medical emergency. If you are having severe chest pain, trouble breathing, or sudden numbness, please call emergency services right now.",
    })
  }

  return askNextOrAdvance(
    {
      ...state,
      confirmed,
      asked,
      step: "smart_followup",
    },
    replies,
  )
}

function handleFollowup(text: string, state: ChatbotState): ProcessResult {
  // The most recent asked-but-not-confirmed/denied symptom is the one we
  // just asked about.
  const pending = state.asked.find(
    (id) => !state.confirmed.includes(id) && !state.denied.includes(id),
  )

  let next: ChatbotState = { ...state }

  if (pending) {
    if (isAffirmative(text)) {
      next = { ...next, confirmed: dedupe([...next.confirmed, pending]) }
    } else if (isNegative(text)) {
      next = { ...next, denied: dedupe([...next.denied, pending]) }
    } else {
      // Free text — try to extract any new symptoms and treat unmentioned
      // pending one as undetermined (don't hold up the flow).
      const newSyms = extractSymptoms(text)
      if (newSyms.length > 0) {
        next = { ...next, confirmed: dedupe([...next.confirmed, ...newSyms]) }
        if (newSyms.includes(pending)) {
          // already added
        } else {
          // user didn't directly answer yes/no → mark as denied so we move on
          next = { ...next, denied: dedupe([...next.denied, pending]) }
        }
      } else {
        next = { ...next, denied: dedupe([...next.denied, pending]) }
      }
    }
  } else {
    // No pending follow-up; treat as additional symptoms.
    const newSyms = extractSymptoms(text)
    next = { ...next, confirmed: dedupe([...next.confirmed, ...newSyms]) }
  }

  next = { ...next, followupCount: next.followupCount + 1 }

  return askNextOrAdvance(next, [])
}

function handleDuration(text: string, state: ChatbotState): ProcessResult {
  const next: ChatbotState = { ...state, duration: text, step: "severity" }
  return {
    state: next,
    replies: [
      {
        content: "How would you rate the severity of what you're feeling?",
        quickReplies: ["Mild", "Moderate", "Severe"],
      },
    ],
  }
}

function handleSeverity(text: string, state: ChatbotState): ProcessResult {
  const lower = text.toLowerCase()
  let severity: Severity = "mild"
  if (lower.includes("sever")) severity = "severe"
  else if (lower.includes("moder")) severity = "moderate"
  else if (lower.includes("mild")) severity = "mild"

  const next: ChatbotState = { ...state, severity, step: "done" }
  const diagnosis = runDifferentialDiagnosis(next)

  return {
    state: next,
    replies: [
      {
        content: `Thanks. Based on your responses, here is my clinical assessment:`,
        diagnosis,
        quickReplies: ["Start over", "Ask a follow-up question"],
      },
    ],
  }
}

function handlePostDiagnosis(text: string, state: ChatbotState): ProcessResult {
  const lower = text.toLowerCase()
  if (lower.includes("start over") || lower.includes("restart") || lower.includes("new")) {
    return {
      state: INITIAL_STATE,
      replies: [
        {
          content: INITIAL_BOT_MESSAGE.content,
          quickReplies: INITIAL_BOT_MESSAGE.quickReplies,
        },
      ],
    }
  }
  return {
    state,
    replies: [
      {
        content:
          "I'm a rule-based assistant, so I can offer general guidance. " +
          DISCLAIMER,
        quickReplies: ["Start over"],
      },
    ],
  }
}

// --------------------------------------------------------------------
// Flow controller — decides whether to ask another follow-up,
// advance to duration/severity, or finalize the diagnosis.
// --------------------------------------------------------------------

function askNextOrAdvance(
  state: ChatbotState,
  carriedReplies: ProcessResult["replies"],
): ProcessResult {
  const replies = [...carriedReplies]

  // Always ask at least 2 follow-ups (per goal: "ALWAYS ask at least 2
  // follow-up questions before diagnosis"), unless we have very
  // strong signal already.
  const candidates = scoreCandidates(state)
  const top = candidates[0]
  const second = candidates[1]
  const topConfident =
    top && top.probability >= 75 && (!second || top.probability - second.probability >= 25)

  const minFollowups = 2
  const maxFollowups = 4

  if (state.followupCount < maxFollowups && (!topConfident || state.followupCount < minFollowups)) {
    const nextSymptom = pickNextDiscriminatingSymptom(state, candidates)
    if (nextSymptom) {
      const symDef = symptomById(nextSymptom)
      const next: ChatbotState = {
        ...state,
        asked: dedupe([...state.asked, nextSymptom]),
        step: "smart_followup",
      }
      replies.push({
        content: `Do you also have ${symDef?.label ?? nextSymptom}?`,
        quickReplies: ["Yes", "No", "Not sure"],
      })
      return { state: next, replies }
    }
  }

  // Move on to duration.
  const next: ChatbotState = { ...state, step: "duration" }
  replies.push({
    content: `Got it. How long have you been experiencing ${formatList(
      state.confirmed.map((id) => symptomById(id)?.label ?? id),
    )}?`,
    quickReplies: ["Less than a day", "2–3 days", "About a week", "More than a week"],
  })
  return { state: next, replies }
}

// --------------------------------------------------------------------
// Differential diagnosis core — pure & exported for reuse / testing.
// // Replace with real ML model
// --------------------------------------------------------------------

export function runDifferentialDiagnosis(state: ChatbotState): DiagnosisSummary {
  const candidates = scoreCandidates(state)
  const top3 = candidates.slice(0, 3)

  const riskLevel = computeRisk(state, top3)
  const explanation = buildExplanation(state, top3)
  const recommendations = buildRecommendations(state, top3, riskLevel)

  return {
    possibleConditions: top3,
    riskLevel,
    explanation,
    recommendations,
    disclaimer: DISCLAIMER,
  }
}

/**
 * Score every disease against the confirmed symptoms.
 *
 * Probability formula (per disease):
 *   matchedWeight  = sum of weights of confirmed symptoms present in disease
 *   totalWeight    = sum of all weights in the disease's signature
 *   coverage       = matchedWeight / totalWeight        // how complete the match is
 *   specificity    = matchedWeight / sumOfAllUserMatches // how well the disease explains *this* user
 *   penalty        = sum of weights of *denied* symptoms in disease (× 0.6)
 *   raw            = max(0, (coverage * 0.6 + specificity * 0.4) * matchedWeight - penalty * 0.05)
 *
 * The score is then mapped to a 0–99 probability and clamped per
 * candidate so the leader can never read 100% (medicine is uncertain).
 */
export function scoreCandidates(state: ChatbotState): ConditionMatch[] {
  const confirmed = state.confirmed
  if (confirmed.length === 0) return []

  // Total weight the user contributed across the whole knowledge base —
  // used so a single non-specific symptom (e.g. "fatigue") doesn't
  // give every disease a free 100%.
  const userTotalByDisease = DISEASES.map((d) => {
    let m = 0
    for (const s of confirmed) m += d.symptoms[s] ?? 0
    return m
  })
  const userTotal = userTotalByDisease.reduce((a, b) => a + b, 0) || 1

  const raw = DISEASES.map((disease, idx) => {
    const matchedSymptoms = confirmed.filter((s) => disease.symptoms[s] !== undefined)
    const matchedWeight = userTotalByDisease[idx]
    if (matchedWeight === 0) return null

    const totalWeight = Object.values(disease.symptoms).reduce((a, b) => a + b, 0)
    const coverage = matchedWeight / totalWeight
    const specificity = matchedWeight / userTotal
    const denyPenalty =
      state.denied.reduce((acc, s) => acc + (disease.symptoms[s] ?? 0), 0) * 0.6

    let score = (coverage * 0.6 + specificity * 0.4) * matchedWeight
    score = Math.max(0, score - denyPenalty * 0.05)

    // Severity boost for high-risk diseases when severity is severe.
    if (state.severity === "severe" && disease.baseRisk === "High") {
      score *= 1.25
    }
    if (state.severity === "mild" && disease.baseRisk === "High") {
      score *= 0.85
    }

    return {
      id: disease.id,
      name: disease.name,
      score,
      matchedSymptoms,
      coverage,
      riskLevel: disease.baseRisk as RiskLevel,
    }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  if (raw.length === 0) return []

  // Normalise scores into 0–99 probabilities. We do it relative to the
  // best score so the top condition reads ~70–95% range, which feels
  // intuitively correct without ever claiming certainty.
  const maxScore = Math.max(...raw.map((r) => r.score))
  raw.sort((a, b) => b.score - a.score)

  return raw.map((r, i) => {
    // Leader gets ~95% if coverage is great, lower if it isn't.
    const leaderCap = Math.round(60 + r.coverage * 35) // 60–95
    const ratio = r.score / maxScore
    const probability = Math.max(
      5,
      Math.min(leaderCap, Math.round(ratio * leaderCap)),
    )

    // Slight tie-breaker for non-leaders so probabilities visibly
    // decrease in the ranking.
    const adjusted = i === 0 ? probability : Math.min(probability, leaderCap - i * 5)

    return {
      id: r.id,
      name: r.name,
      probability: Math.max(5, adjusted),
      matchedSymptoms: r.matchedSymptoms,
      riskLevel: r.riskLevel,
    }
  })
}

// --------------------------------------------------------------------
// Smart follow-up: pick the most discriminating un-asked symptom.
// --------------------------------------------------------------------

function pickNextDiscriminatingSymptom(
  state: ChatbotState,
  candidates: ConditionMatch[],
): string | null {
  // Build candidate pool. If no candidates yet (very early), seed with
  // common discriminators that cover the broadest space.
  const topPool =
    candidates.length > 0
      ? candidates.slice(0, 5).map((c) => DISEASES.find((d) => d.id === c.id)!).filter(Boolean)
      : DISEASES

  const candidateSymptomIds = new Set<string>()
  for (const d of topPool) {
    for (const s of Object.keys(d.symptoms)) candidateSymptomIds.add(s)
  }

  let best: { id: string; score: number } | null = null

  for (const id of candidateSymptomIds) {
    if (state.asked.includes(id)) continue
    if (state.confirmed.includes(id)) continue
    if (state.denied.includes(id)) continue

    // Discrimination = stdev of weights across top candidates +
    // average weight (so important symptoms still get asked).
    const weights = topPool.map((d) => d.symptoms[id] ?? 0)
    const mean = weights.reduce((a, b) => a + b, 0) / weights.length
    const variance =
      weights.reduce((a, b) => a + (b - mean) ** 2, 0) / weights.length
    const stdev = Math.sqrt(variance)
    const score = mean + stdev * 1.5

    if (!best || score > best.score) best = { id, score }
  }

  return best?.id ?? null
}

// --------------------------------------------------------------------
// Risk classification, explanation, recommendations.
// --------------------------------------------------------------------

const EMERGENCY_COMBOS: Array<[string, string]> = [
  ["chest_pain", "shortness_of_breath"],
  ["chest_pain", "arm_pain"],
  ["chest_pain", "sweating"],
  ["chest_pain", "jaw_pain"],
]

function isEmergency(confirmed: string[]): boolean {
  if (confirmed.includes("shortness_of_breath") && confirmed.includes("wheezing")) return true
  return EMERGENCY_COMBOS.some(
    ([a, b]) => confirmed.includes(a) && confirmed.includes(b),
  )
}

function computeRisk(state: ChatbotState, top: ConditionMatch[]): RiskLevel {
  if (isEmergency(state.confirmed)) return "High"

  const leader = top[0]
  if (leader && leader.riskLevel === "High" && leader.probability >= 50) return "High"

  if (state.severity === "severe") {
    return leader?.riskLevel === "Low" ? "Medium" : "High"
  }

  if (leader?.riskLevel === "Medium") return "Medium"
  if (state.confirmed.length >= 4) return "Medium"

  return leader?.riskLevel ?? "Low"
}

function buildExplanation(state: ChatbotState, top: ConditionMatch[]): string {
  if (top.length === 0) {
    return "I don't have enough information yet to suggest a likely cause."
  }
  const leader = top[0]
  const matchedLabels = leader.matchedSymptoms
    .map((id) => symptomById(id)?.label ?? id)
    .slice(0, 5)

  const matched = formatList(matchedLabels)
  const sev = state.severity ?? "unspecified"
  const dur = state.duration ?? "an unspecified duration"

  return `Based on ${matched}, with ${sev} severity over ${dur}, the most likely cause is ${leader.name}. I've also listed close alternatives because clinical presentations often overlap.`
}

function buildRecommendations(
  state: ChatbotState,
  top: ConditionMatch[],
  risk: RiskLevel,
): string[] {
  const out: string[] = []

  if (risk === "High") {
    out.push("Seek medical attention as soon as possible — call emergency services if symptoms are severe.")
  }

  const leader = top[0]
  if (leader) {
    const disease = DISEASES.find((d) => d.id === leader.id)
    if (disease) out.push(...disease.recommendations)
  }

  if (state.severity === "severe" && risk !== "High") {
    out.unshift("Given the severity, please consult a doctor today.")
  }
  if (state.duration && /week/i.test(state.duration) && risk === "Low") {
    out.push("Symptoms lasting more than a week warrant a clinical evaluation.")
  }

  return dedupe(out)
}

// --------------------------------------------------------------------
// NL helpers
// --------------------------------------------------------------------

function extractSymptoms(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `
  const found: string[] = []
  for (const s of SYMPTOM_LIBRARY) {
    for (const syn of s.synonyms) {
      if (lower.includes(` ${syn} `) || lower.includes(syn)) {
        found.push(s.id)
        break
      }
    }
  }
  return dedupe(found)
}

function isAffirmative(text: string): boolean {
  const t = text.toLowerCase().trim()
  return /^(yes|yeah|yep|yup|y|sure|absolutely|definitely|i do|kinda|kind of|a bit|a little|sometimes)/.test(t)
}

function isNegative(text: string): boolean {
  const t = text.toLowerCase().trim()
  return /^(no|nope|nah|n|not really|don'?t think so|i don'?t|negative|none)/.test(t)
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function formatList(items: string[]): string {
  if (items.length === 0) return "your symptoms"
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function symptomById(id: string): SymptomDef | undefined {
  return SYMPTOM_LIBRARY.find((s) => s.id === id)
}
