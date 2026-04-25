"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Activity,
  ArrowRight,
  CalendarDays,
  HeartPulse,
  Plus,
  Stethoscope,
  TrendingUp,
  User,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { RiskBadge } from "@/components/risk-badge"
import { AlertsPanel } from "@/components/alerts-panel"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { PredictionResult, RiskLevel, UserProfile } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function riskScore(p: PredictionResult): number {
  const burden = p.risk === "Low" ? 10 : p.risk === "Medium" ? 30 : 55
  const weighted = (burden * p.confidence) / 100
  return Math.max(0, Math.round(100 - weighted))
}

function bmi(p: UserProfile | undefined): number | null {
  if (!p?.heightCm || !p?.weightKg) return null
  const m = p.heightCm / 100
  return Math.round((p.weightKg / (m * m)) * 10) / 10
}

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: "var(--chart-1)",
  Medium: "var(--chart-3)",
  High: "var(--chart-4)",
}

export default function DashboardPage() {
  const { t } = useT()
  const { data, isLoading } = useSWR<{ predictions: PredictionResult[] }>(
    "/api/history",
    fetcher,
  )
  const { data: profile } = useSWR<UserProfile>("/api/profile", fetcher)

  const predictions = data?.predictions ?? []

  const stats = React.useMemo(() => {
    if (predictions.length === 0) {
      return { total: 0, avgConfidence: 0, latestScore: 0, highRisk: 0 }
    }
    const total = predictions.length
    const avgConfidence = Math.round(
      predictions.reduce((acc, p) => acc + p.confidence, 0) / total,
    )
    const latestScore = riskScore(predictions[0])
    const highRisk = predictions.filter((p) => p.risk === "High").length
    return { total, avgConfidence, latestScore, highRisk }
  }, [predictions])

  const trendData = React.useMemo(() => {
    return predictions
      .slice()
      .reverse()
      .map((p) => ({
        date: new Date(p.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score: riskScore(p),
        confidence: p.confidence,
      }))
  }, [predictions])

  const symptomFreqData = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of predictions) {
      for (const s of p.input.symptoms) {
        counts.set(s, (counts.get(s) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries())
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [predictions])

  const riskDistData = React.useMemo(() => {
    const buckets: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0 }
    for (const p of predictions) buckets[p.risk]++
    return (["Low", "Medium", "High"] as RiskLevel[])
      .map((level) => ({ level, count: buckets[level] }))
      .filter((d) => d.count > 0)
  }, [predictions])

  const topConditionsData = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of predictions) {
      counts.set(p.disease, (counts.get(p.disease) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [predictions])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {t("dashboard.kicker")}
          </p>
          <h1 className="mt-1 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("dashboard.title")}
          </h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/symptoms">
            <Plus className="size-4" />
            {t("cta.newDiagnosis")}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center gap-3 text-muted-foreground">
          <Spinner />
          <span>{t("common.loading")}</span>
        </div>
      ) : predictions.length === 0 ? (
        <Empty className="mx-auto max-w-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Stethoscope />
            </EmptyMedia>
            <EmptyTitle>{t("dashboard.empty.title")}</EmptyTitle>
            <EmptyDescription>
              {t("dashboard.empty.description")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/symptoms">
                {t("cta.startDiagnosis")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Activity className="size-4" />}
              label={t("dashboard.stats.assessments")}
              value={String(stats.total)}
              hint={t("dashboard.stats.assessments.hint")}
            />
            <StatCard
              icon={<TrendingUp className="size-4" />}
              label={t("dashboard.stats.confidence")}
              value={`${stats.avgConfidence}%`}
              hint={t("dashboard.stats.confidence.hint")}
            />
            <StatCard
              icon={<HeartPulse className="size-4" />}
              label={t("dashboard.stats.score")}
              value={String(stats.latestScore)}
              hint={t("dashboard.stats.score.hint")}
            />
            <StatCard
              icon={<Stethoscope className="size-4" />}
              label={t("dashboard.stats.alerts")}
              value={String(stats.highRisk)}
              hint={t("dashboard.stats.alerts.hint")}
              tone={stats.highRisk > 0 ? "warning" : "default"}
            />
          </div>

          {/* Profile mini + alerts */}
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <ProfileMini profile={profile} />
            <AlertsPanel />
          </div>

          {/* Trend chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-primary" />
                {t("dashboard.scoreTrend")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient
                        id="scoreFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#scoreFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Symptom frequency + risk distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4 text-primary" />
                  {t("dashboard.symptomFreq")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {symptomFreqData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    —
                  </p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={symptomFreqData}
                        layout="vertical"
                        margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          stroke="var(--muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="symptom"
                          stroke="var(--muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          width={110}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--secondary)", opacity: 0.5 }}
                          contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="var(--chart-2)"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HeartPulse className="size-4 text-primary" />
                  {t("dashboard.riskDist")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskDistData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    —
                  </p>
                ) : (
                  <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              background: "var(--popover)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Pie
                            data={riskDistData}
                            dataKey="count"
                            nameKey="level"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="var(--background)"
                          >
                            {riskDistData.map((d) => (
                              <Cell
                                key={d.level}
                                fill={RISK_COLORS[d.level as RiskLevel]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {riskDistData.map((d) => (
                        <li
                          key={d.level}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="size-3 rounded-sm"
                            style={{
                              background: RISK_COLORS[d.level as RiskLevel],
                            }}
                          />
                          <span className="font-medium">{d.level}</span>
                          <span className="font-mono text-muted-foreground">
                            {d.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Stethoscope className="size-4 text-primary" />
                {t("dashboard.topConditions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topConditionsData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  —
                </p>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topConditionsData}
                      margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="condition"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--secondary)", opacity: 0.5 }}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="var(--chart-1)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="size-4 text-primary" />
                {t("dashboard.history")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {predictions.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/results?id=${p.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-secondary/50"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Stethoscope className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{p.disease}</p>
                          <RiskBadge risk={p.risk} size="sm" />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {p.input.symptoms.slice(0, 4).join(" · ")}
                          {p.input.symptoms.length > 4 && " · …"}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="font-mono text-sm font-medium">
                          {p.confidence}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  tone?: "default" | "warning"
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              tone === "warning"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            {icon}
          </span>
        </div>
        <p className="font-mono text-2xl font-semibold tracking-tight">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function ProfileMini({ profile }: { profile: UserProfile | undefined }) {
  const { t } = useT()
  const value = bmi(profile)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="size-4 text-primary" />
          {t("dashboard.profileCard.title")}
        </CardTitle>
        <Link
          href="/profile"
          className="text-xs font-medium text-primary hover:underline"
        >
          {t("dashboard.profileCard.editLink")}
        </Link>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.profileCard.age")}
            </dt>
            <dd className="mt-1 font-mono text-lg font-semibold">
              {profile?.age ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.profileCard.sex")}
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold capitalize">
              {profile?.sex ? profile.sex.replace(/_/g, " ") : "—"}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboard.profileCard.bmi")}
            </dt>
            <dd className="mt-1 font-mono text-lg font-semibold">
              {value ?? "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("dashboard.profileCard.conditions")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(profile?.conditions ?? []).length === 0 ? (
              <span className="text-sm text-muted-foreground">
                {t("dashboard.profileCard.none")}
              </span>
            ) : (
              profile!.conditions.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium"
                >
                  {c}
                </span>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
