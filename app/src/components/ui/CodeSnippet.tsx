import { cn } from "../../lib/utils";
import { CopyButton } from "./CopyButton";

interface Props {
  code: string;
  language?: string;
  title?: string;
  className?: string;
  maxHeight?: string;
}

export function CodeSnippet({ code, language = "typescript", title, className, maxHeight }: Props) {
  return (
    <div className={cn("rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e0e0e] border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
          </div>
          {title && (
            <span className="text-xs font-mono text-[rgba(237,237,237,0.42)] ml-1">{title}</span>
          )}
          {!title && (
            <span className="text-xs font-mono text-[rgba(237,237,237,0.3)]">{language}</span>
          )}
        </div>
        <CopyButton text={code} />
      </div>
      <div
        className={cn(
          "overflow-auto bg-[#0a0a0a] p-4",
          maxHeight && `max-h-[${maxHeight}]`
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <pre className="text-sm font-mono text-[rgba(237,237,237,0.85)] leading-relaxed whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
