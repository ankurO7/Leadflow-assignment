import type { Lead } from "@/lib/types";
import { formatFollowUp, isOverdue, timeAgo } from "@/lib/time";
import StatusBadge from "./StatusBadge";

interface Props {
  lead: Lead;
  now: Date;
  pinned?: boolean;
  onOpen: (id: number) => void;
}

export default function LeadRow({ lead, now, pinned, onOpen }: Props) {
  const overdue = !!lead.follow_up_at && isOverdue(lead.follow_up_at, now.getTime());
  const cls = ["row", pinned ? "row-today" : "", overdue ? "row-overdue" : ""].join(" ");
  return (
    <li>
      <button className={cls} onClick={() => onOpen(lead.id)}>
        <span className="row-top">
          <span className="row-name">
            {lead.name}
            {lead.company && <span className="row-company"> {lead.company}</span>}
          </span>
          <StatusBadge status={lead.status} />
        </span>
        <span className="row-mid">
          <span className={`row-note${lead.last_note ? "" : " row-note-empty"}`}>
            {lead.last_note ?? "No discussions yet"}
          </span>
          <span className="row-ago">{lead.last_discussion_at ? timeAgo(lead.last_discussion_at, now.getTime()) : ""}</span>
        </span>
        {lead.follow_up_at && (
          <span className={`followup${overdue ? " followup-overdue" : ""}`}>
            {overdue ? "Overdue: " : "Follow up: "}
            {formatFollowUp(lead.follow_up_at, now)}
          </span>
        )}
      </button>
    </li>
  );
}
