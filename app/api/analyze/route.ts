import { NextResponse } from "next/server";
import { answerFromImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { image } = (await req.json()) as { image?: string };
    if (!image) return NextResponse.json({ answer: "?" });
    const answer = await answerFromImage(image);
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ answer: "?" }, { status: 200 });
  }
}
