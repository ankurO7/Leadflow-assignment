import { STATUSES, type Lead, type Status } from "@/lib/types";

interface Props {
  leads: Lead[];
  value: Status | "All";
  onChange: (v: Status | "All") => void;
}

export default function FilterBar({ leads, value, onChange }: Props) {
  const count = (s: Status | "All") => (s === "All" ? leads.length : leads.filter((l) => l.status === s).length);
  return (
    <div className="filters" role="tablist" aria-label="Filter by status">
      {(["All", ...STATUSES] as const).map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={value === s}
          className={`chip${value === s ? " chip-on" : ""}`}
          onClick={() => onChange(s)}
        >
          {s} <span className="chip-n">{count(s)}</span>
        </button>
      ))}
    </div>
  );
}
