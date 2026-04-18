"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Textarea } from "@/components/ui/textarea";
import { upsertSystemPrompt } from "@/lib/actions";
import { useState } from "react";
import { toast } from "sonner";

type SystemPromptFormProps = {
  initialValue?: string;
};

export const SystemPromptForm = ({
  initialValue = "",
}: SystemPromptFormProps) => {
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(initialValue);

  const handleSaveSystemPrompt = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const response = await upsertSystemPrompt(systemPrompt);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Assistant Knowledge Base</CardTitle>
        <CardDescription>
          Update the knowledge base the widget uses when answering new messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Field>
            <FieldLabel>Knowledge Base</FieldLabel>
            <Textarea
              className="min-h-40 resize-y"
              placeholder="Enter knowledge base instructions..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <FieldDescription>
              Keep this focused on tone, constraints, and the information the
              assistant should prioritize.
            </FieldDescription>
          </Field>
          <Button
            className="w-full"
            type="button"
            onClick={handleSaveSystemPrompt}
            disabled={loading}
          >
            <LoadingSwap isLoading={loading}>Save Knowledge Base</LoadingSwap>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
