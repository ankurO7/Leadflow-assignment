"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { organize } from "@/lib/leads";
import type { Lead, Status } from "@/lib/types";
import AddLeadDialog from "./AddLeadDialog";
import FilterBar from "./FilterBar";
import LeadDialog from "./LeadDialog";
import LeadList from "./LeadList";

export default function LeadBoard() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | "All">("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const load = () =>
    api
      .listLeads()
      .then((l) => {
        setLeads(l);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 30_000); // keeps "time ago" and overdue fresh
    return () => clearInterval(t);
  }, []);

  const sections = useMemo(() => organize(leads ?? [], status, query, now), [leads, status, query, now]);
  const openLead = leads?.find((l) => l.id === openId) ?? null;

  const upsert = (lead: Lead) =>
    setLeads((prev) => (prev?.some((l) => l.id === lead.id) ? prev.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...(prev ?? [])]));

  return (
    <main className="shell">
      <header className="topbar">
        <h1 className="brand">LeadFlow</h1>
        <input
          className="search"
          type="search"
          placeholder="Search by name"
          aria-label="Search leads by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" onClick={() => setAdding(true)}>
          Add lead
        </button>
      </header>

      {leads && <FilterBar leads={leads} value={status} onChange={setStatus} />}

      {error && (
        <div className="error banner" role="alert">
          {error} <button className="link-btn" onClick={load}>Retry</button>
        </div>
      )}
      {leads === null && !error && <p className="empty">Loading leads…</p>}
      {leads && (
        <LeadList sections={sections} now={now} filtered={status !== "All" || !!query.trim()} onOpen={setOpenId} />
      )}

      {openLead && <LeadDialog lead={openLead} onClose={() => setOpenId(null)} onLeadChange={upsert} />}
      {adding && (
        <AddLeadDialog
          onClose={() => setAdding(false)}
          onCreated={(l) => {
            upsert(l);
            setAdding(false);
            setStatus("All");
            setQuery("");
          }}
        />
      )}
    </main>
  );
}
