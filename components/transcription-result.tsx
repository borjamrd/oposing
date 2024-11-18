"use client";

import Typewriter from "typewriter-effect";

interface TranscriptionResultProps {
  text: string;
}

export function TranscriptionResult({ text }: TranscriptionResultProps) {
  return (
    <div className="rounded-lg bg-muted p-6 text-left">
      <Typewriter
        options={{
          strings: text,
          autoStart: true,
          delay: 5,
          
        }}
      />
    </div>
  );
}