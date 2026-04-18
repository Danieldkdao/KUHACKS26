"use client";

import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as commonDictionary } from "@zxcvbn-ts/language-common";
import {
  dictionary as englishDictionary,
  translations as englishTranslations,
} from "@zxcvbn-ts/language-en";
import { cn } from "@/lib/utils";

zxcvbnOptions.setOptions({
  dictionary: {
    ...commonDictionary,
    ...englishDictionary,
  },
  graphs: adjacencyGraphs,
  translations: englishTranslations,
});

const strengthLabels = [
  "Very weak",
  "Weak",
  "Fair",
  "Good",
  "Strong",
] as const;

const strengthBarClasses = [
  "bg-destructive",
  "bg-destructive/80",
  "bg-accent",
  "bg-secondary",
  "bg-primary",
] as const;

type PasswordStrengthProps = {
  password: string;
  userInputs?: Array<string | number>;
  className?: string;
};

export function PasswordStrength({
  password,
  userInputs = [],
  className,
}: PasswordStrengthProps) {
  const result = password ? zxcvbn(password, userInputs) : null;
  const strengthIndex = result?.score;
  const activeSegments = strengthIndex !== undefined ? strengthIndex + 1 : 0;
  const activeBarClass =
    strengthIndex !== undefined
      ? strengthBarClasses[strengthIndex]
      : "bg-muted-foreground/20";
  const strengthLabel =
    strengthIndex !== undefined
      ? strengthLabels[strengthIndex]
      : "Not checked yet";

  const feedback =
    result?.feedback.warning ||
    result?.feedback.suggestions[0] ||
    "Use at least 8 characters and avoid common words or personal details.";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Password strength
        </p>
        <p className="text-sm font-medium text-foreground">{strengthLabel}</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-2 rounded-full bg-muted transition-colors",
              index < activeSegments && activeBarClass
            )}
          />
        ))}
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{feedback}</p>
    </div>
  );
}
