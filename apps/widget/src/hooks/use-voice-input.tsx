import { useCallback, useRef, useState } from "react";

type Status = "idle" | "recording" | "transcribing" | "error";

type UseVoiceInputOptions = {
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
};

export const useVoiceInput = ({
  onTranscript,
  onError,
}: UseVoiceInputOptions) => {
  const [status, setStatus] = useState<Status>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    if (status !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        setStatus("transcribing");

        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const res = await fetch("/api/ai/generate-stt", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error(`STT failed: ${res.status}`);

          const { text } = await res.json();
          onTranscript(text);
        } catch (error) {
          const err =
            error instanceof Error ? error : new Error("Transcription failed");
          onError?.(err);
          setStatus("error");
          return;
        }

        setStatus("idle");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Mic access denied");
      onError?.(err);
      setStatus("error");
    }
  }, [status, onTranscript, onError]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (status === "recording") stop();
    else start();
  }, [status, start, stop]);

  return { status, toggle, start, stop };
};
