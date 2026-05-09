import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-cyan text-bg font-semibold hover:bg-cyan/90 active:scale-[0.98] shadow-[0_0_20px_rgba(0,229,255,0.2)]",
  ghost:
    "bg-transparent text-[rgba(237,237,237,0.68)] hover:bg-white/5 hover:text-[#EDEDED] border border-[rgba(255,255,255,0.08)]",
  danger:
    "bg-crimson/10 text-crimson border border-crimson/20 hover:bg-crimson/20 active:scale-[0.98]",
  outline:
    "bg-transparent text-cyan border border-cyan/30 hover:bg-cyan/5 active:scale-[0.98]",
};

const sizes = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2 rounded-xl",
  lg: "text-base px-6 py-3 rounded-xl",
};

export function Button({
  variant = "ghost",
  size = "md",
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
