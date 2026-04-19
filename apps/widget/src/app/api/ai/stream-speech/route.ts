import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const elevenLabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY!,
});

export const POST = async (req: NextRequest) => {
  const { text, voiceId = "pNInz6obpgDQGcFmaJgB" } = await req.json();

  if (!text.trim()) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const audioStream = await elevenLabs.textToSpeech.stream(voiceId, {
    text,
    modelId: "eleven_turbo_v2_5",
    outputFormat: "mp3_44100_128",
  });

  const reader = (
    audioStream as unknown as ReadableStream<Uint8Array>
  ).getReader();

  const webStream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
};
