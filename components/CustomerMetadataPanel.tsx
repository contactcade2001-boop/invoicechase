"use client";

import { useState, useTransition } from "react";
import {
  AlarmClockOff,
  Bell,
  BellOff,
  Plus,
  Save,
  Tag,
  X,
} from "lucide-react";

type Props = {
  customerId: string;
  initialNote: string | null;
  initialSnoozedUntil: number | null;
  initialTags: string[];
};

const SUGGESTED_TAGS = [
  "VIP",
  "Watchlist",
  "Bad debt risk",
  "Slow payer",
  "Repeat customer",
];

export function CustomerMetadataPanel({
  customerId,
  initialNote,
  initialSnoozedUntil,
  initialTags,
}: Props) {
  const [note, setNote] = useState(initialNote ?? "");
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(
    initialSnoozedUntil,
  );
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  async function save(patch: {
    note?: string | null;
    snoozeDays?: number | null;
    tags?: string[];
  }) {
    startTransition(async () => {
      const res = await fetch("/api/customer-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, ...patch }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          metadata: { snoozedUntil: number | null; tags: string[] };
        };
        setSnoozedUntil(data.metadata.snoozedUntil);
        setTags(data.metadata.tags);
        setSaved("Saved");
        setTimeout(() => setSaved(null), 1500);
      } else {
        setSaved("Failed");
      }
    });
  }

  function addTag(t: string) {
    const clean = t.trim();
    if (!clean || tags.includes(clean)) return;
    const next = [...tags, clean];
    setTags(next);
    setNewTag("");
    void save({ tags: next });
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    void save({ tags: next });
  }

  const snoozedActive = !!(snoozedUntil && snoozedUntil > Date.now());
  const snoozedDaysLeft = snoozedActive
    ? Math.ceil(((snoozedUntil ?? 0) - Date.now()) / 86_400_000)
    : 0;

  return (
    <section className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          Customer
        </h3>
        {saved ? (
          <span className="text-[11px] font-semibold text-emerald-600">
            {saved}
          </span>
        ) : pending ? (
          <span className="text-[11px] text-stone-400">Saving…</span>
        ) : null}
      </div>

      {/* Tags */}
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
          <Tag className="h-3 w-3" /> Tags
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700 ring-1 ring-inset ring-orange-200"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="text-orange-500 transition hover:text-orange-900"
                aria-label={`Remove ${t}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(newTag);
              }
            }}
            placeholder="+ add tag"
            className="w-24 rounded-full border-0 bg-stone-100 px-2.5 py-0.5 text-[11px] text-stone-700 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-300"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {SUGGESTED_TAGS.filter((s) => !tags.includes(s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-2 py-0.5 text-[10px] text-stone-500 ring-1 ring-stone-200 transition hover:bg-stone-100 hover:text-stone-700"
            >
              <Plus className="h-2 w-2" />
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Snooze */}
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
          <BellOff className="h-3 w-3" /> Autopilot snooze
        </p>
        {snoozedActive ? (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Paused for {snoozedDaysLeft}d.</strong> No SMS, no
              email, no Claude replies.
            </p>
            <button
              type="button"
              onClick={() => save({ snoozeDays: null })}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-300 transition hover:bg-amber-100"
            >
              <AlarmClockOff className="h-3 w-3" /> Resume
            </button>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => save({ snoozeDays: d })}
                className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700 transition hover:bg-stone-200"
              >
                <Bell className="h-3 w-3" />
                Pause {d}d
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          Private notes
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Notes only you can see — preferred contact times, payment history, anything."
          className="mt-2 block w-full rounded-md border-0 bg-stone-50 px-3 py-2 text-sm text-stone-900 ring-1 ring-inset ring-stone-200 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-stone-900"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => save({ note: note.trim() || null })}
            className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-stone-800"
          >
            <Save className="h-3 w-3" />
            Save note
          </button>
        </div>
      </div>
    </section>
  );
}
