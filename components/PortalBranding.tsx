"use client";

import { useState, useTransition } from "react";
import { savePortalBranding } from "@/app/actions/org";

export function PortalBranding({
  initial,
  baseUrl,
}: {
  initial: { slug: string; accentColor: string; logoUrl: string };
  baseUrl: string;
}) {
  const [slug, setSlug] = useState(initial.slug);
  const [color, setColor] = useState(initial.accentColor);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onSave() {
    setError(null);
    start(async () => {
      const r = await savePortalBranding({
        slug,
        accentColor: color,
        logoUrl,
      });
      if (r.ok) {
        setSavedAt(Date.now());
      } else {
        const messages: Record<string, string> = {
          invalid_slug:
            "Slug must be 3-30 characters: lowercase letters, numbers, dashes (no leading/trailing dash).",
          slug_taken: "That slug is already in use by another organization.",
          invalid_color: "Color must be a #RRGGBB hex value.",
          invalid_logo_url: "Logo URL must be a valid https:// URL.",
          forbidden: "Only the owner can change branding.",
        };
        setError(messages[r.error] ?? r.error);
      }
    });
  }

  const portalUrl = slug ? `${baseUrl}/p/${slug}` : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Portal slug
          </span>
          <p className="text-xs text-stone-500">
            Your customers will see this URL when paying or signing in.
          </p>
          <div className="mt-1 flex rounded-md shadow-sm ring-1 ring-inset ring-stone-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900">
            <span className="inline-flex items-center rounded-l-md bg-white px-3 text-xs text-stone-500">
              {baseUrl.replace(/^https?:\/\//, "")}/p/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              maxLength={30}
              placeholder="acme-hvac"
              className="block w-full rounded-r-md border-0 bg-transparent px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">
            Accent color
          </span>
          <p className="text-xs text-stone-500">Used on buttons + headings.</p>
          <div className="mt-1 flex rounded-md shadow-sm ring-1 ring-inset ring-stone-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900">
            <input
              type="color"
              value={color || "#0f172a"}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-10 cursor-pointer rounded-l-md border-0 bg-transparent p-0"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value.trim())}
              maxLength={7}
              placeholder="#0f172a"
              className="block w-28 rounded-r-md border-0 bg-transparent px-2 py-2 font-mono text-xs focus:outline-none"
            />
          </div>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Logo URL</span>
        <p className="text-xs text-stone-500">
          Direct https:// URL to your logo image (PNG/SVG/JPG).
        </p>
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value.trim())}
          placeholder="https://yourcompany.com/logo.png"
          maxLength={400}
          className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-300 focus:ring-2 focus:ring-inset focus:ring-slate-900"
        />
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo preview"
            className="mt-2 h-12 w-auto rounded ring-1 ring-stone-200"
          />
        ) : null}
      </label>
      {portalUrl ? (
        <p className="text-xs text-stone-500">
          Customers can sign in at:{" "}
          <code className="font-mono text-stone-700">{portalUrl}</code>
        </p>
      ) : null}
      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {pending ? "Saving…" : "Save branding"}
        </button>
        {savedAt && Date.now() - savedAt < 4000 ? (
          <span className="text-sm text-emerald-700">Saved</span>
        ) : null}
      </div>
    </div>
  );
}
