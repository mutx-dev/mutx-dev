import type { Metadata } from "next";

import { appFontVariables } from "@/app/fonts/app";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${appFontVariables} min-h-screen font-[family:var(--font-display)]`}>
      {children}
    </div>
  );
}
