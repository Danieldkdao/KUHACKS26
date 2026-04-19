"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardFooter } from "@/components/ui/card";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  BedDouble,
  Loader2Icon,
  MapPinned,
  PlaneTakeoff,
  Volume2Icon,
  Wrench,
} from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { ChatIdViewInput } from "./chat-id-view-input";
import { TTSButton } from "./tts-button";

type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  message: string;
};

type TextPart = {
  type: "text";
  text: string;
};

type ToolInvocationPart = {
  type: "tool-invocation";
  toolInvocation: {
    toolName?: string;
    state?: "call" | "running" | "result";
    args?: Record<string, unknown>;
    result?: unknown;
  };
};

type ChatPart =
  | TextPart
  | ToolInvocationPart
  | { type: string; [key: string]: unknown };

const isTextPart = (part: ChatPart): part is TextPart => part.type === "text";

const isToolInvocationPart = (part: ChatPart): part is ToolInvocationPart =>
  part.type === "tool-invocation";

const getToolMeta = (toolName?: string) => {
  switch (toolName) {
    case "flightSearch":
      return {
        label: "Flight Search",
        Icon: PlaneTakeoff,
      };
    case "hotelSearchTool":
    case "hotelSearch":
      return {
        label: "Hotel Search",
        Icon: BedDouble,
      };
    case "experienceSearch":
      return {
        label: "Experience Search",
        Icon: MapPinned,
      };
    default:
      return {
        label: "Tool Call",
        Icon: Wrench,
      };
  }
};

const getToolStatusMessage = ({
  toolName,
  state,
  args,
}: {
  toolName?: string;
  state?: "call" | "running" | "result";
  args?: Record<string, unknown>;
}) => {
  if (state === "running") {
    return "Working on this request now.";
  }

  if (state === "call") {
    if (toolName === "flightSearch") {
      const from = typeof args?.dep_iata === "string" ? args.dep_iata : null;
      const to = typeof args?.arr_iata === "string" ? args.arr_iata : null;

      if (from || to) {
        return `Looking up flight options${from ? ` from ${from}` : ""}${to ? ` to ${to}` : ""}.`;
      }

      return "Preparing a flight search.";
    }

    if (toolName === "hotelSearchTool" || toolName === "hotelSearch") {
      const query = typeof args?.query === "string" ? args.query : null;
      return query
        ? `Searching hotels in ${query}.`
        : "Preparing a hotel search.";
    }

    if (toolName === "experienceSearch") {
      const location =
        typeof args?.location === "string" ? args.location : null;

      return location
        ? `Searching things to do in ${location}.`
        : "Preparing an experience search.";
    }
  }

  return "Tool call completed.";
};

const getToolResultSummary = (
  toolName?: string,
  result?: unknown,
): { summary: string; details: string[] } => {
  if (!result || typeof result !== "object") {
    return {
      summary: "The tool returned a result.",
      details: [],
    };
  }

  const data = result as Record<string, unknown>;

  if (toolName === "flightSearch") {
    const flights = Array.isArray(data.data) ? data.data : [];

    return {
      summary:
        flights.length > 0
          ? `Found ${flights.length} flight option${flights.length === 1 ? "" : "s"}.`
          : "No flight matches were returned.",
      details: flights.slice(0, 2).map((flight) => {
        const item = flight as Record<string, unknown>;
        const airline =
          typeof item.airline_name === "string"
            ? item.airline_name
            : typeof item.airline === "object" &&
                item.airline &&
                "name" in item.airline &&
                typeof item.airline.name === "string"
              ? item.airline.name
              : "Airline";
        const flightNumber =
          typeof item.flight_number === "string"
            ? item.flight_number
            : typeof item.flight === "object" &&
                item.flight &&
                "iata" in item.flight &&
                typeof item.flight.iata === "string"
              ? item.flight.iata
              : "Unknown flight";
        return `${airline} ${flightNumber}`;
      }),
    };
  }

  if (toolName === "hotelSearchTool" || toolName === "hotelSearch") {
    const hotels = Array.isArray(data.hotels) ? data.hotels : [];
    const location =
      typeof data.location_key === "string" ? data.location_key : null;

    return {
      summary:
        hotels.length > 0
          ? `Found ${hotels.length} hotel option${hotels.length === 1 ? "" : "s"}.`
          : "No hotel matches were returned.",
      details: hotels
        .slice(0, 2)
        .map((hotel) => {
          const item = hotel as Record<string, unknown>;
          const name =
            typeof item.name === "string" ? item.name : "Unnamed hotel";
          const rate =
            typeof item.cheapest_rate === "number"
              ? ` from ${item.cheapest_rate} ${typeof item.currency === "string" ? item.currency : ""}`.trim()
              : "";
          return `${name}${rate ? ` (${rate})` : ""}`;
        })
        .concat(location ? [`Location key: ${location}`] : []),
    };
  }

  if (toolName === "experienceSearch") {
    const experiences = Array.isArray(data.results) ? data.results : [];
    const location =
      typeof data.location === "string" ? data.location : "this location";

    return {
      summary:
        experiences.length > 0
          ? `Found ${experiences.length} experience option${experiences.length === 1 ? "" : "s"} in ${location}.`
          : `No experiences were returned for ${location}.`,
      details: experiences.slice(0, 3).map((experience) => {
        const item = experience as Record<string, unknown>;
        return typeof item.name === "string" ? item.name : "Unnamed experience";
      }),
    };
  }

  return {
    summary: "The tool returned a result.",
    details: [],
  };
};

