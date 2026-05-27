import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getOnboardingState } from "@/lib/server/db/onboarding";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.organizationId) redirect("/login");
  const state = getOnboardingState(user.organizationId);
  if (state?.completed) redirect("/dashboard");
  return (
    <OnboardingWizard
      initialBusinessName={state?.businessName ?? ""}
      initialIndustry={state?.industry ?? ""}
      initialAccentColor={state?.accentColor ?? "#f97316"}
      initialIntegration={state?.preferredIntegration ?? ""}
    />
  );
}
