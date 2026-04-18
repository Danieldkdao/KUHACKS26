import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type MarkdownRendererProps = {
  children: string;
  className?: string;
};

export const MarkdownRenderer = ({
  children,
  className,
}: MarkdownRendererProps) => {
  return (
    <div
      className={cn(
        "max-w-none text-base leading-7 text-foreground",
        "[&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1 [&_li]:pl-1",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_em]:italic",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mt-6 mb-3 text-2xl font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 mb-3 text-xl font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-2 text-base font-semibold tracking-tight text-foreground first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-2 text-base font-semibold uppercase tracking-[0.12em] text-muted-foreground first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-base leading-7 text-foreground/95">{children}</p>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-lg border-l-4 border-primary/45 bg-primary/5 px-4 py-3 text-base italic text-foreground/85">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-border" />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/80"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => (
            <pre className="my-4 max-w-full overflow-x-auto rounded-xl border border-border bg-muted/70 p-4 text-base leading-6 shadow-sm">
              {children}
            </pre>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block min-w-max font-mono text-[13px] whitespace-pre text-foreground",
                    className,
                  )}
                >
                  {children}
                </code>
              );
            }

            return (
              <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">
                {children}
              </code>
            );
          },
          ul: ({ children }) => (
            <ul className="my-3 space-y-1 text-base leading-7 text-foreground/95">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-1 text-base leading-7 text-foreground/95">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="marker:text-primary">{children}</li>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-left text-base">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-border px-3 py-2 align-top text-foreground/90">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
