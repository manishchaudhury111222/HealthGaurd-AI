import type { PredictionInput, PredictionResult, RiskLevel } from "./types"

/**
 * Mock ML prediction logic.
 * Maps symptom combinations to likely conditions with a confidence score.
 * Designed to be swapped later for a real Python/Flask ML API.
 */

export const SYMPTOM_LIBRARY = [
  "Fever",
  "Cough",
  "Sore throat",
  "Runny nose",
  "Shortness of breath",
  "Chest pain",
  "Fatigue",
  "Headache",
  "Body aches",
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Abdominal pain",
  "Dizziness",
  "Weight loss",
  "Frequent urination",
  "Increased thirst",
  "Blurred vision",
  "Rash",
  "Joint pain",
  "Sweating",
  "Chills",
  "Loss of appetite",
  "Palpitations",
  "Swelling",
  "Numbness",
  "Back pain",
] as const

type Rule = {
  match: string[]
  disease: string
  baseRisk: RiskLevel
  suggestions: string[]
  explanation: string
}

const RULES: Rule[] = [
  {
    match: ["fever", "cough"],
    disease: "Influenza (Flu)",
    baseRisk: "Medium",
    explanation:
      "The combination of fever and cough is strongly associated with seasonal influenza, especially when accompanied by body aches or chills.",
    suggestions: [
      "Rest and stay well hydrated",
      "Take over-the-counter fever reducers as directed",
      "Monitor breathing — seek urgent care if it worsens",
      "Consider a flu test if symptoms persist beyond 48 hours",
    ],
  },
  {
    match: ["fever", "cough", "shortness of breath"],
    disease: "Respiratory Infection",
    baseRisk: "High",
    explanation:
      "Fever, cough, and shortness of breath together can indicate a lower respiratory tract infection such as pneumonia or COVID-19.",
    suggestions: [
      "Seek medical evaluation promptly",
      "Request a chest exam and possible imaging",
      "Monitor oxygen saturation if a pulse oximeter is available",
      "Isolate from others until a diagnosis is confirmed",
    ],
  },
  {
    match: ["chest pain"],
    disease: "Cardiovascular Risk",
    baseRisk: "High",
    explanation:
      "Chest pain can be a sign of cardiac stress. Combined with shortness of breath or palpitations, it warrants immediate attention.",
    suggestions: [
      "Seek emergency care if pain radiates or is severe",
      "Avoid physical exertion until evaluated",
      "Schedule an ECG and cardiac workup",
      "Track blood pressure and heart rate",
    ],
  },
  {
    match: ["chest pain", "palpitations"],
    disease: "Possible Arrhythmia",
    baseRisk: "High",
    explanation:
      "Chest pain combined with palpitations suggests a possible heart rhythm disturbance requiring prompt cardiology evaluation.",
    suggestions: [
      "Go to an emergency department for an ECG",
      "Avoid stimulants (caffeine, nicotine)",
      "Note triggers (exercise, stress, meals)",
      "Request a Holter monitor if intermittent",
    ],
  },
  {
    match: ["fatigue", "weight loss"],
    disease: "Diabetes Risk",
    baseRisk: "Medium",
    explanation:
      "Unexplained fatigue and weight loss — particularly with increased thirst or urination — can indicate blood sugar dysregulation.",
    suggestions: [
      "Schedule a fasting glucose and HbA1c test",
      "Review diet with a focus on low glycemic foods",
      "Track water intake and urination frequency",
      "Consult a primary care provider",
    ],
  },
  {
    match: ["increased thirst", "frequent urination"],
    disease: "Diabetes Risk",
    baseRisk: "High",
    explanation:
      "Increased thirst and frequent urination are classic early signs of elevated blood glucose (hyperglycemia).",
    suggestions: [
      "Book a glucose panel within the week",
      "Reduce refined sugar intake",
      "Monitor for blurred vision or numbness",
      "Seek same-day care if severe",
    ],
  },
  {
    match: ["headache", "dizziness"],
    disease: "Tension / Migraine",
    baseRisk: "Low",
    explanation:
      "Headache with dizziness is often related to tension, dehydration, or migraine. Persistent episodes warrant evaluation.",
    suggestions: [
      "Hydrate and rest in a dark, quiet room",
      "Track triggers (sleep, screens, stress)",
      "Try OTC pain relief if appropriate",
      "See a doctor if episodes are frequent or severe",
    ],
  },
  {
    match: ["nausea", "vomiting", "diarrhea"],
    disease: "Gastroenteritis",
    baseRisk: "Medium",
    explanation:
      "These symptoms together suggest acute gastroenteritis, commonly viral. Monitor for dehydration, especially with fever.",
    suggestions: [
      "Sip oral rehydration solution frequently",
      "Avoid solid food until nausea subsides",
      "Return to a bland diet (BRAT) gradually",
      "Seek care if symptoms last more than 48 hours",
    ],
  },
  {
    match: ["sore throat", "runny nose"],
    disease: "Common Cold",
    baseRisk: "Low",
    explanation:
      "A typical upper respiratory viral infection. Most cases resolve on their own within a week.",
    suggestions: [
      "Rest and drink warm fluids",
      "Use saline nasal spray for congestion",
      "Gargle salt water for throat relief",
      "See a doctor if fever spikes or symptoms worsen after 5 days",
    ],
  },
  {
    match: ["rash", "joint pain"],
    disease: "Inflammatory Condition",
    baseRisk: "Medium",
    explanation:
      "Rash combined with joint pain can suggest an autoimmune or reactive inflammatory condition that benefits from early evaluation.",
    suggestions: [
      "Photograph the rash for tracking",
      "Note joint stiffness duration in the morning",
      "Request an ANA / CRP blood panel",
      "Consult a rheumatologist if symptoms persist",
    ],
  },
]

