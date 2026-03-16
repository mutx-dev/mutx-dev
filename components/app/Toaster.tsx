"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#0f0f14",
          border: "1px solid #1e293b",
          color: "#f1f5f9",
        },
      }}
    />
  );
}
