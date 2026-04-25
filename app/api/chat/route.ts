import { NextResponse } from "next/server"
import {
  processUserMessage,
  type ChatbotState,
} from "@/lib/chatbot"

/**
 * MediBot endpoint.
 *
 * The conversation is stateless on the server: the client passes the current
 * state and the latest user message, and we return the next state plus the
 * bot's reply messages.
 *
 * To upgrade to a real LLM later, swap `processUserMessage` (or its
 * `runMockDiagnosis` / `answerFollowUp` internals) for an OpenAI/AI SDK call.
 */

type RequestBody = {
  message: string
  state: ChatbotState
}

export async function POST(request: Request) {
  try {
    const { message, state } = (await request.json()) as RequestBody
    if (typeof message !== "string" || !state || typeof state.step !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Simulate "thinking" delay so the typing indicator feels natural.
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 500))

    const result = processUserMessage(message, state)

    return NextResponse.json({
      state: result.state,
      replies: result.replies,
    })
  } catch (err) {
    console.log("[v0] /api/chat error:", (err as Error).message)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
