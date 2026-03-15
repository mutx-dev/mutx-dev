import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhooks - Dashboard - MUTX",
};

export default function WebhooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
