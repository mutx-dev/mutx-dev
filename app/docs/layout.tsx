import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { parseSummary } from "@/lib/docs";

export default function DocsRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = parseSummary();
  return <DocsLayout nav={nav}>{children}</DocsLayout>;
}
