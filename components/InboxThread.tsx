"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bot, Send, User } from "lucide-react";
import {
  sendManualReply,
  setAutopilotForConversation,
} from "@/app/actions/inbox";
import { formatRelativeTime } from "@/lib/inboxFormat";
import type {
  SmsConversationRow,
  SmsMessageRow,
} from "@/lib/server/db/schema";

export function InboxThread({
  conversation,
  messages,
}: {
  conversation: SmsConversationRow;
  messages: SmsMessageRow[];
}) {
  const [paused, setPaused] = useState(conversation.autopilotPaused === 1);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingPause, startPause] = useTransition();
  const [pendingSend, startSend] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages.length]);

  function togglePause() {
    setError(null);
    const next = !paused;
    setPaused(next);
    startPause(async () => {
      const r = await setAutopilotForConversation({
        conversationId: conversation.id,
        paused: next,
      });
      if (!r.ok) {
        setPaused(!next);
        setError(r.error);
      }
    });
  }

  function onSend() {
    setError(null);
    const text = body.trim();
    if (!text) return;
    startSend(async () => {
      const r = await sendManualReply({
        conversationId: conversation.id,
        body: text,
      });
      if (r.ok) {
        setBody("");
        setPaused(true);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-slate-900">
            {conversation.customerName ?? conversation.customerPhone}
          </h2>
          <p className="text-xs text-slate-500">
            {conversation.customerPhone}
          </p>
        </div>
        <button
          type="button"
          onClick={togglePause}
          disabled={pendingPause}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
            paused
              ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100"
          } disabled:opacity-60`}
        >
          {paused ? "Autopilot paused" : "Autopilot on"}
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">
            No messages yet.
          </p>
        ) : null}
        {messages.map((m) => {
          const inbound = m.direction === "inbound";
          const isAutopilot = m.autopilot === 1;
          return (
            <div
              key={m.id}
              className={`flex ${inbound ? "justify-start" : "justify-end"}`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                    inbound ? "text-slate-500" : "text-slate-400"
                  } ${inbound ? "" : "justify-end"}`}
                >
                  {inbound ? (
                    <>
                      <User className="h-3 w-3" aria-hidden />
                      Customer
                    </>
                  ) : isAutopilot ? (
                    <>
                      <Bot className="h-3 w-3" aria-hidden />
                      Autopilot
                    </>
                  ) : (
                    <>You</>
                  )}
                  <span className="font-normal normal-case tracking-normal text-slate-400">
                    · {formatRelativeTime(m.createdAt)}
                  </span>
                </div>
                <div
                  className={`mt-1 whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                    inbound
                      ? "bg-slate-100 text-slate-900"
                      : isAutopilot
                        ? "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200"
                        : "bg-slate-900 text-white"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 px-5 py-3">
        {error ? (
          <div className="mb-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={1600}
            placeholder="Type a reply…"
            className="flex-1 resize-none rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={pendingSend || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Send className="h-4 w-4" aria-hidden />
            {pendingSend ? "Sending…" : "Send"}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Sending pauses autopilot on this thread automatically.
        </p>
      </div>
    </div>
  );
}
