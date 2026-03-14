"use client";

interface DeploymentSortSelectProps {
  value: "date" | "status" | "agent";
  onChange: (value: "date" | "status" | "agent") => void;
}

export function DeploymentSortSelect({ value, onChange }: DeploymentSortSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "date" | "status" | "agent")}
      className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 focus:border-white/20 focus:outline-none"
    >
      <option value="date">Date (newest)</option>
      <option value="status">Status</option>
      <option value="agent">Agent ID</option>
    </select>
  );
}
