"use client";

import { useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";
import { Dispatch, KeyboardEvent, SetStateAction, useState } from "react";
import { MicIcon, MicOffIcon, SendIcon } from "lucide-react";
import { Button } from "./ui/button";
import { LoadingSwap } from "./ui/loading-swap";
import { Textarea } from "./ui/textarea";

type ChatIdViewInputProps = {
  error: Error | undefined;
  messageInput: string;
  setMessageInput: Dispatch<SetStateAction<string>>;
  handleInputKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  isStreaming: boolean;
  handleSendMessage: () => Promise<void>;
};

export const ChatIdViewInput = ({
  error,
  messageInput,
  setMessageInput,
  handleInputKeyDown,
  isLoading,
  isStreaming,
  handleSendMessage,
}: ChatIdViewInputProps) => {
  const [audioError, setAudioError] = useState<string | null>(null);
  const { status, toggle } = useVoiceInput({
    onTranscript: (text) => {
      setAudioError(null);
      setMessageInput((prev) => (prev.trim() ? `${prev} ${text}` : text));
    },
    onError: (voiceError) => setAudioError(voiceError.message),
  });

  const isRecording = status === "recording";
  const isTranscribing = status === "transcribing";
  const hasInput = !!messageInput.trim();

  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex w-full flex-col gap-2">
        {error || audioError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-sm text-destructive">
              {audioError ??
                "The model could not answer right now. Please try again."}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isLoading || isStreaming}
            placeholder="Continue the conversation..."
            className="max-h-32 resize-none border-none shadow-none ring-0 outline-0 focus-visible:border-none focus-visible:ring-0"
          />
          <Button
            onClick={hasInput ? handleSendMessage : toggle}
            disabled={isLoading || isStreaming || isTranscribing}
            className={cn(
              "self-end",
              isRecording && "animate-pulse text-destructive",
            )}
            variant={isRecording ? "ghost" : "default"}
          >
            <LoadingSwap isLoading={isLoading || isStreaming || isTranscribing}>
              {hasInput ? (
                <SendIcon />
              ) : isRecording ? (
                <MicOffIcon />
              ) : (
                <MicIcon />
              )}
            </LoadingSwap>
          </Button>
        </div>
      </div>
    </div>
  );
};
