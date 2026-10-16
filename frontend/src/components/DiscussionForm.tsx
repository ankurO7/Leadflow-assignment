"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Discussion, Lead } from "@/lib/types";
import { atTenAm, localInputToIso } from "@/lib/time";

interface Props {
  leadId: number;
  onSaved: (discussion: Discussion, lead: Lead) => void;
}

const QUICK = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
];

export default function DiscussionForm({ leadId, onSaved }: Props) {
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return setError("Write what you discussed before saving.");
    setSaving(true);
    setError(null);
    try {
      const res = await api.addDiscussion(leadId, note, followUp ? localInputToIso(followUp) : undefined);
      onSaved(res.discussion, res.lead);
      setNote("");
      setFollowUp("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="composer" onSubmit={submit} noValidate>
      <label className="field">
        New note
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="What did you discuss?"
          maxLength={4000}
        />
      </label>
      <div className="composer-row">
        <label className="field field-inline">
          Follow-up <small>optional</small>
          <input type="datetime-local" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        </label>
        <div className="quick">
          {QUICK.map((q) => (
            <button type="button" key={q.label} className="chip" onClick={() => setFollowUp(atTenAm(q.days))}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button className="btn" disabled={saving}>
          {saving ? "Saving…" : "Save note"}
        </button>
      </div>
    </form>
  );
}
