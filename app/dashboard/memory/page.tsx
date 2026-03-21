import { DemoRoutePage } from "@/components/dashboard/DemoRoutePage";

export default function DashboardMemoryPage() {
  return (
    <DemoRoutePage
      title="Memory"
      description="Memory and context-management need real retention and retrieval contracts before they deserve operator controls."
      badge="demo memory"
      notes={[
        "Do not ship pretend vector-store or retention controls before the product semantics exist.",
        "This surface should become the place operators inspect memory pressure, retention windows, and context ownership.",
        "Until then, keep the route compact, honest, and visually aligned with the rest of the control plane.",
      ]}
    />
  );
}
