import type { Lead, Status } from "./types";
import { isOverdue, isToday } from "./time";

export interface Sections {
  today: Lead[];
  rest: Lead[];
}

/**
 * Today's follow-ups are pinned (earliest first). Everything else follows:
 * overdue leads first, then by most recent activity.
 */
export function organize(leads: Lead[], status: Status | "All", query: string, now = new Date()): Sections {
  const q = query.trim().toLowerCase();
  const visible = leads.filter(
    (l) => (status === "All" || l.status === status) && (!q || l.name.toLowerCase().includes(q)),
  );
  const t = now.getTime();
  const today = visible
    .filter((l) => l.follow_up_at && isToday(l.follow_up_at, now))
    .sort((a, b) => +new Date(a.follow_up_at!) - +new Date(b.follow_up_at!));
  const pinned = new Set(today.map((l) => l.id));
  const activity = (l: Lead) => +new Date(l.last_discussion_at ?? l.created_at);
  const rest = visible
    .filter((l) => !pinned.has(l.id))
    .sort((a, b) => {
      const ao = a.follow_up_at && isOverdue(a.follow_up_at, t) ? 1 : 0;
      const bo = b.follow_up_at && isOverdue(b.follow_up_at, t) ? 1 : 0;
      return bo - ao || activity(b) - activity(a);
    });
  return { today, rest };
}
