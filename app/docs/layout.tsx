import { Inter, Source_Code_Pro } from "next/font/google";
import { DocsLayout } from "@/components/site/docs/DocsLayout";
import { parseSummary } from "@/lib/docs";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-source-code",
  display: "swap",
});

export default function DocsRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = parseSummary();
  return (
    <div className={`${inter.variable} ${sourceCode.variable}`}>
      <DocsLayout nav={nav}>{children}</DocsLayout>
    </div>
  );
}
