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
      className="rounded-[14px] border border-[#2f3c49] bg-[#10161d] px-3 py-2 text-sm text-white/80 focus:border-emerald-300/30 focus:outline-none"
    >
      <option value="date">Date (newest)</option>
      <option value="status">Status</option>
      <option value="agent">Agent ID</option>
    </select>
  );
}
