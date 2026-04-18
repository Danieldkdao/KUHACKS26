import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const Page = () => {
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
                />
              </Field>
              <FieldDescription>
                Update the knowledge base for the AI assistant to be more
                helpful.
              </FieldDescription>
              <Button className="w-full">Update System Prompt</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
