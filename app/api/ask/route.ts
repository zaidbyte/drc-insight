import { NextResponse } from "next/server";
import { answerFromText } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text) return NextResponse.json({ answer: "?" });
    const answer = await answerFromText(text);
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("[ask]", err);
    return NextResponse.json({ answer: "?" }, { status: 200 });
  }
}
