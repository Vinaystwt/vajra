import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
}

export function DeveloperTabs({ tabs }: Props) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-[#0e0e0e] rounded-xl border border-[rgba(255,255,255,0.07)] overflow-x-auto max-w-full scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              active === tab.id
                ? "text-[#EDEDED]"
                : "text-[rgba(237,237,237,0.45)] hover:text-[rgba(237,237,237,0.75)]"
            )}
          >
            {active === tab.id && (
              <motion.div
                layoutId="dev-tab-active"
                className="absolute inset-0 bg-[#1e1e1e] border border-[rgba(255,255,255,0.1)] rounded-lg"
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — animated swap */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {tabs.find((t) => t.id === active)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
