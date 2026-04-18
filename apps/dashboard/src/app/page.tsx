"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Textarea } from "@/components/ui/textarea";
import { createUpdateSystemPrompt } from "@/lib/actions";
import { useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");

  const handleSaveSystemPrompt = async () => {
    if (loading) return;
    setLoading(true);

    const response = await createUpdateSystemPrompt(systemPrompt);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
    }
    setLoading(false);
  };

  return (
    <div className="py-10 px-6 min-h-svh w-ful flex items-center justify-center">
      <div className="w-full max-w-150">
        <Card>
          <CardContent>
            <form className="space-y-4">
              <Field>
                <FieldLabel>Knowledge Base</FieldLabel>
                <Textarea
                  className="max-h-32"
                  placeholder="Enter knowledge base..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </Field>
              <FieldDescription>
                Update the knowledge base for the AI assistant to be more
                helpful.
              </FieldDescription>
              <Button
                className="w-full"
                type="button"
                onClick={handleSaveSystemPrompt}
                disabled={loading}
              >
                <LoadingSwap isLoading={loading}>
                  Update System Prompt
                </LoadingSwap>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
