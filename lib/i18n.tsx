"use client"

import * as React from "react"

export type Locale = "en" | "hi"

export const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
]

type Dict = Record<string, string>

const dictionaries: Record<Locale, Dict> = {
  en: {
    "nav.home": "Home",
    "nav.diagnose": "Diagnose",
    "nav.dashboard": "Dashboard",
    "nav.profile": "Profile",
    "cta.startDiagnosis": "Start Diagnosis",
    "cta.newDiagnosis": "New Diagnosis",
    "cta.save": "Save changes",
    "cta.saving": "Saving…",
    "cta.dismiss": "Dismiss",

    "landing.badge": "AI-powered early detection",
    "landing.title.line1": "AI-Based",
    "landing.title.highlight": "Early Disease Detection",
    "landing.title.line2": "for Everyone",
    "landing.subtitle":
      "Describe how you feel and let HealthGuard analyze your symptoms, age, and history to surface potential conditions, risk levels, and the next steps that actually matter.",
    "landing.viewDashboard": "View Dashboard",

    "dashboard.kicker": "Dashboard",
    "dashboard.title": "Your Health Overview",
    "dashboard.subtitle":
      "Track your past assessments, watch trends in your health score, and spot patterns over time.",
    "dashboard.stats.assessments": "Assessments",
    "dashboard.stats.assessments.hint": "Total predictions",
    "dashboard.stats.confidence": "Avg. Confidence",
    "dashboard.stats.confidence.hint": "Across all results",
    "dashboard.stats.score": "Health Score",
    "dashboard.stats.score.hint": "From latest result",
    "dashboard.stats.alerts": "High-Risk Alerts",
    "dashboard.stats.alerts.hint": "In your history",
    "dashboard.scoreTrend": "Health Score Trend",
    "dashboard.symptomFreq": "Most Frequent Symptoms",
    "dashboard.riskDist": "Risk Distribution",
    "dashboard.topConditions": "Top Predicted Conditions",
    "dashboard.alerts": "Smart Alerts",
    "dashboard.alerts.empty":
      "No active alerts. We'll notify you here when patterns emerge.",
    "dashboard.history": "Past Predictions",
    "dashboard.empty.title": "No assessments yet",
    "dashboard.empty.description":
      "Run your first symptom analysis and HealthGuard will start tracking your trends here.",
    "dashboard.profileCard.title": "Health Profile",
    "dashboard.profileCard.editLink": "Edit profile",
    "dashboard.profileCard.bmi": "BMI",
    "dashboard.profileCard.age": "Age",
    "dashboard.profileCard.sex": "Sex",
    "dashboard.profileCard.conditions": "Conditions",
    "dashboard.profileCard.none": "None recorded",

    "profile.kicker": "Your Profile",
    "profile.title": "Health Profile",
    "profile.subtitle":
      "We use this to personalize your risk estimates and smart alerts.",
    "profile.section.basic": "Basic information",
    "profile.section.body": "Body metrics",
    "profile.section.medical": "Medical history",
    "profile.section.lifestyle": "Lifestyle",
    "profile.field.name": "Full name",
    "profile.field.email": "Email",
    "profile.field.age": "Age",
    "profile.field.sex": "Sex",
    "profile.field.height": "Height (cm)",
    "profile.field.weight": "Weight (kg)",
    "profile.field.bloodGroup": "Blood group",
    "profile.field.conditions": "Pre-existing conditions",
    "profile.field.conditions.help":
      "Comma-separated, e.g. Diabetes, Asthma",
    "profile.field.medications": "Current medications",
    "profile.field.medications.help":
      "Comma-separated, e.g. Metformin, Salbutamol",
    "profile.field.allergies": "Allergies",
    "profile.field.allergies.help": "Comma-separated, e.g. Peanuts, Penicillin",
    "profile.field.smoking": "I smoke regularly",
    "profile.field.alcohol": "I drink alcohol regularly",
    "profile.field.exercise": "Exercise frequency",
    "profile.exercise.none": "None",
    "profile.exercise.light": "Light (1–2x/week)",
    "profile.exercise.moderate": "Moderate (3–4x/week)",
    "profile.exercise.intense": "Intense (5+/week)",
    "profile.sex.male": "Male",
    "profile.sex.female": "Female",
    "profile.sex.other": "Other",
    "profile.sex.prefer_not_say": "Prefer not to say",

    "lang.toggle": "Language",

    "common.loading": "Loading…",
  },
  hi: {
    "nav.home": "मुख्य पृष्ठ",
    "nav.diagnose": "जाँच करें",
    "nav.dashboard": "डैशबोर्ड",
    "nav.profile": "प्रोफ़ाइल",
    "cta.startDiagnosis": "जाँच शुरू करें",
    "cta.newDiagnosis": "नई जाँच",
    "cta.save": "सहेजें",
    "cta.saving": "सहेज रहे हैं…",
    "cta.dismiss": "बंद करें",

    "landing.badge": "एआई-आधारित प्रारंभिक पहचान",
    "landing.title.line1": "एआई-आधारित",
    "landing.title.highlight": "प्रारंभिक रोग पहचान",
    "landing.title.line2": "सभी के लिए",
    "landing.subtitle":
      "अपने लक्षण बताइए और HealthGuard आपकी आयु, इतिहास और लक्षणों का विश्लेषण करके संभावित बीमारियाँ, जोखिम स्तर और अगले कदम सुझाएगा।",
    "landing.viewDashboard": "डैशबोर्ड देखें",

    "dashboard.kicker": "डैशबोर्ड",
    "dashboard.title": "आपका स्वास्थ्य सारांश",
    "dashboard.subtitle":
      "अपनी पिछली जाँचों, स्वास्थ्य स्कोर के रुझान और समय के साथ पैटर्न देखें।",
    "dashboard.stats.assessments": "कुल जाँचें",
    "dashboard.stats.assessments.hint": "कुल भविष्यवाणियाँ",
    "dashboard.stats.confidence": "औसत विश्वास",
    "dashboard.stats.confidence.hint": "सभी परिणामों में",
    "dashboard.stats.score": "स्वास्थ्य स्कोर",
    "dashboard.stats.score.hint": "नवीनतम परिणाम से",
    "dashboard.stats.alerts": "उच्च-जोखिम अलर्ट",
    "dashboard.stats.alerts.hint": "आपके इतिहास में",
    "dashboard.scoreTrend": "स्वास्थ्य स्कोर का रुझान",
    "dashboard.symptomFreq": "सबसे आम लक्षण",
    "dashboard.riskDist": "जोखिम वितरण",
    "dashboard.topConditions": "शीर्ष पूर्वानुमानित बीमारियाँ",
    "dashboard.alerts": "स्मार्ट अलर्ट",
    "dashboard.alerts.empty":
      "कोई सक्रिय अलर्ट नहीं। पैटर्न दिखने पर हम सूचित करेंगे।",
    "dashboard.history": "पिछली भविष्यवाणियाँ",
    "dashboard.empty.title": "अभी तक कोई जाँच नहीं",
    "dashboard.empty.description":
      "अपनी पहली लक्षण जाँच चलाइए, फिर हम यहाँ रुझान दिखाएँगे।",
    "dashboard.profileCard.title": "स्वास्थ्य प्रोफ़ाइल",
    "dashboard.profileCard.editLink": "प्रोफ़ाइल संपादित करें",
    "dashboard.profileCard.bmi": "बीएमआई",
    "dashboard.profileCard.age": "आयु",
    "dashboard.profileCard.sex": "लिंग",
    "dashboard.profileCard.conditions": "बीमारियाँ",
    "dashboard.profileCard.none": "कोई दर्ज नहीं",

    "profile.kicker": "आपकी प्रोफ़ाइल",
    "profile.title": "स्वास्थ्य प्रोफ़ाइल",
    "profile.subtitle":
      "हम इसका उपयोग आपके जोखिम अनुमान और स्मार्ट अलर्ट को व्यक्तिगत बनाने के लिए करते हैं।",
    "profile.section.basic": "बुनियादी जानकारी",
    "profile.section.body": "शारीरिक मापदंड",
    "profile.section.medical": "चिकित्सा इतिहास",
    "profile.section.lifestyle": "जीवनशैली",
    "profile.field.name": "पूरा नाम",
    "profile.field.email": "ईमेल",
    "profile.field.age": "आयु",
    "profile.field.sex": "लिंग",
    "profile.field.height": "ऊँचाई (सेमी)",
    "profile.field.weight": "वज़न (किग्रा)",
    "profile.field.bloodGroup": "रक्त समूह",
    "profile.field.conditions": "मौजूदा बीमारियाँ",
    "profile.field.conditions.help":
      "अल्पविराम से अलग करें, जैसे मधुमेह, दमा",
    "profile.field.medications": "वर्तमान दवाएँ",
    "profile.field.medications.help":
      "अल्पविराम से अलग करें, जैसे मेटफॉर्मिन, साल्बुटामोल",
    "profile.field.allergies": "एलर्जी",
    "profile.field.allergies.help":
      "अल्पविराम से अलग करें, जैसे मूँगफली, पेनिसिलिन",
    "profile.field.smoking": "मैं नियमित धूम्रपान करता/करती हूँ",
    "profile.field.alcohol": "मैं नियमित शराब पीता/पीती हूँ",
    "profile.field.exercise": "व्यायाम की आवृत्ति",
    "profile.exercise.none": "कोई नहीं",
    "profile.exercise.light": "हल्का (1–2 बार/सप्ताह)",
    "profile.exercise.moderate": "मध्यम (3–4 बार/सप्ताह)",
    "profile.exercise.intense": "भारी (5+ बार/सप्ताह)",
    "profile.sex.male": "पुरुष",
    "profile.sex.female": "महिला",
    "profile.sex.other": "अन्य",
    "profile.sex.prefer_not_say": "नहीं बताना चाहूँगा/चाहूँगी",

    "lang.toggle": "भाषा",

    "common.loading": "लोड हो रहा है…",
  },
}

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

const STORAGE_KEY = "healthguard.locale"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en")

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "en" || saved === "hi") setLocaleState(saved)
    } catch {
      // ignore
    }
  }, [])

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
      document.documentElement.lang = l
    } catch {
      // ignore
    }
  }, [])

  const t = React.useCallback(
    (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    [locale],
  )

  const value = React.useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT(): I18nContextValue {
  const ctx = React.useContext(I18nContext)
  if (!ctx) {
    // Safe fallback so server components or unwrapped trees don't crash.
    return {
      locale: "en",
      setLocale: () => {},
      t: (k) => dictionaries.en[k] ?? k,
    }
  }
  return ctx
}
