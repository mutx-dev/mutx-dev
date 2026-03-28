import { appFontVariables } from "@/app/fonts/app";

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