function normalize(list: string[]): string[] {
  return list.map((s) => s.trim().toLowerCase())
}

function hashSeed(input: PredictionInput): number {
  const str = `${input.age}-${input.gender}-${input.duration}-${input.symptoms.join(",")}`
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

function seededRandom(seed: number): () => number {
  let s = seed || 1
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function escalateRisk(base: RiskLevel, age: number, duration: number): RiskLevel {
  let score = base === "Low" ? 1 : base === "Medium" ? 2 : 3
  if (age >= 60) score += 1
  if (duration >= 7) score += 1
  if (score >= 3) return "High"
  if (score === 2) return "Medium"
  return "Low"
}

export function predict(input: PredictionInput): Omit<PredictionResult, "id" | "createdAt"> {
  const symptoms = normalize(input.symptoms)

  // Find the rule with the most matching symptoms
  let bestRule: Rule | null = null
  let bestScore = 0

  for (const rule of RULES) {
    const hits = rule.match.filter((s) => symptoms.includes(s)).length
    if (hits > bestScore && hits === rule.match.length) {
      // require all rule symptoms to match
      bestScore = hits
      bestRule = rule
    }
  }

  const rng = seededRandom(hashSeed(input))

  if (!bestRule) {
    // Generic fallback
    const confidence = Math.round(60 + rng() * 15) // 60-75
    const risk = escalateRisk("Low", input.age, input.duration)
    return {
      disease: "Non-specific symptoms",
      risk,
      confidence,
      explanation:
        "Your symptoms don't match a distinct pattern in our mock model. This often points to mild or early-stage conditions. Continue to monitor and consult a clinician if symptoms persist.",
      suggestions: [
        "Keep a daily symptom journal",
        "Rest and stay hydrated",
        "Track temperature twice a day",
        "See a clinician if symptoms worsen or last more than 5 days",
      ],
      input,
    }
  }

  const confidence = Math.round(70 + rng() * 25) // 70-95
  const risk = escalateRisk(bestRule.baseRisk, input.age, input.duration)

  return {
    disease: bestRule.disease,
    risk,
    confidence,
    explanation: bestRule.explanation,
    suggestions: bestRule.suggestions,
    input,
  }
}
