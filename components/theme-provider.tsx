"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"

type Attribute = "class" | `data-${string}`

export type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  enableSystem?: boolean
  attribute?: Attribute
  storageKey?: string
  disableTransitionOnChange?: boolean
}

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function setAttribute(attribute: Attribute, theme: "light" | "dark") {
  const root = document.documentElement
  if (attribute === "class") {
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    return
  }
  root.setAttribute(attribute, theme)
}

function withTransitionsDisabled(run: () => void) {
  const style = document.createElement("style")
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important}",
    ),
  )
  document.head.appendChild(style)
  run()
  // Force reflow
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  window.getComputedStyle(document.body)
  requestAnimationFrame(() => {
    style.remove()
  })
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  attribute = "class",
  storageKey = "theme",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    "light",
  )

  const applyTheme = React.useCallback(
    (nextTheme: Theme) => {
      const effectiveTheme =
        nextTheme === "system" && enableSystem ? getSystemTheme() : nextTheme
      const run = () => {
        setAttribute(attribute, effectiveTheme as "light" | "dark")
        setResolvedTheme(effectiveTheme as "light" | "dark")
      }

      if (disableTransitionOnChange) {
        withTransitionsDisabled(run)
      } else {
        run()
      }
    },
    [attribute, disableTransitionOnChange, enableSystem],
  )

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey) as Theme | null
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemeState(saved)
        applyTheme(saved)
        return
      }
    } catch {
      // Ignore storage errors
    }
    applyTheme(defaultTheme)
  }, [applyTheme, defaultTheme, storageKey])

  React.useEffect(() => {
    if (!enableSystem || theme !== "system") return

    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [applyTheme, enableSystem, theme])

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme)
      try {
        localStorage.setItem(storageKey, nextTheme)
      } catch {
        // Ignore storage errors
      }
      applyTheme(nextTheme)
    },
    [applyTheme, storageKey],
  )

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
