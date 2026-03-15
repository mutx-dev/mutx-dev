import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents - Dashboard - MUTX",
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
