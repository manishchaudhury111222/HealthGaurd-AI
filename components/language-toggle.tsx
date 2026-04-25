"use client"

import * as React from "react"
import { Languages } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOCALES, useT, type Locale } from "@/lib/i18n"

export function LanguageToggle() {
  const { locale, setLocale, t } = useT()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 px-2.5"
          aria-label={t("lang.toggle")}
        >
          <Languages className="size-4" aria-hidden />
          <span className="font-mono text-xs uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLocale(l.code as Locale)}
            className="flex items-center justify-between gap-6"
          >
            <span>{l.native}</span>
            {locale === l.code && (
              <span className="text-xs text-primary">●</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
