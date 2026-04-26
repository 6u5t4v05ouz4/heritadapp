"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  displayText?: string;
}

export default function CopyButton({ text, className, displayText }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 font-mono text-sm text-text-secondary hover:text-text-primary transition-colors",
        className
      )}
      aria-label="Copy address"
    >
      {displayText || text}
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-bg-elevated transition-colors">
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </span>
    </button>
  );
}
