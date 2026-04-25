"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty"
import { ResultCard } from "@/components/result-card"
import type { PredictionResult } from "@/lib/types"

function ResultsContent() {
  const params = useSearchParams()
  const id = params.get("id")
  const [result, setResult] = React.useState<PredictionResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    // Try session cache first for instant display
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`prediction:${id}`)
      if (cached) {
        try {
          setResult(JSON.parse(cached))
          setLoading(false)
          return
        } catch {
          // ignore parse errors
        }
      }
    }

    fetch(`/api/history?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Result not found")
        return r.json()
      })
      .then((data: PredictionResult) => setResult(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (!id) {
    return (
      <Empty className="mx-auto max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles />
          </EmptyMedia>
          <EmptyTitle>No result selected</EmptyTitle>
          <EmptyDescription>
            Run a diagnosis to see your results here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/symptoms">Start Diagnosis</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Loading your result…</span>
      </div>
    )
  }

  if (error || !result) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="font-semibold">Couldn&apos;t load this result</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "The prediction could not be found."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/symptoms">New diagnosis</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Diagnosis Result
          </p>
          <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Your AI Health Assessment
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/symptoms">
              <RefreshCw className="size-4" />
              New Diagnosis
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <ResultCard result={result} />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <React.Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted-foreground">
            <Spinner />
            <span>Loading…</span>
          </div>
        }
      >
        <ResultsContent />
      </React.Suspense>
    </div>
  )
}
