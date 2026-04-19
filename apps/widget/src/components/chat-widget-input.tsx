"use client";

import { Dispatch, KeyboardEvent, SetStateAction, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { LoadingSwap } from "./ui/loading-swap";
import { MicIcon, MicOffIcon, SendIcon } from "lucide-react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";

type ChatWidgetInputProps = {
  error: Error | undefined;
  messageInput: string;
  setMessageInput: Dispatch<SetStateAction<string>>;
  handleInputKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  isStreaming: boolean;
  handleSendMessage: () => Promise<void>;
};

export const ChatWidgetInput = ({
  error,
  messageInput,
  setMessageInput,
  handleInputKeyDown,
  isLoading,
  isStreaming,
  handleSendMessage,
}: ChatWidgetInputProps) => {
  const [audioError, setAudioError] = useState<string | null>();
  const { status, toggle } = useVoiceInput({
    onTranscript: (text) => {
      setMessageInput((prev) => (prev.trim() ? `${prev} ${text}` : text));
    },
    onError: (error) => setAudioError(error.message),
  });

  const isRecording = status === "recording";
  const isTranscribing = status === "transcribing";
  const hasInput = !!messageInput.trim();

  return (
    <div className="flex items-center gap-2 w-full p-5 border-t">
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
            className="border-none max-h-32 focus-visible:ring-0 focus-visible:border-none focus-visible:outline-0 ring-0 outline-0 shadow-none resize-none"
          />
          <Button
            onClick={hasInput ? handleSendMessage : toggle}
            disabled={isLoading || isStreaming || isTranscribing}
            className={cn(
              "self-end",
              isRecording && "text-destructive animate-pulse",
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
