import { Wrench } from "lucide-react";

interface Props {
  name: string;
  description: string;
  input?: string;
  output?: string;
}

export function McpToolCard({ name, description, input, output }: Props) {
  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan/10 shrink-0">
          <Wrench size={14} className="text-cyan" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-mono text-cyan">{name}</span>
          <span className="text-xs text-[rgba(237,237,237,0.55)]">{description}</span>
        </div>
      </div>
      {(input || output) && (
        <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,255,255,0.06)] pt-3">
          {input && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">Input</span>
              <span className="text-[11px] font-mono text-[rgba(237,237,237,0.55)]">{input}</span>
            </div>
          )}
          {output && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">Returns</span>
              <span className="text-[11px] font-mono text-[rgba(237,237,237,0.55)]">{output}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
