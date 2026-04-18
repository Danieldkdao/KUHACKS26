import { ChatWidget } from "@/components/chat-widget";

const HomePage = () => {
  return (
    <div className="min-h-svh bg-background p-10">
      <div className="mx-auto h-[700px] max-w-2xl">
        <ChatWidget />
      </div>
    </div>
  );
};

export default HomePage;
