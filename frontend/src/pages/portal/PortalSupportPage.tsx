import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Send,
  X,
  Phone,
  Calendar,
  Paperclip,
  Check,
  ChevronDown,
  ShieldCheck,
  Hash,
  ArrowRight,
  FileText,
  PhoneCall,
} from "lucide-react";
import { request } from "../../lib/http";
import { useAuth } from "../../lib/auth-context";
import { SubscriptionLockedState } from "../../components/portal/SubscriptionLockedState";
import type { TicketItem } from "../../types/api";

interface MessageEntry {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe?: boolean;
}

interface SupportTicketData {
  id: string;
  status: "in_progress" | "resolved" | "open";
  priority: "urgent" | "medium" | "high" | "low";
  priorityLabel: string;
  timeAgo: string;
  title: string;
  description: string;
  meta: string;
  category?: string;
  messages?: MessageEntry[];
}

const DEFAULT_CLIENT_TICKETS: SupportTicketData[] = [
  {
    id: "#TKT-1781",
    status: "resolved",
    priority: "high",
    priorityLabel: "High",
    timeAgo: "9/27/2026",
    title: "deliverables not received on time, checkout",
    description: "I've not received my deliverables which was scheduled yesterday",
    meta: "Opened by Sushmitaa • Assigned to Creative Pod",
    category: "Deliverables & Approvals",
    messages: [
      {
        id: "msg-1781-1",
        sender: "Sushmitaa",
        text: "I've not received my deliverables which was scheduled yesterday",
        time: "Yesterday, 4:15 PM",
        isMe: true,
      },
      {
        id: "msg-1781-2",
        sender: "Maya Lin (Pod Lead)",
        text: "Hi Sushmitaa, we apologize for the short delay! The final 4K color grade has been expedited and is now ready in your Deliverables tab.",
        time: "Yesterday, 4:48 PM",
        isMe: false,
      },
    ],
  },
];

