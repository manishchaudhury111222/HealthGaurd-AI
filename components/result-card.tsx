"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  FileText,
  Info,
  Lightbulb,
  Stethoscope,
  User,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { RiskBadge } from "@/components/risk-badge"
import type { PredictionResult, RiskLevel } from "@/lib/types"

function riskColor(level: RiskLevel): string {
  if (level === "Low") return "var(--chart-1)"
  if (level === "Medium") return "var(--chart-3)"
  return "var(--chart-4)"
}

export function ResultCard({ result }: { result: PredictionResult }) {
  const chartData = [
    { label: "Low", value: result.risk === "Low" ? result.confidence : 25 },
    {
      label: "Medium",
      value: result.risk === "Medium" ? result.confidence : 25,
    },
    { label: "High", value: result.risk === "High" ? result.confidence : 25 },
  ]

  const formattedDate = new Date(result.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Main result */}
      <Card className="overflow-hidden">
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Predicted Condition
              </p>
              <CardTitle className="mt-1 text-2xl sm:text-3xl">
                {result.disease}
              </CardTitle>
            </div>
            <RiskBadge risk={result.risk} size="lg" />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {formattedDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {result.input.age} · {result.input.gender}
            </span>
            <span className="inline-flex items-center gap-1">
              <Activity className="size-3.5" />
              {result.input.duration} day
              {result.input.duration === 1 ? "" : "s"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Model Confidence</span>
              <span className="font-mono text-primary">
                {result.confidence}%
              </span>
            </div>
            <Progress value={result.confidence} className="h-2" />
          </div>

          <Separator />

          {/* Risk visualization chart */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-primary" />
              Risk Distribution
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
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
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((d) => (
                      <Cell
                        key={d.label}
                        fill={riskColor(d.label as RiskLevel)}
                        fillOpacity={d.label === result.risk ? 1 : 0.25}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Separator />

          {/* Explanation */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Info className="size-4 text-primary" />
              Explanation
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.explanation}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar: suggestions + reported */}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="size-4 text-primary" />
              Symptoms Reported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {result.input.symptoms.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent bg-accent/40">
          <CardContent className="pt-6">
            <p className="text-xs leading-relaxed text-accent-foreground">
              <strong className="font-semibold">Medical Disclaimer:</strong>{" "}
              HealthGuard AI is for informational purposes only and is not a
              substitute for professional medical advice, diagnosis, or
              treatment. Always consult a qualified healthcare provider.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
