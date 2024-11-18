import { readFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const API_URL =
      "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

    if (!data.audio) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    // Decodificar el base64 a buffer
    const audioBuffer = Buffer.from(data.audio.split(",")[1], "base64");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: readFileSync('./sample1.flac'),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Error detallado:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 }
    );
  }
}
