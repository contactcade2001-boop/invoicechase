import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { onboardingState } from "./schema";

export type OnboardingPayload = {
  organizationId: number;
  businessName?: string | null;
  industry?: string | null;
  accentColor?: string | null;
  preferredIntegration?: string | null;
  completed?: boolean;
};

export type OnboardingRow = {
  organizationId: number;
  completed: number;
  businessName: string | null;
  industry: string | null;
  accentColor: string | null;
  preferredIntegration: string | null;
  updatedAt: number;
};

export function getOnboardingState(orgId: number): OnboardingRow | null {
  const db = getDb();
  return (
    db
      .select()
      .from(onboardingState)
      .where(eq(onboardingState.organizationId, orgId))
      .get() ?? null
  );
}

export function upsertOnboarding(input: OnboardingPayload): OnboardingRow {
  const db = getDb();
  const existing = getOnboardingState(input.organizationId);
  const now = Date.now();
  const merged = {
    organizationId: input.organizationId,
    completed: input.completed ? 1 : (existing?.completed ?? 0),
    businessName:
      input.businessName !== undefined
        ? input.businessName
        : (existing?.businessName ?? null),
    industry:
      input.industry !== undefined
        ? input.industry
        : (existing?.industry ?? null),
    accentColor:
      input.accentColor !== undefined
        ? input.accentColor
        : (existing?.accentColor ?? null),
    preferredIntegration:
      input.preferredIntegration !== undefined
        ? input.preferredIntegration
        : (existing?.preferredIntegration ?? null),
    updatedAt: now,
  };
  db.insert(onboardingState)
    .values(merged)
    .onConflictDoUpdate({
      target: onboardingState.organizationId,
      set: {
        completed: merged.completed,
        businessName: merged.businessName,
        industry: merged.industry,
        accentColor: merged.accentColor,
        preferredIntegration: merged.preferredIntegration,
        updatedAt: now,
      },
    })
    .run();
  return merged;
}

export function isOnboarded(orgId: number): boolean {
  return (getOnboardingState(orgId)?.completed ?? 0) === 1;
}
