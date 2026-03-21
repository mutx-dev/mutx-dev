import { redirect } from "next/navigation";

export default function DashboardSpawnPage() {
  redirect("/dashboard/agents?create=1");
}
