import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageShell({ children, className, fullWidth }: Props) {
  return (
    <main
      className={cn(
        "min-h-[100dvh] pt-14",
        !fullWidth && "max-w-7xl mx-auto px-4 sm:px-6",
        className
      )}
    >
      {children}
    </main>
  );
}
