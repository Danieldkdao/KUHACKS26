import { ChatWidget } from "@/components/chat-widget";

type EmbedPageProps = {
  searchParams: Promise<{
    userId?: string;
    theme?: string;
  }>;
};

const EmbedPage = async ({ searchParams }: EmbedPageProps) => {
  const params = await searchParams;

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent p-0">
      <ChatWidget userId={params.userId ?? null} theme={params.theme ?? null} />
    </div>
  );
};

export default EmbedPage;
