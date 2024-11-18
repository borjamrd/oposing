import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { muletillas } from "@/lib/muletillas";
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);

async function detectRedundancy(text: string): Promise<string> {
  const response = await hf.summarization({
    model: "facebook/bart-large-cnn",
    inputs: text,
    parameters: {},
  });
  return response.summary_text;
}

async function correctGrammar(text: string): Promise<string> {
  const response = await hf.textGeneration({
    model: "t5-base",
    inputs: `correct grammar: ${text}`,
    parameters: {
      max_new_tokens: 512,
    },
  });
  return response.generated_text || text;
}

function detectMuletillas(text: string, muletillas: string[]): string[] {
  const detected: string[] = [];
  muletillas.forEach((muletilla) => {
    const regex = new RegExp(`\\b${muletilla}\\b`, "gi");
    if (regex.test(text)) {
      detected.push(muletilla);
    }
  });
  return detected;
}

async function evaluateCoherenceBySegments(text: string): Promise<string[]> {
  const segments = text.split(/\n|\r/).filter(Boolean); // Divide en segmentos (líneas/párrafos)
  const relations: string[] = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const response = await hf.zeroShotClassification({
      inputs: `${segments[i]}. Does this logically connect to: ${
        segments[i + 1]
      }?`,
      parameters: {
        candidate_labels: ["yes", "no"],
      },
      model: "facebook/bart-large-mnli",
    });
    relations.push(
      `${segments[i]} -> ${segments[i + 1]}: ${response[0].labels}`
    );
  }

  return relations;
}

function splitTextToSegments(text: string): string[] {
  return text
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

async function evaluateDiscourseStructureBySegments(
  text: string
): Promise<string[]> {
  const segments = splitTextToSegments(text);
  const results: string[] = [];

  for (const segment of segments) {
    const response = await hf.zeroShotClassification({
      inputs: segment,
      parameters: {
        candidate_labels: ["introduction", "development", "conclusion"],
      },
      model: "facebook/bart-large-mnli",
    });

    results.push(`${segment}: ${response[0].labels[0]} | ${response[0].scores[0]}`);
  }

  return results;
}

async function verifyWithSearch(statement: string): Promise<string> {
    const searchResults = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(statement)}&format=json`);
    const data = await searchResults.json();
  
    // Procesa los resultados para determinar si el contenido es verificable
    const facts = data.RelatedTopics.map((topic: any) => topic.Text);
  
    const response = await hf.zeroShotClassification({
      inputs: `${statement} Is this fact consistent with: ${facts.join(". ")}`,
      parameters: {
        candidate_labels: ["true", "false", "uncertain"],
      },
      model: "facebook/bart-large-mnli",
    });
  
    return response.map((result: any) => `${result.labels}: ${result.scores}`)[0];
  }
  

export async function POST(request: NextRequest) {
  try {
    const data: string = await request.json();

    // const summarizedText = await detectRedundancy(data);
    // console.log('Texto resumido (redundancia detectada):', summarizedText);

    // const correctedText = await correctGrammar(data);
    // console.log('Texto corregido:', correctedText);

    const detectedMuletillas = detectMuletillas(data, muletillas);
    console.log("Muletillas: ", detectedMuletillas);

    const coherenceResults = await evaluateCoherenceBySegments(data);
    console.log("Resultados de coherencia:", coherenceResults);

    const discourseStructureResults =
      await evaluateDiscourseStructureBySegments(data);
    console.log(
      "Resultados de estructura de discusión:",
      discourseStructureResults
    );

    // const searchResults = await verifyWithSearch(data);
    // console.log("Resultados de verificación:", searchResults);

    // const API_URL =
    //   "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

    // if (!data.audio) {
    //   return NextResponse.json(
    //     { error: "No audio data provided" },
    //     { status: 400 }
    //   );
    // }

    // const response = await fetch(API_URL, {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: data,
    // })

    return NextResponse.json({ text: data }, { status: 200 });
  } catch (error) {
    console.error("Error detallado:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Revision failed",
      },
      { status: 500 }
    );
  }
}
