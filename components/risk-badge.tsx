import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react"
import type { RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

const config: Record<
  RiskLevel,
  {
    label: string
    className: string
    Icon: React.ComponentType<{ className?: string }>
  }
> = {
  Low: {
    label: "Low Risk",
    className:
      "bg-primary/10 text-primary border-primary/30",
    Icon: CheckCircle2,
  },
  Medium: {
    label: "Medium Risk",
    className:
      "bg-accent text-accent-foreground border-chart-2/30",
    Icon: ShieldAlert,
  },
  High: {
    label: "High Risk",
    className:
      "bg-destructive/10 text-destructive border-destructive/30",
    Icon: AlertTriangle,
  },
}

export function RiskBadge({
  risk,
  size = "md",
  className,
}: {
  risk: RiskLevel
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const { label, className: badgeClass, Icon } = config[risk]

  const sizeClass =
    size === "lg"
      ? "text-sm px-3 py-1.5"
      : size === "sm"
        ? "text-[11px] px-2 py-0.5"
        : "text-xs px-2.5 py-1"

  const iconSize =
    size === "lg" ? "size-4" : size === "sm" ? "size-3" : "size-3.5"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        sizeClass,
        badgeClass,
        className,
      )}
    >
      <Icon className={iconSize} aria-hidden />
      {label}
    </span>
  )
}
