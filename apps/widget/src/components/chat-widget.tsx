"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  BedDouble,
  BotIcon,
  Loader2Icon,
  MapPinned,
  PlaneTakeoff,
  SendIcon,
  Wrench,
} from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";

type ChatWidgetProps = {
  widgetId?: string | null;
  theme?: string | null;
};

const suggestedPrompts = [
  "I missed my flight. What now?",
  "Can you prepare an approval request?",
  "What company policies apply?",
  "Any local tips?",
];

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

const isToolInvocationPart = (
  part: unknown,
): part is {
  type: "tool-invocation";
  toolInvocation: {
    toolName?: string;
    state?: "call" | "running" | "result";
    args?: Record<string, unknown>;
    result?: unknown;
  };
} => {
  if (!part || typeof part !== "object") return false;

  return (
    "type" in part &&
    part.type === "tool-invocation" &&
    "toolInvocation" in part
  );
};

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

export const ChatWidget = ({ widgetId, theme }: ChatWidgetProps) => {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const chatIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
            widgetId,
            theme,
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

  const handleInputKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, isStreaming, error]);

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden h-full flex flex-col">
      <div className="w-full bg-primary p-5">
        <h1 className="text-2xl font-bold text-white">Chatbot</h1>
        <p className="text-base text-white">
          This is a chatbot for this project.
        </p>
      </div>
      <div className="p-2 md:p-5 bg-card flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
        {messages.length ? (
          messages.map((msg, index) =>
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
                  {msg.parts.map((part, partIndex) => {
                    if (part.type === "text") {
                      return (
                        <MarkdownRenderer
                          className="min-w-0 max-w-full text-base text-muted-foreground"
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
              </div>
            ),
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="size-22 rounded-full bg-primary flex items-center justify-center">
                <BotIcon className="size-16 text-white" />
              </div>
              <p>Hi there! I'm here to help you out!</p>
              <div className="space-y-1">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    variant="outline"
                    onClick={() => setMessageInput(prompt)}
                    className="w-full bg-card"
                    key={index}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>
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
        <div ref={messagesEndRef} aria-hidden="true" />
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
          <div className="flex flex-col gap-2">
            <Textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isLoading || isStreaming}
              className="border-none max-h-32 focus-visible:ring-0 focus-visible:border-none focus-visible:outline-0 ring-0 outline-0 shadow-none resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || isStreaming || !messageInput.trim()}
              className="self-end"
            >
              <LoadingSwap isLoading={isLoading || isStreaming}>
                <SendIcon />
              </LoadingSwap>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
