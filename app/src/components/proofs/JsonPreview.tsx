import { useState } from "react";
import { Code2, ChevronDown, ChevronUp } from "lucide-react";
import { CopyButton } from "../ui/CopyButton";

interface Props {
  data: object;
  label?: string;
}

export function JsonPreview({ data, label = "JSON" }: Props) {
  const [open, setOpen] = useState(false);
  const json = JSON.stringify(data, null, 2);

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.07)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-mono text-[rgba(237,237,237,0.5)] hover:text-[rgba(237,237,237,0.8)] bg-[#0d0d0d] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Code2 size={12} />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {open && <CopyButton text={json} />}
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>
      {open && (
        <div className="bg-[#080808] p-3 max-h-48 overflow-y-auto">
          <pre className="text-[11px] font-mono text-[rgba(237,237,237,0.6)] leading-relaxed whitespace-pre">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}
