"use client";

import { useState } from "react";

interface CopyButtonProps {
  code: string;
}

export function CopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      className={`docs-copy-btn${copied ? " copied" : ""}`}
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy code"}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
