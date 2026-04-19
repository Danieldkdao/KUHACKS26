import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY!,
});

export const POST = async (req: NextRequest) => {
  const formData = await req.formData();
  const audio = formData.get("audio") as Blob | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio provided." }, { status: 400 });
  }

  const transcription = await elevenlabs.speechToText.convert({
    file: audio,
    modelId: "scribe_v2",
  });

  return NextResponse.json({ text: transcription.text });
};
