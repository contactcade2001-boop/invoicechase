import "server-only";

// Thin wrapper. Always logs to the server console; additionally forwards to
// Sentry when SENTRY_DSN is set so dev / tests don't need a Sentry account.
export function captureException(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.error("[error]", err, context ?? {});
  if (!process.env.SENTRY_DSN) return;
  // Lazy import so the bundle stays slim when Sentry isn't configured.
  import("@sentry/nextjs")
    .then((Sentry) => {
      try {
        Sentry.captureException(err, context ? { extra: context } : undefined);
      } catch {
        /* swallow — observability must never throw */
      }
    })
    .catch(() => {
      /* swallow — observability must never throw */
    });
}

export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.log("[event]", message, context ?? {});
  if (!process.env.SENTRY_DSN) return;
  import("@sentry/nextjs")
    .then((Sentry) => {
      try {
        Sentry.captureMessage(
          message,
          context ? { level: "info", extra: context } : undefined,
        );
      } catch {
        /* swallow */
      }
    })
    .catch(() => {
      /* swallow */
    });
}
