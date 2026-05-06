import { Inbox, Pause } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime, truncate } from "@/lib/inboxFormat";
import type {
  SmsConversationRow,
  SmsMessageRow,
} from "@/lib/server/db/schema";

export type InboxListEntry = {
  conversation: SmsConversationRow;
  lastMessage: SmsMessageRow | null;
};

export function InboxList({ entries }: { entries: InboxListEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
        <Inbox className="mx-auto h-8 w-8 text-slate-400" aria-hidden />
        <h2 className="mt-3 text-sm font-semibold">No conversations yet</h2>
        <p className="mt-1 text-sm text-slate-500">
          Once a customer replies to a Fast-Pay text, the thread shows up here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {entries.map(({ conversation, lastMessage }) => {
        const inboundLatest = lastMessage?.direction === "inbound";
        const paused = conversation.autopilotPaused === 1;
        return (
          <Link
            key={conversation.id}
            href={`/inbox/${conversation.id}`}
            className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`truncate text-sm font-medium ${
                    inboundLatest ? "text-slate-900" : "text-slate-700"
                  }`}
                >
                  {conversation.customerName ?? conversation.customerPhone}
                </span>
                {paused ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
                    title="Autopilot paused on this thread"
                  >
                    <Pause className="h-2.5 w-2.5" aria-hidden />
                    paused
                  </span>
                ) : null}
                {inboundLatest ? (
                  <span
                    className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"
                    aria-hidden
                    title="Latest message inbound"
                  />
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {lastMessage
                  ? `${lastMessage.direction === "inbound" ? "" : "You: "}${truncate(lastMessage.body)}`
                  : "(no messages yet)"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
