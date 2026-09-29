import React from "react";
import { Navigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { fetchOnboardingStatus } from "../../lib/onboarding-api";
import { CreoLoadingScreen } from "../ui/CreoLoadingScreen";
import type { OnboardingStatus } from "../../types/api";

interface RequireOnboardingStageProps {
  children?: React.ReactNode;
}

/**
 * Route guard for Onboarding routes (/onboarding, /onboarding/*).
 * Ensures that clients who have ALREADY completed onboarding cannot be stuck on onboarding screens,
 * redirecting them directly to /portal.
 */
export function RequireOnboardingStage({ children }: RequireOnboardingStageProps) {
  const { user, loading: authLoading } = useAuth();
  const isClient = user?.role === "client";

  const {
    data: status,
    isLoading: statusLoading,
  } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding-status", user?.id],
    queryFn: () => fetchOnboardingStatus(user?.id || ""),
    enabled: !!user?.id && isClient,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (authLoading || (isClient && statusLoading)) {
    return <CreoLoadingScreen label="Checking onboarding stage..." />;
  }

  // If already complete, forward to portal
  const isComplete = Boolean(status?.is_complete || (status && status.stage >= 8) || status?.checklist?.onboarding_completed);
  if (isClient && isComplete) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}

export default RequireOnboardingStage;
