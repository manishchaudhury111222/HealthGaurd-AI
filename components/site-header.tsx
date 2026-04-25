"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n"

export function SiteHeader() {
  const pathname = usePathname()
  const { t } = useT()

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/symptoms", label: t("nav.diagnose") },
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/profile", label: t("nav.profile") },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="size-5" aria-hidden />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">
              HealthGuard
              <span className="ml-1 text-primary">AI</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Early Disease Detection
            </span>
          </div>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/symptoms">
              <Activity className="size-4" />
              {t("cta.startDiagnosis")}
            </Link>
          </Button>
          <LanguageToggle />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
