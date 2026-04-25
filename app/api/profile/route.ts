import { NextResponse } from "next/server"
import { getProfile, saveProfile, type ProfileUpdate } from "@/lib/profile"

export async function GET() {
  try {
    return NextResponse.json(getProfile())
  } catch (err) {
    console.log("[v0] /api/profile GET error:", (err as Error).message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as ProfileUpdate
    const updated = saveProfile(body)
    return NextResponse.json(updated)
  } catch (err) {
    console.log("[v0] /api/profile PUT error:", (err as Error).message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
