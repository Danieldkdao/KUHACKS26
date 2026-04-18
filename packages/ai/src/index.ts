import { ModelMessage, streamText } from "ai";
import { google } from "./models";

export const streamAIText = ({
  messages,
  system,
}: {
  messages: ModelMessage[];
  system: string;
}) => {
  return streamText({
    model: google("gemini-3.1-flash-lite-preview"),
    messages,
    system,
  });
};
