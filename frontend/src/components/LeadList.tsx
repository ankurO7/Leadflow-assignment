import type { Sections } from "@/lib/leads";
import LeadRow from "./LeadRow";

interface Props {
  sections: Sections;
  now: Date;
  filtered: boolean;
  onOpen: (id: number) => void;
}

export default function LeadList({ sections, now, filtered, onOpen }: Props) {
  const { today, rest } = sections;
  if (!today.length && !rest.length) {
    return (
      <p className="empty">
        {filtered ? "No leads match these filters." : "No leads yet. Add your first lead to get started."}
      </p>
    );
  }
  return (
    <>
      {today.length > 0 && (
        <section className="group group-today" aria-label="Today's follow-ups">
          <h2 className="group-title">
            Follow up today <span className="group-n">{today.length}</span>
          </h2>
          <ul className="list">
            {today.map((l) => (
              <LeadRow key={l.id} lead={l} now={now} pinned onOpen={onOpen} />
            ))}
          </ul>
        </section>
      )}
      {rest.length > 0 && (
        <section className="group" aria-label="All leads">
          {today.length > 0 && <h2 className="group-title">All leads</h2>}
          <ul className="list">
            {rest.map((l) => (
              <LeadRow key={l.id} lead={l} now={now} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
