import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(key);
}

function normalize(raw: string): string {
  const m = raw.toUpperCase().match(/[ABCD?]/);
  return m ? m[0] : "?";
}

const GEN_CONFIG = {
  temperature: 0,
  maxOutputTokens: 64,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thinkingConfig: { thinkingBudget: 0 } as any,
};

export async function answerFromImage(imageBase64: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      "You are answering multiple-choice questions. Analyze the screenshot. Return ONLY one of the following: A B C D. If the answer cannot be determined, return ?. Do not provide explanations. Do not provide reasoning. Do not provide punctuation. Do not provide extra words.",
    generationConfig: GEN_CONFIG,
  });

  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
  ]);
  const text = result.response.text();
  return normalize(text);
}

export async function answerFromText(text: string): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction:
      "You are answering a multiple-choice question. Return ONLY: A B C D. No explanation.",
    generationConfig: GEN_CONFIG,
  });

  const result = await model.generateContent(text);
  const raw = result.response.text();
  return normalize(raw);
}
