import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon } from "lucide-react";

const Page = () => {
  return (
    <div className="p-10">
      <div className="rounded-xl border shadow-sm overflow-hidden">
        <div className="w-full bg-primary p-5">
          <h1 className="text-2xl font-bold text-white">Chatbot</h1>
          <p className="text-base text-white">
            This is a chatbot for this project.
          </p>
        </div>
        <div className="p-5 bg-card h-100 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-start gap-2 max-w-[80%] self-start">
            <Avatar>
              <AvatarFallback>CT</AvatarFallback>
            </Avatar>
            <div className="p-2 rounded-md border">
              <span className="text-base font-medium text-muted-foreground">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi
                quis doloribus tempore totam reprehenderit laborum optio
                voluptas. Nam nihil, aliquam, blanditiis repellat minus autem,
                iure dignissimos repellendus aspernatur commodi consequatur.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 max-w-[80%] self-end">
            <div className="p-2 rounded-md border text-right">
              <span className="text-base font-medium text-muted-foreground text-right">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi
                quis doloribus tempore totam reprehenderit laborum optio
                voluptas. Nam nihil, aliquam, blanditiis repellat minus autem,
                iure dignissimos repellendus aspernatur commodi consequatur.
              </span>
            </div>
            <Avatar>
              <AvatarFallback>DD</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-start gap-2 max-w-[80%] self-start">
            <Avatar>
              <AvatarFallback>CT</AvatarFallback>
            </Avatar>
            <div className="p-2 rounded-md border">
              <span className="text-base font-medium text-muted-foreground">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi
                quis doloribus tempore totam reprehenderit laborum optio
                voluptas. Nam nihil, aliquam, blanditiis repellat minus autem,
                iure dignissimos repellendus aspernatur commodi consequatur.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 max-w-[80%] self-end">
            <div className="p-2 rounded-md border text-right">
              <span className="text-base font-medium text-muted-foreground text-right">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi
                quis doloribus tempore totam reprehenderit laborum optio
                voluptas. Nam nihil, aliquam, blanditiis repellat minus autem,
                iure dignissimos repellendus aspernatur commodi consequatur.
              </span>
            </div>
            <Avatar>
              <AvatarFallback>DD</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex items-start gap-2 max-w-[80%] self-start">
            <Avatar>
              <AvatarFallback>CT</AvatarFallback>
            </Avatar>
            <div className="p-2 rounded-md border">
              <span className="text-base font-medium text-muted-foreground">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi
                quis doloribus tempore totam reprehenderit laborum optio
                voluptas. Nam nihil, aliquam, blanditiis repellat minus autem,
                iure dignissimos repellendus aspernatur commodi consequatur.
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 max-w-[80%] self-end">
            <div className="p-2 rounded-md border text-right">
              <span className="text-base font-medium text-muted-foreground text-right">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi
                quis doloribus tempore totam reprehenderit laborum optio
                voluptas. Nam nihil, aliquam, blanditiis repellat minus autem,
                iure dignissimos repellendus aspernatur commodi consequatur.
              </span>
            </div>
            <Avatar>
              <AvatarFallback>DD</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full p-5 border-t">
          <Input />
          <Button>
            <SendIcon />
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
