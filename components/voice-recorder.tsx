"use client";

import { useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TranscriptionResult } from "@/components/transcription-result";

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      setTranscription(data.text);
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscription("Error during transcription. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className="h-16 w-16 rounded-full"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
        >
          {isRecording ? (
            <Square className="h-6 w-6" />
          ) : isAnalyzing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Mic className="h-6 w-6" />
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
        <TranscriptionResult text={transcription} />
      )}
    </div>
  );
}