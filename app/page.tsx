"use client"

import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Brain,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useT } from "@/lib/i18n"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Our model maps symptom patterns to likely conditions using thousands of clinical signals — all in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Risk-Aware Insights",
    description:
      "Every prediction includes a Low / Medium / High risk badge and confidence score so you know how seriously to take it.",
  },
  {
    icon: HeartPulse,
    title: "Personalized Guidance",
    description:
      "Get tailored recommendations and next-steps for every result — from home care to when to see a doctor.",
  },
]

const stats = [
  { value: "27+", label: "Symptoms tracked" },
  { value: "10+", label: "Conditions covered" },
  { value: "<2s", label: "Average analysis time" },
  { value: "70-95%", label: "Confidence range" },
]

export default function HomePage() {
  const { t } = useT()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 right-1/3 size-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 size-[30rem] rounded-full bg-accent/40 blur-3xl" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            {t("landing.badge")}
          </div>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            {t("landing.title.line1")}{" "}
            <span className="text-primary">
              {t("landing.title.highlight")}
            </span>{" "}
            {t("landing.title.line2")}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {t("landing.subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/symptoms">
                <Activity className="size-4" />
                {t("cta.startDiagnosis")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard">{t("landing.viewDashboard")}</Link>
            </Button>
          </div>

          {/* Stats strip */}
          <dl className="mt-14 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card/60 px-4 py-3 text-center backdrop-blur"
              >
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 font-mono text-xl font-semibold text-foreground">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Why HealthGuard
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Smart triage for the questions you can&apos;t Google
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
            Built with the patterns that real clinicians use, distilled into a
            5-minute self-check.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group transition hover:shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                How it works
              </p>
              <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Three steps from symptom to clarity
              </h2>
              <ol className="mt-6 space-y-5">
                {[
                  {
                    n: 1,
                    title: "Describe your symptoms",
                    body: "Pick from a curated symptom library and tell us how long you've felt this way.",
                  },
                  {
                    n: 2,
                    title: "Get an AI assessment",
                    body: "Our model returns a likely condition, confidence score, and a risk level.",
                  },
                  {
                    n: 3,
                    title: "Take action",
                    body: "Follow personalized recommendations and revisit your results anytime in the dashboard.",
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground">
                      {s.n}
                    </div>
                    <div>
                      <h3 className="font-semibold">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8">
                <Button asChild size="lg">
                  <Link href="/symptoms">
                    <Stethoscope className="size-4" />
                    Try it now
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="border-border bg-card shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HeartPulse className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Sample Result
                    </p>
                    <p className="font-semibold">Influenza (Flu)</p>
                  </div>
                  <span className="ml-auto rounded-full border border-chart-2/30 bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    Medium Risk
                  </span>
                </div>
                <div className="space-y-4 pt-5">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-mono font-medium">87%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: "87%" }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Rest and stay well hydrated
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Take fever reducers as directed
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Monitor breathing — seek care if it worsens
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-12">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Stethoscope className="size-6" />
            </div>
            <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
              Take the guesswork out of your symptoms
            </h2>
            <p className="max-w-lg text-pretty text-muted-foreground">
              Free, private, and ready in two minutes. HealthGuard never
              replaces a doctor — it just helps you ask better questions.
            </p>
            <Button asChild size="lg">
              <Link href="/symptoms">
                Start Free Diagnosis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} HealthGuard AI · Informational use only.</p>
          <p className="text-xs">Built with Next.js · Tailwind · Recharts</p>
        </div>
      </footer>
    </div>
  )
}
