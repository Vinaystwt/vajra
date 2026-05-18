import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import { NAV_LINKS, PROGRAM_EXPLORER, shortKey, PROGRAM_ID } from "../../lib/constants";
// NAV_LINKS items may have an optional accent field

export function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "glass border-b border-[rgba(255,255,255,0.06)]"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 group-hover:bg-cyan/15 transition-colors overflow-hidden">
              <img
                src="/logo-mark.svg"
                alt="Vajra"
                className="w-6 h-6 object-contain"
                draggable={false}
              />
            </div>
            <span className="font-semibold text-[#EDEDED] tracking-tight">Vajra</span>
            <span className="hidden sm:inline text-xs font-mono text-[rgba(237,237,237,0.3)] border border-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded">
              DEVNET
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.href;
              const isCrimson = link.accent === "crimson";
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? isCrimson ? "text-[#E11D48]" : "text-cyan"
                      : isCrimson
                      ? "text-[rgba(225,29,72,0.75)] hover:text-[#E11D48]"
                      : "text-[rgba(237,237,237,0.62)] hover:text-[#EDEDED]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className={`absolute inset-0 rounded-lg border ${
                        isCrimson
                          ? "bg-[rgba(225,29,72,0.08)] border-[rgba(225,29,72,0.2)]"
                          : "bg-cyan/8 border-cyan/15"
                      }`}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {isCrimson && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0"
                        style={{ boxShadow: "0 0 5px rgba(225,29,72,0.6)" }}
                      />
                    )}
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={PROGRAM_EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-[rgba(237,237,237,0.38)] hover:text-[rgba(237,237,237,0.68)] transition-colors border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] px-2.5 py-1.5 rounded-lg"
            >
              {shortKey(PROGRAM_ID, 4, 4)}
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-[rgba(237,237,237,0.62)] hover:text-[#EDEDED]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="fixed top-14 left-0 right-0 z-40 glass border-b border-[rgba(255,255,255,0.06)] md:hidden"
          >
            <nav className="flex flex-col px-4 py-3 gap-1">
              {NAV_LINKS.map((link) => {
                const active = location.pathname === link.href;
                const isCrimson = link.accent === "crimson";
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                      active
                        ? isCrimson ? "text-[#E11D48] bg-[rgba(225,29,72,0.08)]" : "text-cyan bg-cyan/8"
                        : isCrimson
                        ? "text-[rgba(225,29,72,0.75)] hover:text-[#E11D48] hover:bg-[rgba(225,29,72,0.06)]"
                        : "text-[rgba(237,237,237,0.68)] hover:text-[#EDEDED] hover:bg-white/4"
                    )}
                  >
                    {isCrimson && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0" />
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
