import { ChatWidget } from "@/components/chat-widget";
import { getUserInformation } from "@/lib/actions";

const HomePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) => {
  const { userId } = await searchParams;
  const userInfo = await getUserInformation(userId);

  return (
    <div className="min-h-svh bg-background p-10">
      <div className="mx-auto h-[700px] max-w-2xl">
        <ChatWidget {...userInfo} />
      </div>
    </div>
  );
};

export default HomePage;
