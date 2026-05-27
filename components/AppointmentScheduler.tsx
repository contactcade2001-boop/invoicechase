"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CalendarPlus, Trash2 } from "lucide-react";

type Appt = {
  id: number;
  scheduledFor: number;
  description: string | null;
  reminderDaysBefore: number;
  reminderSentAt: number | null;
};

type Props = {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  initialAppointments: Appt[];
};

export function AppointmentScheduler({
  customerId,
  customerName,
  customerPhone,
  initialAppointments,
}: Props) {
  const router = useRouter();
  const [appts, setAppts] = useState(initialAppointments);
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [reminderDays, setReminderDays] = useState(3);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function create() {
    if (!date) {
      setErr("Pick a date.");
      return;
    }
    setErr(null);
    start(async () => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerName,
          customerPhone,
          scheduledForIso: new Date(date).toISOString(),
          description: desc,
          reminderDaysBefore: reminderDays,
        }),
      });
      if (!res.ok) {
        setErr("Could not save.");
        return;
      }
      const { appointment } = (await res.json()) as { appointment: Appt };
      setAppts([...appts, appointment]);
      setDate("");
      setDesc("");
      router.refresh();
    });
  }

  function cancel(id: number) {
    start(async () => {
      await fetch("/api/appointments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setAppts(appts.filter((a) => a.id !== id));
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-orange-600" aria-hidden />
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          Upcoming visits
        </h3>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Pre-bill reminders fire automatically a few days before each visit.
      </p>
      {appts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {appts.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-2 rounded-md bg-stone-50 px-3 py-2 text-xs ring-1 ring-inset ring-stone-200"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-900">
                  {new Date(a.scheduledFor).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                {a.description ? (
                  <p className="text-stone-600">{a.description}</p>
                ) : null}
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-stone-400">
                  {a.reminderSentAt
                    ? "Reminder sent"
                    : `Reminder ${a.reminderDaysBefore}d before`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => cancel(a.id)}
                disabled={pending}
                className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
                aria-label="Cancel"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 grid grid-cols-1 gap-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            When
          </span>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 px-2.5 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Description (optional)
          </span>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="HVAC tune-up"
            className="mt-1 block w-full rounded-md border-0 px-2.5 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Reminder days before
          </span>
          <input
            type="number"
            value={reminderDays}
            min={0}
            max={14}
            step={1}
            onChange={(e) => setReminderDays(parseInt(e.target.value) || 0)}
            className="mt-1 block w-24 rounded-md border-0 px-2.5 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-stone-900"
          />
        </label>
        {err ? <p className="text-xs text-red-700">{err}</p> : null}
        <button
          type="button"
          onClick={create}
          disabled={pending}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50"
        >
          <CalendarPlus className="h-3 w-3" />
          Schedule visit
        </button>
      </div>
    </section>
  );
}
