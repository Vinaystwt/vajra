import { Shield, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { PROGRAM_EXPLORER, PROGRAM_ID, shortKey } from "../../lib/constants";

function GitHubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function TelegramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#050505]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-cyan" />
              <span className="font-semibold text-[#EDEDED]">Vajra</span>
            </div>
            <p className="text-sm text-[rgba(237,237,237,0.42)] leading-relaxed max-w-xs">
              Non-custodial SPL allowance vault for Solana automated signers. PolicyPDA owns vault
              authority. The agent key requests; the program enforces.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://github.com/Vinaystwt/vajra"
                target="_blank"
                rel="noreferrer"
                aria-label="Vajra on GitHub"
                className="text-[rgba(237,237,237,0.35)] hover:text-[rgba(237,237,237,0.75)] transition-colors"
              >
                <GitHubIcon size={16} />
              </a>
              <a
                href="https://x.com/Vinaystwt"
                target="_blank"
                rel="noreferrer"
                aria-label="Vinaystwt on X"
                className="text-[rgba(237,237,237,0.35)] hover:text-[rgba(237,237,237,0.75)] transition-colors"
              >
                <XIcon size={15} />
              </a>
              <a
                href="https://t.me/vinaystwt"
                target="_blank"
                rel="noreferrer"
                aria-label="vinaystwt on Telegram"
                className="text-[rgba(237,237,237,0.35)] hover:text-[rgba(237,237,237,0.75)] transition-colors"
              >
                <TelegramIcon size={15} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">Explore</span>
            <nav className="flex flex-col gap-2">
              {[
                { href: "/", label: "Attack Lab" },
                { href: "/why", label: "Why Vajra" },
                { href: "/proofs", label: "Proof Explorer" },
                { href: "/developers", label: "Developers" },
              ].map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="text-sm text-[rgba(237,237,237,0.52)] hover:text-[rgba(237,237,237,0.8)] transition-colors w-fit"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* On-chain */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">On-chain</span>
            <a
              href={PROGRAM_EXPLORER}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm font-mono text-[rgba(237,237,237,0.52)] hover:text-cyan transition-colors w-fit"
            >
              {shortKey(PROGRAM_ID, 6, 6)}
              <ExternalLink size={11} />
            </a>
            <span className="text-xs text-[rgba(237,237,237,0.3)]">Solana Devnet</span>
          </div>

          {/* Packages */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">Packages</span>
            <a
              href="https://www.npmjs.com/package/@vinaystwt/vajra-sdk"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-[rgba(237,237,237,0.45)] hover:text-[rgba(237,237,237,0.75)] transition-colors w-fit"
            >
              @vinaystwt/vajra-sdk
              <ExternalLink size={10} />
            </a>
            <a
              href="https://www.npmjs.com/package/@vinaystwt/vajra-mcp"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-[rgba(237,237,237,0.45)] hover:text-[rgba(237,237,237,0.75)] transition-colors w-fit"
            >
              @vinaystwt/vajra-mcp
              <ExternalLink size={10} />
            </a>
            <a
              href="https://github.com/Vinaystwt/vajra"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono text-[rgba(237,237,237,0.45)] hover:text-[rgba(237,237,237,0.75)] transition-colors w-fit"
            >
              GitHub
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs text-[rgba(237,237,237,0.28)]">
            Proof artifacts sourced from devnet. Explorer links verify on-chain.
          </span>
          <span className="text-xs font-mono text-[rgba(237,237,237,0.2)]">MIT License</span>
        </div>
      </div>
    </footer>
  );
}
