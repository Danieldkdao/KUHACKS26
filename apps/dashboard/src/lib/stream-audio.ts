type StreamAudioCallbacks = {
  onPlaying?: () => void;
  onEnded?: () => void;
  onError?: () => void;
};

type PlaybackCleanup = () => void;

let activePlaybackCleanup: PlaybackCleanup | null = null;

const clearActivePlaybackCleanup = (cleanup: PlaybackCleanup) => {
  if (activePlaybackCleanup === cleanup) {
    activePlaybackCleanup = null;
  }
};

const stopActivePlayback = () => {
  if (!activePlaybackCleanup) return;

  const cleanup = activePlaybackCleanup;
  activePlaybackCleanup = null;
  cleanup();
};

export const streamAndPlayAudio = async (
  text: string,
  callbacks: StreamAudioCallbacks = {},
): Promise<HTMLAudioElement> => {
  const { onPlaying, onEnded, onError } = callbacks;

  stopActivePlayback();

  const abortController = new AbortController();
  let audio: HTMLAudioElement | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let objectUrl: string | null = null;
  let hasCleanedUp = false;

  const cleanupPlayback = () => {
    if (hasCleanedUp) return;
    hasCleanedUp = true;

    abortController.abort();

    if (reader) {
      void reader.cancel().catch(() => {});
    }

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }

    clearActivePlaybackCleanup(cleanupPlayback);
  };

  activePlaybackCleanup = cleanupPlayback;

  let response: Response;

  try {
    response = await fetch("/api/ai/stream-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: abortController.signal,
    });
  } catch (error) {
    cleanupPlayback();
    throw error;
  }

  if (!response.ok || !response.body) {
    cleanupPlayback();
    throw new Error(`TTS request failed: ${response.status}`);
  }

  if (!MediaSource.isTypeSupported("audio/mpeg")) {
    const blob = await response.blob();
    objectUrl = URL.createObjectURL(blob);
    audio = new Audio(objectUrl);

    if (onPlaying) audio.addEventListener("playing", onPlaying);
    if (onEnded) audio.addEventListener("ended", onEnded);
    if (onError) audio.addEventListener("error", onError);

    audio.addEventListener("ended", cleanupPlayback, { once: true });
    audio.addEventListener("error", cleanupPlayback, { once: true });

    void audio.play().catch((error) => {
      console.error("Audio playback failed:", error);
      onError?.();
      cleanupPlayback();
    });

    return audio;
  }

  const mediaSource = new MediaSource();
  audio = new Audio();

  if (onPlaying) audio.addEventListener("playing", onPlaying);
  if (onEnded) audio.addEventListener("ended", onEnded);
  if (onError) audio.addEventListener("error", onError);

  audio.addEventListener("ended", cleanupPlayback, { once: true });
  audio.addEventListener("error", cleanupPlayback, { once: true });

  objectUrl = URL.createObjectURL(mediaSource);
  audio.src = objectUrl;

  reader = response.body.getReader();

  mediaSource.addEventListener("sourceopen", async () => {
    let sourceBuffer: SourceBuffer;

    try {
      sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
    } catch (error) {
      console.error("Failed to add source buffer:", error);
      onError?.();
      cleanupPlayback();
      return;
    }

    const queue: Uint8Array[] = [];
    let isAppending = false;
    let streamDone = false;

    const appendNext = () => {
      if (isAppending || sourceBuffer.updating) return;
      if (queue.length === 0) {
        if (streamDone && mediaSource.readyState === "open") {
          mediaSource.endOfStream();
        }
        return;
      }
      isAppending = true;
      const chunk = queue.shift()!;
      const arrayBuffer = new Uint8Array(chunk).buffer as ArrayBuffer;
      sourceBuffer.appendBuffer(arrayBuffer);
    };

    sourceBuffer.addEventListener("updateend", () => {
      isAppending = false;
      appendNext();
    });

    sourceBuffer.addEventListener("error", (error) => {
      console.error("SourceBuffer error:", error);
    });

    audio.addEventListener(
      "canplay",
      () => {
        void audio.play().catch((error) => {
          console.error("Audio playback failed:", error);
          onError?.();
          cleanupPlayback();
        });
      },
      { once: true },
    );

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          streamDone = true;
          appendNext();
          break;
        }
        queue.push(value);
        appendNext();
      }
    } catch (error) {
      console.error("Stream read error:", error);
      onError?.();
      cleanupPlayback();
    }
  });

  return audio;
};
