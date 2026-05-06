export function formatRelativeTime(ms: number, now = Date.now()): string {
  const diff = now - ms;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}
