import "server-only";

const ENV_KEY = "ADMIN_EMAILS";

function adminEmails(): Set<string> {
  const raw = process.env[ENV_KEY] ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().has(email.trim().toLowerCase());
}
