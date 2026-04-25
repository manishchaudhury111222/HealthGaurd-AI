import { NextResponse } from "next/server"
import { dismissAlert, evaluateAlerts, listAlerts } from "@/lib/alerts"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get("refresh") === "1"
    const alerts = refresh ? evaluateAlerts() : listAlerts()
    return NextResponse.json({ alerts })
  } catch (err) {
    console.log("[v0] /api/alerts GET error:", (err as Error).message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }
    const ok = dismissAlert(id)
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.log("[v0] /api/alerts DELETE error:", (err as Error).message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
