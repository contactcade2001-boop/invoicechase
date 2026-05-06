// Server-side Sentry init. Only runs when SENTRY_DSN is set, otherwise no-ops
// so dev (and tests) don't need a Sentry account.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    environment: process.env.NODE_ENV,
  });
}

export const onRequestError = async (
  err: unknown,
  request: Parameters<typeof globalThis.fetch>[0] | undefined,
  context: Record<string, unknown>,
) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request as never, context as never);
};
