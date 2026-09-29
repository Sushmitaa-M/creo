import { useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context";
import {
  Lock,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  MessageSquare,
  Mail,
  Send,
  X,
  LifeBuoy,
  PhoneCall,
} from "lucide-react";
import { request } from "../../lib/http";
import { fetchOnboardingStatus } from "../../lib/onboarding-api";
import { PlanBargainCallModal } from "./PlanBargainCallModal";
import type { OnboardingStatus } from "../../types/api";

interface SubscriptionLockedStateProps {
  title?: string;
  description?: string;
}

export function SubscriptionLockedState({
  title,
  description,
}: SubscriptionLockedStateProps) {
  const { user } = useAuth();
  const isClient = user?.role === "client";

  const { data: dashboard } = useQuery({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<any>("/api/v1/portal/dashboard"),
    enabled: !!user?.id,
  });

  const { data: onboardingStatus } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding-status", user?.id],
    queryFn: () => fetchOnboardingStatus(user?.id || ""),
    enabled: !!user?.id && isClient,
  });

  const stage = onboardingStatus?.stage ?? dashboard?.onboarding_stage ?? user?.onboarding_stage ?? 1;
  const isPaid = !!(onboardingStatus?.checklist?.subscription_active || dashboard?.active_plan);
  const isQuestionnaireDone = !!onboardingStatus?.checklist?.questionnaire_submitted;
  const isComplete = !!(onboardingStatus?.is_complete || stage >= 8 || onboardingStatus?.checklist?.onboarding_completed);

  // Compute exact resume destination and copy
  let resumeRoute = "/onboarding";
  let resumeLabel = "Resume Account Setup";
  let dynamicTitle = title || "Production Workspace Locked";
  let dynamicDescription = description || "An active creative retainer and onboarding setup are required to access production deliverables, scheduling, and pod execution.";
  let statusBadge = "Setup Incomplete";
  let statusBadgeColor = "bg-amber-500/15 text-amber-300 border-amber-500/30";

  if (!isPaid) {
    resumeRoute = "/onboarding?step=3";
    resumeLabel = "Choose Production Plan (Step 3)";
    statusBadge = "Retainer Subscription Required";
    statusBadgeColor = "bg-amber-500/15 text-amber-300 border-amber-500/30";
    if (!description) {
      dynamicDescription = "An active creative retainer is required to activate your dedicated creative pod. Choose a plan or book a negotiation call with our leadership to set custom rates.";
    }
  } else if (!isQuestionnaireDone || stage === 3) {
    resumeRoute = "/onboarding/questionnaire";
    resumeLabel = "Complete Brand Questionnaire (Step 4) →";
    statusBadge = "Payment Received · Questionnaire Pending";
    statusBadgeColor = "bg-blue-500/15 text-blue-300 border-blue-500/30";
    if (!title) dynamicTitle = "Complete Your Brand Questionnaire";
    if (!description) {
      dynamicDescription = "Your payment has been received! Please complete your brand questionnaire so our creative pod can synthesize your Brand DNA and generate your 30-day production calendar.";
    }
  } else if (stage >= 4 && !isComplete) {
    resumeRoute = "/onboarding?step=5";
    resumeLabel = "Finalize Workspace Activation (Step 5) →";
    statusBadge = "Activation in Progress · Pod Assignment";
    statusBadgeColor = "bg-purple-500/15 text-purple-300 border-purple-500/30";
    if (!title) dynamicTitle = "Finalize Workspace Activation";
    if (!description) {
      dynamicDescription = "Your Brand DNA and dedicated creative specialists are being provisioned. Review and finalize activation to launch your live content pipeline.";
    }
  }

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [bargainModalOpen, setBargainModalOpen] = useState(false);
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryMsg, setInquiryMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  async function handleSendInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!inquiryMsg.trim()) return;
    setSending(true);
    try {
      await request("/api/v1/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: inquirySubject.trim() || "Account Assistance Request",
          description: inquiryMsg.trim(),
          priority: "medium",
        }),
      });
      setSentSuccess(true);
      setInquiryMsg("");
      setInquirySubject("");
    } catch {
      setSentSuccess(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-[#2A3446] bg-[#161F2D] p-6 sm:p-10 text-center shadow-2xl">
        {/* Ambient Subtle Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-72 rounded-full bg-[#7FA0D6]/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center space-y-6">
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusBadgeColor} flex items-center gap-1.5`}>
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            <span>{statusBadge}</span>
          </div>

          {/* Lock Icon Badge */}
          <div className="relative flex size-18 items-center justify-center rounded-3xl bg-[#0B111C] border border-[#2A3446] text-[#7FA0D6] shadow-xl">
            <Lock className="size-8" />
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-[#BCCCE6] text-[#0B111C] shadow-sm border-2 border-[#161F2D]">
              <ShieldAlert className="size-3.5" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2 max-w-lg">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {dynamicTitle}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#97A0B3] leading-relaxed">
              {dynamicDescription}
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-1">
            <div className="rounded-2xl border border-[#2A3446] bg-[#0B111C]/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="size-4 text-[#7FA0D6] shrink-0" />
                <span>Dedicated Squad</span>
              </div>
              <p className="text-[11px] text-[#97A0B3] mt-1 leading-normal">
                Direct creative specialists, editors, and lead producers dedicated to your brand.
              </p>
            </div>

            <div className="rounded-2xl border border-[#2A3446] bg-[#0B111C]/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="size-4 text-[#7FA0D6] shrink-0" />
                <span>Guaranteed Cadence</span>
              </div>
              <p className="text-[11px] text-[#97A0B3] mt-1 leading-normal">
                Monthly quotas of 9:16 video reels, carousel sets, and brand graphics.
              </p>
            </div>

            <div className="rounded-2xl border border-[#2A3446] bg-[#0B111C]/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <CheckCircle2 className="size-4 text-[#7FA0D6] shrink-0" />
                <span>Publishing Calendar</span>
              </div>
              <p className="text-[11px] text-[#97A0B3] mt-1 leading-normal">
                30-day auto-publishing schedule with instant review and sign-off docks.
              </p>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
            {/* Primary Action: Resume Setup */}
            <Link
              to={resumeRoute}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#BCCCE6] px-6 py-3 text-xs font-bold text-[#0B111C] shadow-md hover:bg-white transition-all cursor-pointer"
            >
              <Zap className="size-4 text-[#0B111C]" />
              <span>{resumeLabel}</span>
              <ArrowRight className="size-3.5" />
            </Link>

            {/* Negotiation & Bargain Button: Open PlanBargainCallModal */}
            <button
              type="button"
              onClick={() => setBargainModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#7FA0D6]/40 bg-[#7FA0D6]/10 px-5 py-3 text-xs font-bold text-[#7FA0D6] hover:bg-[#7FA0D6]/20 transition-all cursor-pointer shadow-sm"
            >
              <PhoneCall className="size-4" />
              <span>Call & Bargain / Custom Retainer</span>
            </button>

            {/* Support Concierge */}
            <button
              type="button"
              onClick={() => {
                setSentSuccess(false);
                setShowSupportModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#2A3446] bg-[#0B111C] px-5 py-3 text-xs font-bold text-[#97A0B3] hover:text-white hover:border-[#7FA0D6]/50 transition-all cursor-pointer shadow-sm"
            >
              <LifeBuoy className="size-4 text-[#7FA0D6]" />
              <span>Need help? Contact Support</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Bargain Call Modal */}
      <PlanBargainCallModal
        isOpen={bargainModalOpen}
        onClose={() => setBargainModalOpen(false)}
      />

      {/* Support Concierge Modal */}
      {showSupportModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#050810]/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#161F2D] p-6 sm:p-8 shadow-2xl border border-[#2A3446] animate-[zoomIn_0.2s_cubic-bezier(0.16,1,0.3,1)]">
              <button
                onClick={() => setShowSupportModal(false)}
                className="absolute top-4 right-4 size-8 rounded-full bg-[#0B111C] text-[#97A0B3] hover:bg-[#2A3446] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#2A3446]"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-[#0B111C] border border-[#2A3446] text-[#7FA0D6] flex items-center justify-center shrink-0">
                  <LifeBuoy className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    Contact Dedicated Support
                  </h3>
                  <p className="text-xs text-[#97A0B3]">
                    Our concierge team is available 24/7 to assist with your onboarding, plan, or custom questions.
                  </p>
                </div>
              </div>

              {/* Support Channels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                <a
                  href="https://wa.me/919941999415"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0B111C] border border-[#2A3446] text-white hover:border-[#7FA0D6]/60 transition-colors"
                >
                  <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-white">WhatsApp Concierge</p>
                    <p className="text-[10px] text-emerald-400 truncate">Instant Live Chat</p>
                  </div>
                </a>

                <a
                  href="mailto:concierge@creo.agency?subject=Account%20Assistance%20Inquiry"
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0B111C] border border-[#2A3446] text-white hover:border-[#7FA0D6]/60 transition-colors"
                >
                  <div className="size-8 rounded-xl bg-[#7FA0D6] text-[#0B111C] flex items-center justify-center shrink-0 shadow-xs font-bold">
                    <Mail className="size-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-white">Email Support</p>
                    <p className="text-[10px] text-[#7FA0D6] truncate">concierge@creo.agency</p>
                  </div>
                </a>
              </div>

              {/* Quick Inquiry Form */}
              {sentSuccess ? (
                <div className="p-5 rounded-2xl bg-[#0B111C] border border-[#2A3446] text-center space-y-2">
                  <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-lg font-bold">
                    ✓
                  </div>
                  <p className="text-sm font-bold text-white">Inquiry Received!</p>
                  <p className="text-xs text-[#97A0B3] leading-relaxed">
                    Your support inquiry ticket has been dispatched. Our account manager will respond shortly.
                  </p>

                  <div className="pt-2 flex justify-center gap-2">
                    <Link
                      to="/portal/support"
                      onClick={() => setShowSupportModal(false)}
                      className="px-4 py-2 rounded-xl bg-[#BCCCE6] text-[#0B111C] text-xs font-bold hover:bg-white transition-colors"
                    >
                      Go to Support Desk →
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowSupportModal(false)}
                      className="px-4 py-2 rounded-xl border border-[#2A3446] text-[#97A0B3] text-xs font-bold hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3 text-left">
                  <div className="border-t border-[#2A3446] pt-3">
                    <p className="text-xs font-bold text-white mb-2">Send an Account Inquiry Ticket</p>
                    <input
                      type="text"
                      placeholder="Subject (e.g. Question about payment or onboarding)"
                      value={inquirySubject}
                      onChange={(e) => setInquirySubject(e.target.value)}
                      className="w-full rounded-xl border border-[#2A3446] bg-[#0B111C] text-white placeholder-[#97A0B3]/50 px-3.5 py-2 text-xs font-medium focus:border-[#7FA0D6] focus:outline-none mb-2"
                    />
                    <textarea
                      rows={3}
                      placeholder="Describe how we can assist you with your workspace..."
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[#2A3446] bg-[#0B111C] text-white placeholder-[#97A0B3]/50 p-3 text-xs font-medium focus:border-[#7FA0D6] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <Link
                      to="/portal/support"
                      onClick={() => setShowSupportModal(false)}
                      className="text-xs font-semibold text-[#7FA0D6] hover:underline"
                    >
                      Open Support Desk →
                    </Link>

                    <button
                      type="submit"
                      disabled={sending || !inquiryMsg.trim()}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#BCCCE6] text-[#0B111C] text-xs font-bold hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <Send className="size-3.5" />
                      <span>{sending ? "Sending..." : "Submit Ticket"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
