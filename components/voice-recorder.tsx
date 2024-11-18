"use client";

import { useRef, useState } from "react";
import { Mic, Square, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TranscriptionResult } from "@/components/transcription-result";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [revision, setRevision] = useState("");

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (e) => {
        setAudioChunks((chunks) => [...chunks, e.data]);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        // const flacBlob = await convertToFlac(audioBlob);
        await handleTranscription(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setIsAnalyzing(true);
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          }
        };
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64,
        }),
      });

      if (!response.ok) throw new Error("Transcription failed");
      const data = await response.json();
      setTranscription(data.text);
      handleRevision(data.text);
    } catch (error) {
      setTranscription("Error during transcription. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRevision = async (transcription: string) => {
    setReviewing(true);
    setReviewed(false);
    try {
      const response = await fetch("/api/revision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transcription),
      });

      if (!response.ok) throw new Error("Revision failed");
      const data = await response.json();
      setRevision(data.text);
    } catch (error) {
      setRevision("Error during revision. Please try again.");
    } finally {
      setReviewed(true);
      setReviewing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className="h-16 w-16 rounded-full p-0"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
        >
          {isRecording ? (
            <Square size={24} className="h-6 w-6" />
          ) : isAnalyzing ? (
            <Loader2 size={24} className="h-24 w-24 animate-spin" />
          ) : (
            <Mic size={24} color="blue" />
          )}
        </Button>
      </div>

      {isRecording && (
        <div className="flex items-center justify-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {isAnalyzing && (
        <div className="text-sm font-medium">Analyzing your voice...</div>
      )}

      {transcription && !isRecording && !isAnalyzing && (
        <div className="flex flex-col gap-2">
          <Accordion defaultValue="revision" type="single" collapsible>
            <AccordionItem value="transcription">
              <AccordionTrigger className="text-lg font-semibold">
                Transcription
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-lg bg-muted p-6 text-left">
                  <p>{transcription}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
          </Accordion>
        </div>
      )}
      {reviewed && !isRecording && !isAnalyzing && ( <TranscriptionResult text={revision} />)}
    </div>
  );
}
