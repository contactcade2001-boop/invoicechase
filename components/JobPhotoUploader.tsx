"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";

type Props = {
  customerId: string;
  initialPhotos: { id: number; caption: string | null; createdAt: number }[];
};

export function JobPhotoUploader({ customerId, initialPhotos }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, start] = useTransition();

  async function uploadOne(file: File) {
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("customerId", customerId);
    const res = await fetch("/api/job-photos", { method: "POST", body: fd });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "upload_failed");
    }
    const { id } = (await res.json()) as { id: number };
    setPhotos((p) => [
      ...p,
      { id, caption: null, createdAt: Date.now() },
    ]);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const f of files) {
        await uploadOne(f);
      }
      router.refresh();
    } catch (e) {
      const code = (e as Error).message;
      setErr(
        code === "too_large"
          ? "Each photo must be under 10MB."
          : code === "unsupported_mime"
            ? "JPEG / PNG / WebP / HEIC only."
            : "Upload failed.",
      );
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          Job photos
        </h3>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="group inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Camera className="h-3 w-3 transition group-hover:scale-110" />
          )}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          className="hidden"
        />
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Before/after shots, completion photos, signed invoices. Useful for
        disputes and small claims.
      </p>
      {err ? <p className="mt-2 text-xs text-red-700">{err}</p> : null}
      {photos.length === 0 ? (
        <p className="mt-4 rounded-md bg-white px-4 py-3 text-center text-xs text-stone-500 ring-1 ring-inset ring-stone-200">
          No photos yet. Add some when the next job wraps.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <a
              key={p.id}
              href={`/api/job-photos/${p.id}`}
              target="_blank"
              rel="noopener"
              className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200"
            >
              <img
                src={`/api/job-photos/${p.id}`}
                alt={p.caption ?? "Job photo"}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}
      {pending ? null : null}
    </section>
  );
}
