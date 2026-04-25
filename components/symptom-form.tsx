"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { SYMPTOM_LIBRARY } from "@/lib/prediction"
import type { Gender, PredictionResult } from "@/lib/types"

const STEPS = [
  { id: 1, title: "About you", description: "Basic demographics" },
  { id: 2, title: "Symptoms", description: "Select everything you feel" },
  { id: 3, title: "Duration", description: "How long have symptoms lasted" },
  { id: 4, title: "Review", description: "Confirm and analyze" },
]

export function SymptomForm() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [age, setAge] = React.useState<string>("")
  const [gender, setGender] = React.useState<Gender | "">("")
  const [symptoms, setSymptoms] = React.useState<string[]>([])
  const [search, setSearch] = React.useState("")
  const [duration, setDuration] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)

  const filteredSymptoms = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return SYMPTOM_LIBRARY
    return SYMPTOM_LIBRARY.filter((s) => s.toLowerCase().includes(q))
  }, [search])

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )
  }

  function canContinue(): boolean {
    if (step === 1) {
      const n = Number(age)
      return !!gender && !Number.isNaN(n) && n > 0 && n < 120
    }
    if (step === 2) return symptoms.length > 0
    if (step === 3) {
      const n = Number(duration)
      return !Number.isNaN(n) && n > 0 && n <= 365
    }
    return true
  }

  async function handleSubmit() {
    if (!canContinue()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(age),
          gender,
          symptoms,
          duration: Number(duration),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Prediction failed")
      }

      const data = (await res.json()) as PredictionResult

      // Cache in session storage for instant UI on results page
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`prediction:${data.id}`, JSON.stringify(data))
      }

      toast.success("Analysis complete", {
        description: `Detected: ${data.disease}`,
      })

      router.push(`/results?id=${data.id}`)
    } catch (err) {
      toast.error("Something went wrong", {
        description: (err as Error).message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const progress = (step / STEPS.length) * 100

  return (
    <Card className="overflow-hidden p-0">
      {/* Progress header */}
      <div className="border-b border-border bg-secondary/40 p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Step {step} of {STEPS.length}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold">
              {STEPS[step - 1].title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STEPS[step - 1].description}
            </p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-xs font-medium",
                  s.id < step &&
                    "border-primary bg-primary text-primary-foreground",
                  s.id === step &&
                    "border-primary bg-primary/10 text-primary",
                  s.id > step &&
                    "border-border bg-background text-muted-foreground",
                )}
                aria-label={`Step ${s.id}: ${s.title}`}
              >
                {s.id < step ? <Check className="size-4" /> : s.id}
              </div>
            ))}
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step content */}
      <div className="p-5 sm:p-8">
        {step === 1 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="age">Age</FieldLabel>
              <Input
                id="age"
                type="number"
                min={1}
                max={119}
                inputMode="numeric"
                placeholder="e.g. 34"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <FieldDescription>
                Your age helps refine the risk assessment.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="gender">Gender</FieldLabel>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select a gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other / Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search symptoms…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-lg border border-dashed border-border bg-secondary/40 p-3">
                {symptoms.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    {s}
                    <X className="size-3" aria-hidden />
                    <span className="sr-only">Remove</span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-3">
              {filteredSymptoms.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                  No symptoms match &quot;{search}&quot;
                </p>
              )}
              {filteredSymptoms.map((s) => {
                const selected = symptoms.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-secondary/60",
                    )}
                  >
                    <span className="truncate">{s}</span>
                    {selected && <Check className="size-4 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              {symptoms.length} symptom{symptoms.length === 1 ? "" : "s"} selected
            </p>
          </div>
        )}

        {step === 3 && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="duration">Duration (days)</FieldLabel>
              <Input
                id="duration"
                type="number"
                min={1}
                max={365}
                inputMode="numeric"
                placeholder="e.g. 3"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <FieldDescription>
                How many days have you been experiencing these symptoms?
              </FieldDescription>
            </Field>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[1, 3, 7, 14].map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={duration === String(d) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(String(d))}
                >
                  {d} day{d > 1 ? "s" : ""}
                </Button>
              ))}
            </div>
          </FieldGroup>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <User className="size-4 text-primary" />
                Review your entries
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Age</dt>
                  <dd className="font-medium">{age}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Gender</dt>
                  <dd className="font-medium capitalize">{gender || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium">
                    {duration} day{Number(duration) === 1 ? "" : "s"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Symptoms</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {symptoms.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-xs text-muted-foreground">
              HealthGuard provides informational analysis only. It is not a medical
              diagnosis. Consult a licensed clinician for care decisions.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {step < STEPS.length ? (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
              disabled={!canContinue()}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canContinue()}
            >
              {submitting ? (
                <>
                  <Spinner />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Analyze Symptoms
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
