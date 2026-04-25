import { NextResponse } from "next/server"
import { getAllPredictions, getPredictionById, savePrediction } from "@/lib/storage"
import type { PredictionResult } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (id) {
    const item = getPredictionById(id)
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(item)
  }

  return NextResponse.json({ predictions: getAllPredictions() })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PredictionResult
    if (!body || !body.disease || !body.risk) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    const saved = savePrediction({
      ...body,
      id: body.id ?? `p_${Date.now().toString(36)}`,
      createdAt: body.createdAt ?? new Date().toISOString(),
    })
    return NextResponse.json(saved)
  } catch (err) {
    console.log("[v0] /api/history error:", (err as Error).message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
