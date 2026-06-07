import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

// Returns "" when nothing actionable is on screen (caller should not update title)
function normalize(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Prefer a single MCQ letter
  const letter = trimmed.toUpperCase().match(/^[ABCD]$/);
  if (letter) return letter[0];

  // First character is a letter option — strip punctuation/noise
  const leading = trimmed.toUpperCase().match(/^([ABCD])[^A-Z]/);
  if (leading) return leading[1];

  // Brief free-text answer: cap to 30 chars for the tab title
  return trimmed.slice(0, 30);
}

const GEN_CONFIG = {
  temperature: 0,
  maxOutputTokens: 64,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thinkingConfig: { thinkingBudget: 0 } as any,
};

const IMAGE_SYSTEM = `You analyze screenshots for questions.

If you see a multiple-choice question with options A B C D:
  Return ONLY the letter: A, B, C, or D

If you see a question WITHOUT multiple-choice options:
  Return a brief answer of 5 words or fewer. No punctuation.

If there is NO question visible:
  Return nothing. Empty string. Absolutely nothing.

No explanations. No extra words. No punctuation.`;

const TEXT_SYSTEM = `You answer questions.

If multiple-choice (options A B C D present): return ONLY the letter A, B, C, or D.
If open-ended: return a brief answer of 5 words or fewer. No punctuation.
No explanations. No extra words.`;

export async function answerFromImage(imageBase64: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: IMAGE_SYSTEM,
    generationConfig: GEN_CONFIG,
  });

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
  ]);
  return normalize(result.response.text());
}

export async function answerFromText(text: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: TEXT_SYSTEM,
    generationConfig: GEN_CONFIG,
  });

  const result = await model.generateContent(text);
  return normalize(result.response.text());
}
