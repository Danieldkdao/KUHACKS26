"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { SendIcon } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

const isChatIdDataPart = (part: {
  type: string;
  data?: unknown;
}): part is { type: "data-chatId"; data: { chatId: string } } => {
  if (part.type !== "data-chatId" || !part.data) return false;

  return (
    typeof part.data === "object" &&
    "chatId" in part.data &&
    typeof part.data.chatId === "string"
  );
};

const Page = () => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const chatIdRef = useRef<string | null>(null);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/stream-message",
      prepareSendMessagesRequest: ({ body, id, messages }) => {
        return {
          body: {
            id,
            messages,
            ...body,
            chatId: chatIdRef.current,
          },
        };
      },
    }),
  });
  const isLoading = status === "submitted";
  const isStreaming = status === "streaming";
  const errorMessage =
    error?.message || "Something went wrong while getting a response.";

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;

    await sendMessage({
      text: messageInput,
    });
    setMessageInput("");
  };

  const handleInputKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;

    e.preventDefault();
    await handleSendMessage();
  };

  useEffect(() => {
    if (chatId) return;

    for (const message of [...messages].reverse()) {
      for (const part of message.parts) {
        if (isChatIdDataPart(part)) {
          setChatId(part.data.chatId);
          chatIdRef.current = part.data.chatId;
          return;
        }
      }
    }
  }, [chatId, messages]);

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  return (
    <div className="p-10">
      <div className="rounded-xl border shadow-sm overflow-hidden">
        <div className="w-full bg-primary p-5">
          <h1 className="text-2xl font-bold text-white">Chatbot</h1>
          <p className="text-base text-white">
            This is a chatbot for this project.
          </p>
        </div>
        <div className="p-2 md:p-5 bg-card h-120 overflow-y-auto flex flex-col gap-4">
          {messages.map((msg, index) =>
            msg.role === "user" ? (
              <div
                className="flex min-w-0 items-start gap-2 max-w-[80%] self-end"
                key={index}
              >
                <div className="p-2 rounded-md border text-right">
                  <span className="text-base font-medium text-muted-foreground text-right">
                    {msg.parts
                      .filter((part) => part.type === "text")
                      .map((part) => part.text)
                      .join("")}
                  </span>
                </div>
                <Avatar>
                  <AvatarFallback>UU</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div
                className="flex min-w-0 items-start gap-2 max-w-[80%] self-start"
                key={index}
              >
                <Avatar>
                  <AvatarFallback>CT</AvatarFallback>
                </Avatar>
                <div className="min-w-0 max-w-full rounded-md border p-2">
                  <MarkdownRenderer className="min-w-0 max-w-full text-base text-muted-foreground">
                    {msg.parts
                      .filter((part) => part.type === "text")
                      .map((part) => part.text)
                      .join("")}
                  </MarkdownRenderer>
                </div>
              </div>
            ),
          )}
          {isLoading ? (
            <div className="flex items-start gap-2 max-w-[80%] self-start">
              <Avatar>
                <AvatarFallback>CT</AvatarFallback>
              </Avatar>
              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <span className="text-base font-medium text-muted-foreground animate-pulse">
                  AI is answering...
                </span>
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="flex items-start gap-2 max-w-[80%] w-fit self-start">
              <Avatar>
                <AvatarFallback>CT</AvatarFallback>
              </Avatar>
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                <p className="text-sm font-semibold text-destructive">
                  Response failed
                </p>
                <p className="text-sm text-destructive/90">{errorMessage}</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 w-full p-5 border-t">
          <div className="flex w-full flex-col gap-2">
            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                <p className="text-sm text-destructive">
                  The model could not answer right now. Please try again.
                </p>
              </div>
            ) : null}
            <div className="flex items-center gap-2 w-full">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={isLoading || isStreaming}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || isStreaming}
              >
                <LoadingSwap isLoading={isLoading || isStreaming}>
                  <SendIcon />
                </LoadingSwap>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
