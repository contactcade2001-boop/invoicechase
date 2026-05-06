import { CheckCircle2 } from "lucide-react";

export function ConnectionStatus({ companyName }: { companyName: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-2 text-xs ring-1 ring-slate-200">
      <span className="inline-flex items-center gap-1.5 text-slate-600">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
        Connected to <span className="font-semibold text-slate-900">{companyName}</span>
      </span>
      <form action="/api/qbo/disconnect" method="post">
        <button
          type="submit"
          className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
        >
          Disconnect
        </button>
      </form>
    </div>
  );
}
