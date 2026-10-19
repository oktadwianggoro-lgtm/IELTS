import { requireUser } from "@/lib/auth/rbac";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  await requireUser();
  return <OnboardingWizard />;
}
