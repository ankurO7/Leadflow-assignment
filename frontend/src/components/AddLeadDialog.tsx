"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { STATUSES, type Lead, type Status } from "@/lib/types";
import Modal from "./Modal";

interface Props {
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

export default function AddLeadDialog({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("New");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter the lead's name.");
    setSaving(true);
    setError(null);
    try {
      const lead = await api.createLead({ name, company, phone, status });
      onCreated(lead);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Add lead" onClose={onClose}>
      <form className="form-body" onSubmit={submit} noValidate>
        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required maxLength={120} />
        </label>
        <label className="field">
          Company <small>optional</small>
          <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} />
        </label>
        <label className="field">
          Phone <small>optional</small>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" maxLength={40} />
        </label>
        <label className="field">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={saving}>
            {saving ? "Adding…" : "Add lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
