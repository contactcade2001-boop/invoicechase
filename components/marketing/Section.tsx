import type { ElementType, ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Render as a different element (e.g. <header>, <article>). */
  as?: ElementType;
  /** Subtle alt-surface for visual rhythm (off-white vs page bg). */
  tone?: "default" | "muted" | "ink";
  /** Tighter vertical padding for callout / quote / divider sections. */
  size?: "default" | "tight";
  className?: string;
};

/**
 * Vertical-rhythm wrapper. Owns the section's own background tone +
 * py spacing so pages compose like Lego — no ad-hoc py-XX classes.
 */
export function Section({
  children,
  as: Tag = "section",
  tone = "default",
  size = "default",
  className = "",
}: Props) {
  const bg =
    tone === "ink"
      ? "bg-mk-ink-950 text-white"
      : tone === "muted"
        ? "bg-mk-ink-50"
        : "bg-mk-surface";
  const padding =
    size === "tight" ? "py-10 sm:py-16" : "py-16 sm:py-28";
  return (
    <Tag className={`${bg} ${padding} ${className}`}>{children}</Tag>
  );
}
