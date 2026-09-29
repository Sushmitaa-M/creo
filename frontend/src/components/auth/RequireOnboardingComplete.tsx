import React from "react";
import { Navigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import { fetchOnboardingStatus } from "../../lib/onboarding-api";
import { CreoLoadingScreen } from "../ui/CreoLoadingScreen";
import type { OnboardingStatus } from "../../types/api";

interface RequireOnboardingCompleteProps {
  children?: React.ReactNode;
}

/**
 * Route guard for Client Portal routes (/portal/*).
 * Enforces that clients must have fully completed all onboarding prerequisites:
 * Registered → Verified → Terms Accepted → Subscription Active → Questionnaire Submitted → Brand DNA Generated → Pod Assigned → Calendar Generated → Complete.
 * 
 * Non-client users (admins, team members) bypass this check to allow workspace review.
 */
export function RequireOnboardingComplete({ children }: RequireOnboardingCompleteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  const isClient = user?.role === "client";

  const {
    data: status,
    isLoading: statusLoading,
    isError,
  } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding-status", user?.id],
    queryFn: () => fetchOnboardingStatus(user?.id || ""),
    enabled: !!user?.id && isClient,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (authLoading || (isClient && statusLoading)) {
    return <CreoLoadingScreen label="Verifying onboarding status..." />;
  }

  // Not logged in is handled by parent ProtectedRoute, but as safety fallback:
  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectedFrom=${returnUrl}`} replace />;
  }

  // Non-client staff/admin roles bypass onboarding gate
  if (!isClient) {
    return <>{children}</>;
  }

  // If query failed to reach onboarding service, allow retry or error boundary
  if (isError || !status) {
    return (
      <div className="min-h-screen bg-[#0B111C] text-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#161F2D] border border-[#2A3446] text-center space-y-4">
          <p className="text-sm text-rose-400 font-semibold">Unable to verify onboarding status.</p>
          <p className="text-xs text-[#97A0B3]">Please reload your browser or try again in a few moments.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#BCCCE6] text-[#0B111C] font-bold text-xs hover:bg-white transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Check if onboarding is completely finished (stage 8 or is_complete flag)
  const isComplete = Boolean(status.is_complete || status.stage >= 8 || status.checklist?.onboarding_completed);

  if (isComplete) {
    return <>{children}</>;
  }

  // Client has NOT finished onboarding -> redirect strictly to their required step
  // Per requirement 4: If client has paid but NOT completed Questionnaire Sections A-E, redirect to /onboarding/questionnaire
  if (status.stage === 3 || (status.checklist?.subscription_active && !status.checklist?.questionnaire_submitted)) {
    return <Navigate to="/onboarding/questionnaire" replace />;
  }

  // Brand DNA / Pod / Calendar generation in progress
  if (status.stage >= 4 && status.stage < 8) {
    return <Navigate to="/onboarding/questionnaire?step=review" replace />;
  }

  // Otherwise, route to their exact unfinished stage
  const targetRoute = status.next_route || `/onboarding?step=${Math.max(1, status.stage + 1)}`;
  return <Navigate to={targetRoute} replace />;
}

export default RequireOnboardingComplete;
