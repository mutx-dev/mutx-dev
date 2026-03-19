import { redirect } from "next/navigation";

export default function DashboardSwarmPage() {
  redirect("/dashboard/deployments");
}
