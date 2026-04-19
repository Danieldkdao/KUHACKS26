import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createMistral } from "@ai-sdk/mistral";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});
