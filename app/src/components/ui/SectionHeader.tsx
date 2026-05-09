import { cn } from "../../lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({ eyebrow, title, sub, align = "left", className }: Props) {
  return (
    <div className={cn("flex flex-col gap-3", align === "center" && "items-center text-center", className)}>
      {eyebrow && (
        <span className="text-xs font-mono font-medium uppercase tracking-[0.2em] text-cyan">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#EDEDED] leading-tight">
        {title}
      </h2>
      {sub && (
        <p className={cn("text-[rgba(237,237,237,0.68)] leading-relaxed", align === "center" ? "max-w-2xl" : "max-w-xl")}>
          {sub}
        </p>
      )}
    </div>
  );
}
