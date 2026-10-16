import type { Discussion, Lead, NewLead, Status } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that the API is running.");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") msg = body.detail;
      else if (Array.isArray(body.detail)) msg = body.detail.map((d: { msg: string }) => d.msg).join("; ");
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listLeads: () => request<Lead[]>("/api/leads"),
  createLead: (body: NewLead) => request<Lead>("/api/leads", { method: "POST", body: JSON.stringify(body) }),
  updateStatus: (id: number, status: Status) =>
    request<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  clearFollowUp: (id: number) =>
    request<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ follow_up_at: null }) }),
  listDiscussions: (id: number) => request<Discussion[]>(`/api/leads/${id}/discussions`),
  addDiscussion: (id: number, note: string, followUpAt?: string) =>
    request<{ discussion: Discussion; lead: Lead }>(`/api/leads/${id}/discussions`, {
      method: "POST",
      body: JSON.stringify({ note, follow_up_at: followUpAt ?? null }),
    }),
};