const ToolInvocationCard = ({
  toolName,
  state,
  args,
  result,
}: {
  toolName?: string;
  state?: "call" | "running" | "result";
  args?: Record<string, unknown>;
  result?: unknown;
}) => {
  const { label, Icon } = getToolMeta(toolName);
  const isRunning = state === "running" || state === "call";
  const { summary, details } =
    state === "result"
      ? getToolResultSummary(toolName, result)
      : {
          summary: getToolStatusMessage({ toolName, state, args }),
          details: [],
        };

  return (
    <div className="my-2 rounded-xl border border-border/70 bg-muted/40 p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {isRunning ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
              {state ?? "pending"}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {summary}
          </p>
          {details.length ? (
            <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
              {details.map((detail, index) => (
                <li key={index} className="truncate">
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const ChatIdView = ({
  initialChatId,
  name,
  messagesOg,
}: {
  initialChatId: string;
  name: string;
  messagesOg: ChatMessageRecord[];
}) => {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    messages: messagesOg.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: [{ type: "text", text: msg.message }],
    })),
    transport: new DefaultChatTransport({
      api: "/api/ai/stream-message",
      prepareSendMessagesRequest: ({ body, id, messages }) => {
        return {
          body: {
            id,
            messages,
            ...body,
            chatId: initialChatId,
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
    if (!messageInput.trim() || isLoading || isStreaming) return;

    await sendMessage({
      text: messageInput,
    });
    setMessageInput("");
  };

  const handleInputKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;

    e.preventDefault();
    await handleSendMessage();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, isStreaming, error]);

  return (
    <>
      <CardContent className="px-0 pb-0">
        <div className="flex max-h-[calc(100svh-15rem)] min-h-128 flex-col gap-4 overflow-y-auto px-6 pb-6">
          {messages.length ? (
            messages.map((msg, index) =>
              msg.role === "user" ? (
                <div
                  className="flex min-w-0 max-w-[80%] items-start gap-2 self-end"
                  key={index}
                >
                  <div className="rounded-2xl border border-primary/15 bg-primary px-4 py-3 text-primary-foreground shadow-xs">
                    <span className="whitespace-pre-wrap text-base leading-7">
                      {(msg.parts as ChatPart[])
                        .filter(isTextPart)
                        .map((part) => part.text)
                        .join("")}
                    </span>
                  </div>

                  <Avatar>
                    <AvatarFallback>
                      {name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0].toUpperCase())
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div
                  className="flex min-w-0 max-w-[80%] items-start gap-2 self-start"
                  key={index}
                >
                  <Avatar>
                    <AvatarImage src="/bot.png" alt="TravelBot image" />
                    <AvatarFallback>TB</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="min-w-0 max-w-full rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-xs">
                      {(msg.parts as ChatPart[]).map((part, partIndex) => {
                        if (isTextPart(part)) {
                          return (
                            <MarkdownRenderer
                              className="min-w-0 max-w-full text-base text-card-foreground"
                              key={partIndex}
                            >
                              {part.text}
                            </MarkdownRenderer>
                          );
                        }

                        if (isToolInvocationPart(part)) {
                          return (
                            <ToolInvocationCard
                              key={partIndex}
                              toolName={part.toolInvocation.toolName}
                              state={part.toolInvocation.state}
                              args={part.toolInvocation.args}
                              result={part.toolInvocation.result}
                            />
                          );
                        }

                        return null;
                      })}
                    </div>
                    <TTSButton
                      variant="ghost"
                      size="icon"
                      additionalDisabled={isLoading || isStreaming}
                      text={msg.parts
                        .filter((part) => part.type === "text")
                        .map((part) => part.text)
                        .join("")}
                    >
                      <Volume2Icon />
                    </TTSButton>
                  </div>
                </div>
              ),
            )
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              This chat does not have any stored messages yet.
            </div>
          )}

          {isLoading ? (
            <div className="flex max-w-[80%] items-start gap-2 self-start">
              <Avatar>
                <AvatarImage src="/bot.png" alt="TravelBot image" />
                <AvatarFallback>TB</AvatarFallback>
              </Avatar>
              <div className="rounded-2xl border bg-muted/40 px-4 py-3">
                <span className="animate-pulse text-base font-medium text-muted-foreground">
                  AI is answering...
                </span>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="flex w-fit max-w-[80%] items-start gap-2 self-start">
              <Avatar>
                <AvatarImage src="/bot.png" alt="TravelBot image" />
                <AvatarFallback>TB</AvatarFallback>
              </Avatar>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm font-semibold text-destructive">
                  Response failed
                </p>
                <p className="text-sm text-destructive/90">{errorMessage}</p>
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </CardContent>

      <CardFooter className="border-t px-6 py-5">
        <ChatIdViewInput
          error={error}
          messageInput={messageInput}
          setMessageInput={setMessageInput}
          handleInputKeyDown={handleInputKeyDown}
          isLoading={isLoading}
          isStreaming={isStreaming}
          handleSendMessage={handleSendMessage}
        />
      </CardFooter>
    </>
  );
};
