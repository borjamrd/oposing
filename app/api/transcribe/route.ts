import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${process.env.HUGGINGFACE_MODEL_ID}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        method: "POST",
        body: audioFile,
      }
    );

    if (!response.ok) {
      throw new Error("Hugging Face API request failed");
    }

    const result = await response.json();
    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}