import { ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  href: string;
  label?: string;
  short?: boolean;
  className?: string;
}

export function ExplorerLink({ href, label, short, className }: Props) {
  const display = label ?? (short ? "Explorer" : href.slice(0, 28) + "…");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-mono text-cyan/70 hover:text-cyan transition-colors",
        className
      )}
    >
      {display}
      <ExternalLink size={10} />
    </a>
  );
}
