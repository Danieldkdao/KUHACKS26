"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { ComponentProps, forwardRef, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

export const CopyButton = forwardRef<
  HTMLButtonElement,
  {
    text: string;
    additionalDisabled: boolean;
  } & Partial<ComponentProps<typeof Button>>
>(({ text, additionalDisabled, ...props }, ref) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
        timeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Button
      ref={ref}
      type="button"
      onClick={handleCopy}
      disabled={additionalDisabled || !text.trim()}
      aria-label={isCopied ? "Copied message" : "Copy message"}
      {...props}
    >
      {isCopied ? <CheckIcon className="text-green-600" /> : <CopyIcon />}
    </Button>
  );
});

CopyButton.displayName = "CopyButton";
