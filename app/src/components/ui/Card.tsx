import { cn } from "../../lib/utils";
import type { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: "cyan" | "crimson" | "none";
  padding?: boolean;
}

export function Card({ glow = "none", padding = true, className, children, ...props }: Props) {
  return (
    <div
      className={cn(
        "panel",
        glow === "cyan" && "panel-cyan",
        glow === "crimson" && "panel-crimson",
        padding && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
