import { ChatWidget } from "@/components/chat-widget";
import { getUserInformation } from "@/lib/actions";

type EmbedPageProps = {
  searchParams: Promise<{
    userId?: string;
    theme?: string;
  }>;
};

const EmbedPage = async ({ searchParams }: EmbedPageProps) => {
  const params = await searchParams;
  const userInfo = await getUserInformation(params.userId);

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent p-0">
      <ChatWidget
        userId={params.userId ?? null}
        {...userInfo}
        theme={params.theme ?? null}
      />
    </div>
  );
};

export default EmbedPage;
