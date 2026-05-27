"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Browse-mode shortcuts. Two-letter "g X" sequences plus single-key
 *  utilities. Skipped when the user is typing in an input or contenteditable. */
const GOTO_MAP: Record<string, string> = {
  d: "/dashboard",
  c: "/customers",
  i: "/inbox",
  p: "/payments",
  f: "/forecast",
  r: "/reports",
  t: "/team",
  s: "/settings",
  b: "/billing",
  m: "/communications",
};

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function focusRow(direction: 1 | -1) {
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>("[data-row]"),
  ).filter((el) => el.offsetParent !== null);
  if (rows.length === 0) return;
  const current = document.activeElement as HTMLElement | null;
  const currentIdx = current ? rows.indexOf(current) : -1;
  let next = currentIdx + direction;
  if (next < 0) next = 0;
  if (next >= rows.length) next = rows.length - 1;
  const target = rows[next];
  target.focus({ preventScroll: false });
  target.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

export function GlobalHotkeys() {
  const router = useRouter();
  const awaitingGoto = useRef<{ until: number } | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Two-key "g X" jump
      if (awaitingGoto.current && Date.now() < awaitingGoto.current.until) {
        const target = GOTO_MAP[e.key.toLowerCase()];
        awaitingGoto.current = null;
        if (target) {
          e.preventDefault();
          router.push(target);
          return;
        }
      }
      if (e.key === "g") {
        e.preventDefault();
        awaitingGoto.current = { until: Date.now() + 1200 };
        return;
      }

      // Single-key actions
      if (e.key === "r") {
        e.preventDefault();
        router.refresh();
        return;
      }
      if (e.key === "j") {
        e.preventDefault();
        focusRow(1);
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        focusRow(-1);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