export function PortalSupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscription verification
  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ["client-subscription"],
    queryFn: () => request<any>("/api/v1/payments/subscription"),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const isExpired =
    subData?.is_expired === true ||
    subData?.subscription?.status === "expired" ||
    subData?.subscription?.status === "canceled";

  const isStaffOrAdmin = user?.role && user.role !== "client";

  const isSubscribed =
    isStaffOrAdmin ||
    (!isExpired &&
      (subData?.is_active === true ||
        (!!subData?.subscription && ["active", "trialing"].includes(subData?.subscription?.status))));

  // Dashboard context
  const { data: dashData } = useQuery({
    queryKey: ["portal-dashboard", user?.id],
    queryFn: () => request<any>("/api/v1/portal/dashboard"),
    enabled: isSubscribed,
  });

  // Real tickets query
  const { data: serverTickets = [] } = useQuery<TicketItem[]>({
    queryKey: ["tickets", user?.id],
    queryFn: async () => {
      try {
        const res = await request<TicketItem[]>("/api/v1/tickets");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: isSubscribed,
    refetchInterval: 12000,
  });

  // Local state
  const [ticketsList, setTicketsList] = useState<SupportTicketData[]>(DEFAULT_CLIENT_TICKETS);
  const [ticketTab, setTicketTab] = useState<"all" | "in_progress" | "resolved">("all");

  // Form state
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("urgent");
  const [category, setCategory] = useState("Deliverables & Revisions");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  // Modals state
  const [activeDiscussionTicket, setActiveDiscussionTicket] = useState<SupportTicketData | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showCallModal, setShowCallModal] = useState(false);
  const [showHotlineModal, setShowHotlineModal] = useState(false);
  const [showSlaGuidelinesModal, setShowSlaGuidelinesModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const brandDisplayName =
    (user as any)?.company_name ||
    (dashData as any)?.company_name ||
    (dashData as any)?.brand_name ||
    user?.full_name ||
    "Your Brand";
  const slackChannelName = `creo-${brandDisplayName.toLowerCase().replace(/[^a-z0-9]/g, "") || "ryze"}`;

  // Sync server & local storage tickets into ticket list
  const syncTickets = useCallback(() => {
    let localStored: any[] = [];
    try {
      localStored = JSON.parse(localStorage.getItem("creo_support_tickets") || "[]");
    } catch {}

    const mappedLocal: SupportTicketData[] = localStored.map((lt: any) => {
      const isResolved = lt.status?.toLowerCase() === "resolved";
      const isInProgress = lt.status?.toLowerCase() === "in progress" || lt.status?.toLowerCase() === "in_progress";
      const prio = (lt.priority || "medium").toLowerCase();
      const priority: SupportTicketData["priority"] =
        prio === "urgent" ? "urgent" : prio === "high" ? "high" : prio === "low" ? "low" : "medium";
      const priorityLabel =
        priority === "urgent" ? "Urgent (2-Hour SLA)" : priority === "high" ? "High" : priority === "low" ? "Low" : "Medium";
      const rawId = String(lt.id);
      const idFormatted = rawId.startsWith("#") ? rawId : `#TKT-${rawId}`;

      return {
        id: idFormatted,
        status: isResolved ? "resolved" : isInProgress ? "in_progress" : "open",
        priority,
        priorityLabel,
        timeAgo: lt.timeLog || "Recently",
        title: lt.issueTitle || lt.title || "Support Request",
        description: lt.issueDesc || lt.description || "",
        meta: `Opened by ${lt.client || user?.full_name || "You"} • Assigned to ${lt.pod || "Creative Pod"}`,
        category: lt.category || "General Support",
        messages: lt.messages || [
          {
            id: `msg-${Date.now()}`,
            sender: lt.client || user?.full_name || "You",
            text: lt.issueDesc || lt.description || "",
            time: lt.timeLog || "Recently",
            isMe: true,
          },
        ],
      };
    });

    const mappedServer: SupportTicketData[] = (serverTickets || []).map((t) => {
      const isResolved = t.status === "resolved" || t.status === "closed";
      const isInProgress = t.status === "in_progress";
      const prio = (t.priority || "medium").toLowerCase();
      const priority: SupportTicketData["priority"] =
        prio === "urgent" ? "urgent" : prio === "high" ? "high" : prio === "low" ? "low" : "medium";
      const priorityLabel =
        priority === "urgent" ? "Urgent (2-Hour SLA)" : priority === "high" ? "High" : priority === "low" ? "Low" : "Medium";
      const idFormatted = String(t.id).includes("1781")
        ? "#TKT-1781"
        : `#TKT-${String(t.id).replace(/-/g, "").slice(-4).toUpperCase()}`;

      return {
        id: idFormatted,
        status: isResolved ? "resolved" : isInProgress ? "in_progress" : "open",
        priority,
        priorityLabel,
        timeAgo: t.created_at ? new Date(t.created_at).toLocaleDateString() : "Recently",
        title: t.title,
        description: t.description,
        meta: `Opened by ${user?.full_name || "You"} • Assigned to Creative Pod`,
        category: "Deliverables & Approvals",
      };
    });

    // Merge: local submissions + server tickets + DEFAULT_CLIENT_TICKETS
    const combined = [...mappedLocal, ...mappedServer, ...DEFAULT_CLIENT_TICKETS];
    const seen = new Set<string>();
    const merged: SupportTicketData[] = [];

    for (const item of combined) {
      const key = `${item.id.toLowerCase()}_${item.title.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    setTicketsList(merged);
  }, [serverTickets, user]);

  useEffect(() => {
    syncTickets();
    const handleStorage = () => syncTickets();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [syncTickets]);

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string; priority: string }) => {
      return await request("/api/v1/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast("Please provide both a ticket subject and details.");
      return;
    }

    const numericId = String(Math.floor(1000 + Math.random() * 9000));
    const newTicketId = `#TKT-${numericId}`;
    const newTicket: SupportTicketData = {
      id: newTicketId,
      status: "in_progress",
      priority,
      priorityLabel: priority === "urgent" ? "Urgent (2-Hour SLA)" : priority === "high" ? "High" : priority === "low" ? "Low" : "Medium",
      timeAgo: "Just now",
      title: subject.trim(),
      description: description.trim(),
      meta: `Opened by ${user?.full_name || brandDisplayName || "You"} • Assigned to Creative Pod Alpha`,
      category,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: user?.full_name || brandDisplayName || "You",
          text: description.trim(),
          time: "Just now",
          isMe: true,
        },
      ],
    };

    setTicketsList((prev) => [newTicket, ...prev]);

    // Save to shared creo_support_tickets for immediate Admin Support Tickets visibility
    try {
      const stored = JSON.parse(localStorage.getItem("creo_support_tickets") || "[]");
      const clientName = brandDisplayName || user?.full_name || "Client";
      const planName =
        subData?.subscription?.plan?.display_name ||
        subData?.plan_display_name ||
        "Starter Growth Retainer";
      const adminTicket = {
        id: numericId,
        client: clientName,
        tier: planName,
        email: user?.email || "client@creo.agency",
        avatarBg: "bg-[#0F172A]",
        issueTitle: subject.trim(),
        issueDesc: description.trim(),
        priority: priority === "urgent" ? "Urgent" : priority === "high" ? "High" : priority === "low" ? "Low Priority" : "Medium",
        timeLog: "Logged just now",
        agent: "Maya Lin",
        pod: "Pod Alpha",
        agentInitials: "ML",
        status: "Open",
        primaryAction: "Resolve",
        secondaryAction: "Assign",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("creo_support_tickets", JSON.stringify([adminTicket, ...stored]));
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Local storage fallback
    }

    createTicketMutation.mutate({
      title: subject.trim(),
      description: description.trim(),
      priority,
    });

    showToast(`Ticket ${newTicketId} dispatched to priority triage queue!`);
    setSubject("");
    setDescription("");
    setAttachmentName(null);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDiscussionTicket || !replyText.trim()) return;

    const newMessage: MessageEntry = {
      id: `reply-${Date.now()}`,
      sender: user?.full_name || brandDisplayName || "You",
      text: replyText.trim(),
      time: "Just now",
      isMe: true,
    };

    setTicketsList((prev) =>
      prev.map((t) =>
        t.id === activeDiscussionTicket.id
          ? { ...t, messages: [...(t.messages || []), newMessage] }
          : t
      )
    );

    setActiveDiscussionTicket((prev) =>
      prev ? { ...prev, messages: [...(prev.messages || []), newMessage] } : null
    );

    // Update localStorage for admin view
    try {
      const stored = JSON.parse(localStorage.getItem("creo_support_tickets") || "[]");
      const updated = stored.map((st: any) => {
        const matches =
          String(st.id) === activeDiscussionTicket.id.replace("#TKT-", "") ||
          String(st.id) === activeDiscussionTicket.id;
        if (matches) {
          return {
            ...st,
            messages: [...(st.messages || []), newMessage],
          };
        }
        return st;
      });
      localStorage.setItem("creo_support_tickets", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch {}

    setReplyText("");
    showToast("Reply sent to duty engineer.");
  };

  const handleAttachFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.jpg,.jpeg,.mp4,.json,.log,.txt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAttachmentName(file.name);
        showToast(`Attached: ${file.name}`);
      }
    };
    input.click();
  };

  // Filtered tickets
  const filteredTickets = ticketsList.filter((t) => {
    if (ticketTab === "in_progress") return t.status === "in_progress" || t.status === "open";
    if (ticketTab === "resolved") return t.status === "resolved";
    return true;
  });

  if (isSubLoading) {
    return (
      <div className="animate-page-in space-y-6 max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="bg-[#161F2D] border border-[#2A3446] rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
          <Loader2 className="size-8 text-[#7FA0D6] animate-spin mb-3" />
          <p className="text-xs font-semibold text-[#97A0B3]">Checking Support Workspace Access...</p>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="animate-page-in space-y-6 max-w-[1440px] mx-auto px-4 md:px-8">
        <SubscriptionLockedState
          title={isExpired ? "Creative Retainer Expired" : "Support Desk Workspace Locked"}
          description={
            isExpired
              ? "Your monthly creative retainer billing cycle has concluded. Priority support queue access is paused until you renew."
              : "Access to dedicated support managers, priority hotline, and ticket queues requires an active retainer plan. Choose a plan to activate support workflows."
          }
        />
      </div>
    );
  }

  return (
    <div className="animate-page-in space-y-6 max-w-[1440px] mx-auto px-4 md:px-8 pb-12">
      {/* ── 1. Top Row: 3 Bento Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Assigned Creative Pod */}
        <div className="rounded-3xl border border-[#2A3446] bg-[#161F2D] p-6 shadow-sm hover:border-[#7FA0D6]/60 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Assigned Creative Pod
                </h3>
                <p className="text-xs text-[#97A0B3] mt-0.5">
                  Your dedicated full-stack creative execution unit
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#7FA0D6] bg-[#7FA0D6]/10 border border-[#7FA0D6]/30 px-2.5 py-0.5 rounded-full shrink-0">
                Pod Alpha
              </span>
            </div>

            {/* Profile Block */}
            <div className="mt-5 rounded-2xl border border-[#2A3446] bg-[#0B111C] p-3.5 sm:p-4 flex items-center gap-3.5">
              <div className="size-11 rounded-full bg-[#7FA0D6]/20 text-[#7FA0D6] font-bold text-sm flex items-center justify-center shrink-0 border border-[#7FA0D6]/40 shadow-xs">
                ML
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Maya Lin</span>
                  <span className="bg-[#0052FF] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    POD LEAD
                  </span>
                </div>
                <p className="text-xs text-[#97A0B3] mt-0.5 truncate">
                  Creative Director • Available for fast triage
                </p>
                <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active in Slack</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mt-5">
            <button
              type="button"
              onClick={() => showToast(`Connected to #${slackChannelName} on Creo Slack Connect.`)}
              className="w-full py-2.5 px-3 rounded-xl border border-[#2A3446] bg-[#0B111C] hover:bg-[#161F2D] text-xs font-bold text-[#F8FAFC] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Hash className="size-3.5 text-[#97A0B3]" />
              <span>Open Slack (#{slackChannelName})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCallModal(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-[#7FA0D6]/30 bg-[#7FA0D6]/10 hover:bg-[#7FA0D6]/20 text-xs font-bold text-[#7FA0D6] hover:text-[#BCCCE6] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Calendar className="size-3.5 text-[#7FA0D6]" />
              <span>Schedule Quick Triage Call</span>
            </button>
          </div>
        </div>

        {/* Card 2: Urgent Hotline & Escalation */}
        <div className="rounded-3xl border border-[#2A3446] bg-[#161F2D] p-6 shadow-sm hover:border-[#7FA0D6]/60 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/20">
                  <Phone className="size-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Urgent Hotline & Escalation
                  </h3>
                  <p className="text-xs text-[#97A0B3] mt-0.5">
                    Emergency escalation line for critical production blockers & live launch outages.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Staffed & Live (24/7)
              </span>
            </div>

            {/* Hotline Number Block */}
            <div className="mt-5 rounded-2xl border border-[#2A3446] bg-[#0B111C] p-4 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#97A0B3]">
                EMERGENCY ESCALATION LINE
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-lg sm:text-xl font-mono font-bold text-white tracking-tight">
                  +1 (800) 555-0199
                </span>
                <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  24/7 PRIORITY
                </span>
              </div>
              <p className="text-xs text-[#97A0B3] leading-relaxed pt-0.5">
                Direct priority line to Senior Duty Engineer & Account Director.
              </p>
            </div>
          </div>

          {/* Hotline Actions */}
          <div className="flex items-center justify-between gap-3 mt-5 pt-1">
            <button
              type="button"
              onClick={() => setShowHotlineModal(true)}
              className="py-2.5 px-3.5 rounded-xl border border-[#2A3446] bg-[#0B111C] hover:bg-[#161F2D] text-xs font-bold text-[#F8FAFC] transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <PhoneCall className="size-3.5 text-[#97A0B3]" />
              <span>Call Escalation Line</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSlaGuidelinesModal(true)}
              className="text-xs font-semibold text-[#7FA0D6] hover:text-[#BCCCE6] hover:underline transition-colors shrink-0"
            >
              View Emergency SLA Guidelines →
            </button>
          </div>
        </div>

        {/* Card 3: Support SLA Metrics */}
        <div className="rounded-3xl border border-[#2A3446] bg-[#161F2D] p-6 shadow-sm hover:border-[#7FA0D6]/60 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Support SLA Metrics
                </h3>
                <p className="text-xs text-[#97A0B3] mt-0.5">
                  Real-time resolution speeds and compliance guarantees.
                </p>
              </div>
              <span className="text-xs text-[#97A0B3] font-medium shrink-0">Past 30 Days</span>
            </div>

            {/* 2 Metric Boxes */}
            <div className="grid grid-cols-2 gap-3.5 mt-5">
              <div className="rounded-2xl border border-[#2A3446] bg-[#0B111C] p-4">
                <span className="text-xs text-[#97A0B3] font-medium">Average Turnaround</span>
                <div className="text-2xl sm:text-[26px] font-black text-[#7FA0D6] mt-1 tracking-tight">
                  1.8 hrs
                </div>
                <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-1 truncate">
                  <Check className="size-3 text-emerald-400 shrink-0" />
                  <span>Faster than 2.0h SLA</span>
                </p>
              </div>

              <div className="rounded-2xl border border-[#2A3446] bg-[#0B111C] p-4">
                <span className="text-xs text-[#97A0B3] font-medium">SLA Compliance</span>
                <div className="text-2xl sm:text-[26px] font-black text-white mt-1 tracking-tight">
                  99.4%
                </div>
                <p className="text-[11px] text-[#97A0B3] font-medium mt-1 truncate">
                  Across {ticketsList.length} {ticketsList.length === 1 ? "ticket" : "tickets"} processed
                </p>
              </div>
            </div>
          </div>

          {/* Bottom On-Track Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2A3446] text-xs font-semibold mt-5">
            <span className="text-[#97A0B3] font-medium">Target SLA: &lt; 2.0 hours</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              100% On-Track
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Bottom Row: 2 Bento Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Card 4 (Left, 5 cols): Submit a New Support Ticket */}
        <div className="lg:col-span-5 rounded-3xl border border-[#2A3446] bg-[#161F2D] p-6 sm:p-7 shadow-sm hover:border-[#7FA0D6]/60 transition-all">
          <div className="flex items-center justify-between gap-3 pb-1">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Submit a New Support Ticket
                </h3>
                <span className="bg-[#7FA0D6]/15 border border-[#7FA0D6]/30 text-[#7FA0D6] text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Priority Queue
                </span>
              </div>
              <p className="text-xs text-[#97A0B3] mt-1">
                Direct triage queue assigned to your senior engineers and creative directors.
              </p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 mt-5">
            {/* 1. Subject */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#97A0B3] mb-1.5">
                TICKET SUBJECT
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of the issue or creative request..."
                className="w-full text-xs font-medium text-[#F8FAFC] placeholder:text-[#97A0B3]/50 border border-[#2A3446] bg-[#0B111C] rounded-xl px-3.5 py-2.5 focus:border-[#7FA0D6] focus:ring-1 focus:ring-[#7FA0D6]/30 outline-none transition-all"
              />
            </div>

            {/* 2. Priority Level Segmented Controls */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#97A0B3] mb-1.5">
                PRIORITY LEVEL
              </label>
              <div className="flex flex-wrap gap-2">
                {(["low", "medium", "high", "urgent"] as const).map((p) => {
                  const isSelected = priority === p;
                  const label =
                    p === "low"
                      ? "Low"
                      : p === "medium"
                      ? "Medium"
                      : p === "high"
                      ? "High"
                      : "• Urgent (2-Hour SLA)";
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex-auto min-w-[70px] whitespace-nowrap ${
                        isSelected
                          ? p === "urgent"
                            ? "bg-rose-500/20 border border-rose-500/60 text-rose-300 shadow-xs"
                            : "bg-[#0052FF] border border-[#0052FF] text-white shadow-xs"
                          : "border border-[#2A3446] bg-[#0B111C] text-[#97A0B3] hover:text-white hover:bg-[#161F2D]"
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Issue Category Dropdown */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#97A0B3] mb-1.5">
                ISSUE CATEGORY
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-medium text-[#F8FAFC] border border-[#2A3446] bg-[#0B111C] rounded-xl px-3.5 py-2.5 appearance-none focus:border-[#7FA0D6] focus:ring-1 focus:ring-[#7FA0D6]/30 outline-none transition-all cursor-pointer pr-9"
                >
                  <option value="Deliverables & Revisions" className="bg-[#161F2D] text-white">Deliverables & Revisions</option>
                  <option value="Brand DNA & Strategy" className="bg-[#161F2D] text-white">Brand DNA & Strategy</option>
                  <option value="Billing & Retainer Management" className="bg-[#161F2D] text-white">Billing & Retainer Management</option>
                  <option value="API & Webhooks" className="bg-[#161F2D] text-white">API & Webhooks</option>
                  <option value="Platform Access & Security" className="bg-[#161F2D] text-white">Platform Access & Security</option>
                </select>
                <ChevronDown className="size-4 text-[#97A0B3] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Description & Logs */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#97A0B3] mb-1.5">
                DESCRIPTION & LOGS
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details, screen recordings, or error logs..."
                className="w-full text-xs font-medium text-[#F8FAFC] placeholder:text-[#97A0B3]/50 border border-[#2A3446] bg-[#0B111C] rounded-xl p-3.5 focus:border-[#7FA0D6] focus:ring-1 focus:ring-[#7FA0D6]/30 outline-none resize-none leading-relaxed transition-all"
              />
            </div>

            {/* 5. Attachment preview if selected */}
            {attachmentName && (
              <div className="flex items-center justify-between bg-[#7FA0D6]/10 border border-[#7FA0D6]/30 rounded-xl px-3 py-1.5 text-xs text-[#7FA0D6]">
                <span className="flex items-center gap-1.5 truncate">
                  <FileText className="size-3.5 text-[#7FA0D6] shrink-0" />
                  <span className="font-semibold truncate">{attachmentName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachmentName(null)}
                  className="text-[#97A0B3] hover:text-white p-0.5 ml-2 cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* 6. Action Row */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAttachFile}
                  className="py-2 px-3 rounded-xl border border-[#2A3446] bg-[#0B111C] hover:bg-[#161F2D] text-[11px] font-bold text-[#F8FAFC] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Paperclip className="size-3 text-[#97A0B3]" />
                  <span>Attach Files</span>
                </button>
                <span className="text-[10px] text-[#97A0B3] font-medium hidden sm:inline">
                  Up to 250MB supported
                </span>
              </div>

              <button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="py-2.5 px-5 rounded-xl bg-[#0052FF] hover:bg-[#0045D8] text-white text-xs font-bold shadow-md shadow-[#0052FF]/25 hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                {createTicketMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Submit Ticket to Triage</span>
                    <ArrowRight className="size-3" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Card 5 (Right, 7 cols): Active & Recent Tickets */}
        <div className="lg:col-span-7 rounded-3xl border border-[#2A3446] bg-[#161F2D] p-6 sm:p-7 shadow-sm hover:border-[#7FA0D6]/60 transition-all flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Active & Recent Tickets
                </h3>
                <p className="text-xs text-[#97A0B3] mt-0.5">
                  Track your open requests and review SLA resolutions.
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center gap-1 bg-[#0B111C] p-1 rounded-full border border-[#2A3446] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTicketTab("all")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    ticketTab === "all"
                      ? "bg-[#161F2D] text-white shadow-xs border border-[#2A3446]/60"
                      : "text-[#97A0B3] hover:text-white"
                  }`}
                >
                  All Tickets
                </button>
                <button
                  type="button"
                  onClick={() => setTicketTab("in_progress")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    ticketTab === "in_progress"
                      ? "bg-[#161F2D] text-white shadow-xs border border-[#2A3446]/60"
                      : "text-[#97A0B3] hover:text-white"
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  onClick={() => setTicketTab("resolved")}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    ticketTab === "resolved"
                      ? "bg-[#161F2D] text-white shadow-xs border border-[#2A3446]/60"
                      : "text-[#97A0B3] hover:text-white"
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>

            {/* Stacked Ticket Cards */}
            <div className="space-y-3.5 mt-5">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-[#97A0B3]">
                  <p className="text-xs font-semibold">No tickets found in this tab.</p>
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-[#2A3446] bg-[#0B111C] hover:border-[#7FA0D6]/60 p-4 transition-all shadow-xs group"
                  >
                    {/* Top Row Badges & Timestamp */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#BCCCE6] bg-[#161F2D] border border-[#2A3446] px-2 py-0.5 rounded-md shadow-2xs">
                          {t.id}
                        </span>

                        {t.status === "in_progress" ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                            <Check className="size-3 text-emerald-400" />
                            Resolved
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            t.priority === "urgent"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : t.priority === "high"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-[#7FA0D6]/10 text-[#7FA0D6] border-[#7FA0D6]/30"
                          }`}
                        >
                          {t.priorityLabel}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#97A0B3] font-medium">
                        {t.timeAgo}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="mt-2.5">
                      <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#7FA0D6] transition-colors">
                        {t.title}
                      </h4>
                      <p className="text-xs text-[#97A0B3] mt-1 leading-relaxed line-clamp-2">
                        {t.description}
                      </p>
                    </div>

                    {/* Bottom Row */}
                    <div className="mt-3.5 pt-2.5 border-t border-[#2A3446] flex items-center justify-between text-xs text-[#97A0B3]">
                      <span className="truncate max-w-[70%] font-medium">{t.meta}</span>
                      <button
                        type="button"
                        onClick={() => setActiveDiscussionTicket(t)}
                        className="font-bold text-[#7FA0D6] hover:text-white flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        <span>View Discussion Thread</span>
                        <ArrowRight className="size-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="pt-4 mt-6 border-t border-[#2A3446] flex items-center justify-between text-xs text-[#97A0B3]">
            <span>Showing {filteredTickets.length} of {ticketsList.length} tickets</span>
            <button
              type="button"
              onClick={() => {
                setTicketTab("resolved");
                showToast("Filtering to all resolved SLA records.");
              }}
              className="text-[#7FA0D6] font-semibold hover:text-white transition-colors cursor-pointer"
            >
              View All Resolved Tickets →
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Discussion Thread ── */}
      {activeDiscussionTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#161F2D] border border-[#2A3446] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl p-6 flex flex-col max-h-[85vh] animate-scale-in text-[#F8FAFC]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#2A3446] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#BCCCE6] bg-[#0B111C] border border-[#2A3446] px-2 py-0.5 rounded">
                    {activeDiscussionTicket.id}
                  </span>
                  <span className="text-xs font-bold text-[#7FA0D6] bg-[#7FA0D6]/10 border border-[#7FA0D6]/30 px-2 py-0.5 rounded">
                    {activeDiscussionTicket.category || "General"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {activeDiscussionTicket.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDiscussionTicket(null)}
                className="size-8 rounded-full bg-[#0B111C] hover:bg-[#2A3446] text-[#97A0B3] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#2A3446]"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 scrollbar-thin">
              {activeDiscussionTicket.messages?.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                    m.isMe
                      ? "ml-auto bg-[#0052FF] text-white rounded-tr-xs"
                      : "mr-auto bg-[#0B111C] border border-[#2A3446] text-[#F8FAFC] rounded-tl-xs"
                  }`}
                >
                  <div className={`flex items-center justify-between gap-3 text-[10px] mb-1 ${m.isMe ? "text-blue-100" : "text-[#97A0B3]"}`}>
                    <span className="font-bold">{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="pt-3 border-t border-[#2A3446] flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type response to assigned engineer..."
                className="flex-1 text-xs font-medium border border-[#2A3446] bg-[#0B111C] text-[#F8FAFC] placeholder:text-[#97A0B3]/50 rounded-xl px-3.5 py-2.5 focus:border-[#7FA0D6] focus:ring-1 focus:ring-[#7FA0D6]/30 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0052FF] hover:bg-[#0045D8] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Schedule Quick Triage Call ── */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#161F2D] border border-[#2A3446] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 animate-scale-in space-y-4 text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-[#2A3446] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#7FA0D6]/10 text-[#7FA0D6] flex items-center justify-center border border-[#7FA0D6]/30">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Schedule Quick Triage Call</h3>
                  <p className="text-xs text-[#97A0B3]">15-Minute Strategic Sync with Maya Lin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="size-7 rounded-full bg-[#0B111C] text-[#97A0B3] hover:text-white flex items-center justify-center border border-[#2A3446]"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-[#BCCCE6]">Select Available Triage Slot</label>
              <div className="grid grid-cols-2 gap-2">
                {["Today, 4:30 PM IST", "Today, 6:00 PM IST", "Tomorrow, 11:00 AM IST", "Tomorrow, 3:30 PM IST"].map(
                  (slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setShowCallModal(false);
                        showToast(`Quick triage call booked for ${slot}. Google Meet link sent to your email.`);
                      }}
                      className="p-2.5 rounded-xl border border-[#2A3446] bg-[#0B111C] hover:border-[#7FA0D6] hover:bg-[#161F2D] text-left font-semibold text-[#F8FAFC] transition-all cursor-pointer"
                    >
                      {slot}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Direct calendar integration with your assigned creative director.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Emergency Hotline ── */}
      {showHotlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#161F2D] border border-[#2A3446] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 animate-scale-in text-center space-y-4 text-[#F8FAFC]">
            <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
              <PhoneCall className="size-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Emergency Escalation Dial-in</h3>
              <p className="text-xs text-[#97A0B3] mt-1 max-w-xs mx-auto">
                Direct phone link routed to Senior Duty Engineer on call.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B111C] border border-[#2A3446] font-mono text-lg font-bold text-white">
              +1 (800) 555-0199
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("+18005550199");
                  showToast("Copied phone number to clipboard.");
                }}
                className="flex-1 py-2.5 border border-[#2A3446] bg-[#0B111C] rounded-xl text-xs font-bold text-[#F8FAFC] hover:bg-[#161F2D]"
              >
                Copy Number
              </button>
              <a
                href="tel:+18005550199"
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Phone className="size-3.5" />
                <span>Dial Now</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowHotlineModal(false)}
              className="text-xs text-[#97A0B3] hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: SLA Guidelines ── */}
      {showSlaGuidelinesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#161F2D] border border-[#2A3446] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 sm:p-7 animate-scale-in space-y-4 text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-[#2A3446] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-[#7FA0D6]" />
                <h3 className="text-base font-bold text-white">Emergency SLA Matrix</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSlaGuidelinesModal(false)}
                className="size-7 rounded-full bg-[#0B111C] text-[#97A0B3] hover:text-white flex items-center justify-center border border-[#2A3446]"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#97A0B3]">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                <span className="font-bold">P1 - Urgent Outage (&lt; 2 Hours):</span> Active launch failures,
                publisher API authentication blocks, or corrupted master export files.
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <span className="font-bold">P2 - High Priority (&lt; 6 Hours):</span> Urgent revisions on scheduled
                calendar drops or creative styling realignment.
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
                <span className="font-bold">P3 - Standard (&lt; 12 Hours):</span> General strategy questions, batch
                requests, and backlog brainstorm items.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSlaGuidelinesModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0045D8] text-white font-bold text-xs cursor-pointer"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161F2D] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#2A3446] animate-slide-up">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#97A0B3] hover:text-white p-0.5 ml-1 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default PortalSupportPage;
