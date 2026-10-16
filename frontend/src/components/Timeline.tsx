import type { Discussion } from "@/lib/types";
import { formatDateTime, formatFollowUp } from "@/lib/time";

export default function Timeline({ items }: { items: Discussion[] }) {
  if (!items.length) return <p className="empty empty-sm">No discussions yet. Log your first note below.</p>;
  return (
    <ol className="timeline">
      {items.map((d) => (
        <li key={d.id} className="tl-item">
          <time className="tl-time" dateTime={d.created_at}>
            {formatDateTime(d.created_at)}
          </time>
          <p className="tl-note">{d.note}</p>
          {d.follow_up_at && <span className="followup">Follow-up set for {formatFollowUp(d.follow_up_at)}</span>}
        </li>
      ))}
    </ol>
  );
}
