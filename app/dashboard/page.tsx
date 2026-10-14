"use client";

import { useMemo, useState } from "react";

type Status = "needs_review" | "approved" | "gap";
type Citation = { doc: string; loc: string; score: number };
type Question = {
  id: string;
  section: string;
  text: string;
  answer: string;
  confidence: number;
  status: Status;
  citations: Citation[];
};
type Questionnaire = {
  id: string;
  buyer: string;
  dueIn: string;
  dealValue: string;
  total: number;
  approved: number;
};

type Tab = "review" | "queue" | "library";

const QUEUE: Questionnaire[] = [
  { id: "q1", buyer: "Northwind Health", dueIn: "2 days", dealValue: "$84k ARR", total: 15, approved: 9 },
  { id: "q2", buyer: "Halcyon Logistics", dueIn: "6 days", dealValue: "$35k ARR", total: 22, approved: 0 },
  { id: "q3", buyer: "Meridian Bank (Vendor Risk)", dueIn: "11 days", dealValue: "$121k ARR", total: 45, approved: 12 },
];

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "a1",
    section: "Encryption",
    text: "Is customer data encrypted at rest and in transit? Specify algorithms.",
    answer: "Yes. Data at rest is encrypted with AES-256 via our cloud provider's managed keys. In transit, TLS 1.3 is enforced for all endpoints.",
    confidence: 0.96,
    status: "needs_review",
    citations: [
      { doc: "Information Security Policy v4.2", loc: "§6.1 Cryptography", score: 0.95 },
      { doc: "SOC 2 Type II (2025)", loc: "§CC6.7", score: 0.88 }
    ]
  },
  {
    id: "a2",
    section: "Access Control",
    text: "Do you enforce MFA for all administrative access to production systems?",
    answer: "Yes. MFA is required for all personnel accessing production infrastructure, enforced via identity provider policies.",
    confidence: 0.91,
    status: "needs_review",
    citations: [{ doc: "Access Control Standard", loc: "§3.4", score: 0.91 }]
  },
  {
    id: "a3",
    section: "Incident Response",
    text: "What is your contractual notification window for a confirmed data breach?",
    answer: "Our incident response plan commits to notifying affected customers without undue delay, and no later than 72 hours after confirmation.",
    confidence: 0.84,
    status: "needs_review",
    citations: [{ doc: "Incident Response Plan", loc: "§5 Communications", score: 0.84 }]
  },
  {
    id: "a4",
    section: "Business Continuity",
    text: "Provide your RTO and RPO for the production database.",
    answer: "",
    confidence: 0.22,
    status: "gap",
    citations: []
  },
  {
    id: "a5",
    section: "Vendor Management",
    text: "Do you perform annual security reviews of critical subprocessors?",
    answer: "Yes. Critical subprocessors are reviewed annually against our vendor risk management framework, requiring SOC 2 or equivalent.",
    confidence: 0.89,
    status: "approved",
    citations: [{ doc: "Vendor Risk Standard", loc: "§2.2", score: 0.87 }]
  }
];

const pct = (n: number) => `${Math.round(n * 100)}%`;

function ConfidenceBadge({ c }: { c: number }) {
  if (c >= 0.85) return <span className="text-emerald-300 bg-emerald-400/10 ring-1 ring-emerald-400/20 px-2 py-0.5 rounded text-xs font-medium">Ready</span>;
  if (c >= 0.6) return <span className="text-amber-300 bg-amber-400/10 ring-1 ring-amber-400/20 px-2 py-0.5 rounded text-xs font-medium">Check</span>;
  return <span className="text-rose-300 bg-rose-400/10 ring-1 ring-rose-400/20 px-2 py-0.5 rounded text-xs font-medium">No evidence</span>;
}

function Bar({ value, className = "bg-indigo-400" }: { value: number; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div className={`h-full rounded-full ${className}`} style={{ width: pct(value) }} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-[#101112] p-3.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("review");
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [openId, setOpenId] = useState<string | null>("a1");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const counts = useMemo(() => {
    const approved = questions.filter((q) => q.status === "approved").length;
    const review = questions.filter((q) => q.status === "needs_review").length;
    const gaps = questions.filter((q) => q.status === "gap").length;
    return { approved, review, gaps, total: questions.length };
  }, [questions]);

  const canExport = counts.review === 0 && counts.gaps === 0;
  const libraryCount = 214 + counts.approved;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function approve(id: string) {
    setQuestions((qps) =>
      qps.map((q) => (q.id === id ? { ...q, answer: drafts[id] ?? q.answer, status: "approved", confidence: 1 } : q))
    );
    setOpenId(null);
    flash("Approved and saved to your answer library");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "review", label: "Review" },
    { id: "queue", label: "Questionnaires" },
    { id: "library", label: "Library" },
  ];

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-200 antialiased">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#08090a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/20">
              A
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-50 leading-tight">Attestly</p>
              <p className="text-[11px] text-zinc-500">Acme Cloud, Inc.</p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-400/10 px-2.5 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/20">
            Scale plan
          </span>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-4 pb-2" aria-label="Sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                tab === t.id ? "bg-white/[0.08] text-zinc-50 font-medium" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-20 pt-5">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Summary Stats">
          <Stat label="Answered" value={`${counts.approved}/${counts.total}`} sub="progress" />
          <Stat label="Needs review" value={String(counts.review)} sub="human sign-off" />
          <Stat label="Evidence gaps" value={String(counts.gaps)} sub="upload or assign" />
          <Stat label="Library" value={String(libraryCount)} sub="approved answers" />
        </section>

        <section className="rounded-lg border border-white/[0.07] bg-[#101112] p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div>
              <span className="text-zinc-300 text-sm">9 of 15</span>
              <div className="mt-1.5 w-44">
                <Bar value={9 / 15} />
              </div>
            </div>
            <p className="text-xs text-zinc-500">Resets Nov 1. Command plan raised limits.</p>
          </div>
        </section>

        {tab === "review" && (
          <section aria-label="Review Answers">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h1 className="text-base font-semibold text-zinc-50">Northwind Health</h1>
                <p className="text-xs text-zinc-500">Security Questionnaire • Due in 2 days • $84k ARR</p>
              </div>
              <button
                disabled={!canExport}
                onClick={() => flash("Export started")}
                className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-500"
              >
                Export .xlsx
              </button>
            </div>
            {!canExport && (
              <p className="mb-3 text-xs text-zinc-500">
                Export unlocks when every answer is approved. ({counts.review} review to go)
              </p>
            )}

            <ul className="space-y-2">
              {questions.map((q) => {
                const isOp = openId === q.id;
                return (
                  <li key={q.id} className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#101112]">
                    <button
                      onClick={() => setOpenId(isOp ? null : q.id)}
                      className="flex w-full items-start gap-3 p-3.5 text-left focus-visible:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500">{q.section}</p>
                        <p className="mt-0.5 text-sm font-semibold tracking-tight text-zinc-100">{q.text}</p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
