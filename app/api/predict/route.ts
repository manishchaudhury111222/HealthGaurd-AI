import { NextResponse } from "next/server"
import { predict } from "@/lib/prediction"
import { savePrediction } from "@/lib/storage"
import { evaluateAlerts } from "@/lib/alerts"
import type { PredictionInput, PredictionResult } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PredictionInput>

    if (
      typeof body.age !== "number" ||
      !body.gender ||
      !Array.isArray(body.symptoms) ||
      body.symptoms.length === 0 ||
      typeof body.duration !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid input. Please provide age, gender, symptoms and duration." },
        { status: 400 },
      )
    }

    const input: PredictionInput = {
      age: body.age,
      gender: body.gender,
      symptoms: body.symptoms,
      duration: body.duration,
    }

    // Simulate model latency
    await new Promise((r) => setTimeout(r, 600))

    const result = predict(input)

    const full: PredictionResult = {
      id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...result,
    }

    savePrediction(full)
    // Re-evaluate smart alerts after every new prediction.
    try {
      evaluateAlerts()
    } catch (e) {
      console.log("[v0] alerts eval failed:", (e as Error).message)
    }

    return NextResponse.json(full)
  } catch (err) {
    console.log("[v0] /api/predict error:", (err as Error).message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
