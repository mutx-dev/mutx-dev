"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export function DemoViewportLock({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.add("mutx-demo-shell");
    document.body.classList.add("mutx-demo-shell");

    return () => {
      document.documentElement.classList.remove("mutx-demo-shell");
      document.body.classList.remove("mutx-demo-shell");
    };
  }, []);

  return (
    <div className="h-full overflow-hidden" data-mutx-demo-root="">
      {children}
    </div>
  );
}
