import { appFontVariables } from "@/app/fonts/app";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { parseSummary } from "@/lib/docs";

export default function DocsRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = parseSummary();
  return (
    <div className={appFontVariables}>
      <DocsLayout nav={nav}>{children}</DocsLayout>
    </div>
  );
}
