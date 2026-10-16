"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { STATUSES, type Discussion, type Lead, type Status } from "@/lib/types";
import { formatFollowUp, isOverdue } from "@/lib/time";
import DiscussionForm from "./DiscussionForm";
import Modal from "./Modal";
import Timeline from "./Timeline";

interface Props {
  lead: Lead;
  onClose: () => void;
  onLeadChange: (lead: Lead) => void;
}

export default function LeadDialog({ lead, onClose, onLeadChange }: Props) {
  const [items, setItems] = useState<Discussion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    api
      .listDiscussions(lead.id)
      .then((d) => live && setItems(d))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [lead.id]);

  async function run(action: () => Promise<Lead>) {
    setBusy(true);
    setError(null);
    try {
      onLeadChange(await action());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const overdue = !!lead.follow_up_at && isOverdue(lead.follow_up_at);

  return (
    <Modal
      wide
      title={lead.name}
      onClose={onClose}
      subtitle={[lead.company, lead.phone].filter(Boolean).join("  ") || "No company or phone on file"}
    >
      <div className="lead-meta">
        <label className="field field-inline">
          Status
          <select
            value={lead.status}
            disabled={busy}
            onChange={(e) => run(() => api.updateStatus(lead.id, e.target.value as Status))}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {lead.follow_up_at && (
          <div className={`followup${overdue ? " followup-overdue" : ""}`}>
            {overdue ? "Overdue: " : "Next follow-up: "}
            {formatFollowUp(lead.follow_up_at)}
            <button className="link-btn" disabled={busy} onClick={() => run(() => api.clearFollowUp(lead.id))}>
              Mark done
            </button>
          </div>
        )}
      </div>
      {error && <p className="error error-pad" role="alert">{error}</p>}
      <div className="modal-scroll">
        {items === null && !error ? <p className="empty empty-sm">Loading history…</p> : <Timeline items={items ?? []} />}
      </div>
      <DiscussionForm
        leadId={lead.id}
        onSaved={(d, updated) => {
          setItems((prev) => [d, ...(prev ?? [])]);
          onLeadChange(updated);
        }}
      />
    </Modal>
  );
}
