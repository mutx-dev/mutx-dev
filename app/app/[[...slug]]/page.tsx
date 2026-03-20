import { notFound } from "next/navigation";

import { MutxDemoApp } from "@/components/dashboard/demo/MutxDemoApp";
import { isDemoSection } from "@/components/dashboard/demo/demoSections";

export default async function AppDemoPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return <MutxDemoApp section="overview" />;
  }

  if (slug.length !== 1) {
    notFound();
  }

  const [section] = slug;

  if (section === "overview") {
    return <MutxDemoApp section="overview" />;
  }

  if (!isDemoSection(section)) {
    notFound();
  }

  return <MutxDemoApp section={section} />;
}
