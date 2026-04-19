import { streamAndPlayAudio } from "@/lib/stream-audio";
import { StopCircleIcon } from "lucide-react";
import { ComponentProps, forwardRef, ReactNode, useRef, useState } from "react";
import { Button } from "./ui/button";

export const TTSButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode;
    text: string;
    additionalDisabled: boolean;
  } & Partial<ComponentProps<typeof Button>>
>(({ children, text, additionalDisabled, ...props }, ref) => {
  const [status, setStatus] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    console.log("it ran!!!!!");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setStatus("loading");

    try {
      const audio = await streamAndPlayAudio(text, {
        onPlaying: () => setStatus("playing"),
        onEnded: () => setStatus("idle"),
        onError: () => setStatus("idle"),
      });
      audioRef.current = audio;
    } catch (error) {
      console.error(error);
      setStatus("idle");
    }
  };

  const handleStop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setStatus("idle");
  };

  return (
    <Button
      ref={ref}
      onClick={status === "playing" ? handleStop : handleSpeak}
      disabled={status === "loading" || additionalDisabled}
      {...props}
    >
      {status === "playing" ? <StopCircleIcon /> : children}
    </Button>
  );
});

TTSButton.displayName = "TTSButton";
