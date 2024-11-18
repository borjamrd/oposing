import { VoiceRecorder } from "@/components/voice-recorder";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl">
        <div className="space-y-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Voice Transcription</h1>
          <p className="text-muted-foreground">
            Click the microphone to start recording your voice
          </p>
          <VoiceRecorder />
        </div>
      </div>
    </main>
  );
}