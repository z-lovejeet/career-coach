import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Models sometimes emit HTML line breaks (e.g. inside table cells); raw HTML isn't rendered, so drop them. */
const clean = (text: string) => text.replace(/<br\s*\/?>/gi, " ");

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-cc", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}>
        {clean(children)}
      </ReactMarkdown>
    </div>
  );
}
