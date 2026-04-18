import { ChatWidget } from "@/components/chat-widget";

type EmbedPageProps = {
  searchParams: Promise<{
    widgetId?: string;
    theme?: string;
  }>;
};

const EmbedPage = async ({ searchParams }: EmbedPageProps) => {
  const params = await searchParams;

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent p-0">
      <ChatWidget
        widgetId={params.widgetId ?? null}
        theme={params.theme ?? null}
      />
    </div>
  );
};

export default EmbedPage;
