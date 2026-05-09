import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  logs: string[];
}

export function RawLogViewer({ logs }: Props) {
  const [open, setOpen] = useState(false);
  if (!logs?.length) return null;

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.07)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono text-[rgba(237,237,237,0.5)] hover:text-[rgba(237,237,237,0.8)] bg-[#0d0d0d] transition-colors cursor-pointer"
      >
        <span>Raw program logs ({logs.length})</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="bg-[#080808] p-3 max-h-48 overflow-y-auto">
          {logs.map((line, i) => (
            <div
              key={i}
              className={cn(
                "text-[11px] font-mono leading-relaxed",
                line.includes("Error") || line.includes("failed")
                  ? "text-crimson/80"
                  : line.includes("VAJRA_GUARD")
                  ? "text-cyan/70"
                  : "text-[rgba(237,237,237,0.45)]"
              )}
            >
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
