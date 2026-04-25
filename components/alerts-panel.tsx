"use client"

import * as React from "react"
import useSWR from "swr"
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert, X } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { SmartAlert } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function severityTone(severity: SmartAlert["severity"]) {
  if (severity === "High") {
    return {
      wrap: "border-destructive/40 bg-destructive/5",
      icon: "bg-destructive/15 text-destructive",
      Icon: ShieldAlert,
    }
  }
  if (severity === "Medium") {
    return {
      wrap: "border-amber-500/40 bg-amber-500/5",
      icon: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      Icon: AlertTriangle,
    }
  }
  return {
    wrap: "border-emerald-500/40 bg-emerald-500/5",
    icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    Icon: Bell,
  }
}

export function AlertsPanel() {
  const { t } = useT()
  const { data, mutate, isLoading } = useSWR<{ alerts: SmartAlert[] }>(
    "/api/alerts?refresh=1",
    fetcher,
  )

  const alerts = data?.alerts ?? []

  async function handleDismiss(id: string) {
    // optimistic
    mutate(
      { alerts: alerts.filter((a) => a.id !== id) },
      { revalidate: false },
    )
    try {
      const res = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Dismiss failed")
    } catch (err) {
      toast.error((err as Error).message)
      mutate()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4 text-primary" />
          {t("dashboard.alerts")}
          {alerts.length > 0 && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {t("dashboard.alerts.empty")}
          </div>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => {
              const tone = severityTone(a.severity)
              const Icon = tone.Icon
              return (
                <li
                  key={a.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    tone.wrap,
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md",
                      tone.icon,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {a.message}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={t("cta.dismiss")}
                    onClick={() => handleDismiss(a.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
