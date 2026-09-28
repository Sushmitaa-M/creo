import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminQueueData } from "@/types/ops";
import { fetchLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from "@/lib/ops-api";

interface TeamDetailsWidgetProps {
  queue: AdminQueueData | null;
}

export function TeamDetailsWidget({ queue: _queue }: TeamDetailsWidgetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<string | null>(null);

  // Fetch leave requests
  const { data: leavesData } = useQuery({
    queryKey: ["admin_leave_requests"],
    queryFn: fetchLeaveRequests,
  });

  // Leave requests local fallback (empty by default so no fake mock data appears)
  const [localLeaves, setLocalLeaves] = useState<any[]>([]);

  const approveMutation = useMutation({
    mutationFn: approveLeaveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_leave_requests"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectLeaveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_leave_requests"] }),
  });

  const handleApproveLeave = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    approveMutation.mutate(id);
    setLocalLeaves((prev) => prev.filter((l) => l.id !== id));
    setToast(`Approved leave request for ${name}`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeclineLeave = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    rejectMutation.mutate(id);
    setLocalLeaves((prev) => prev.filter((l) => l.id !== id));
    setToast(`Declined leave request for ${name}`);
    setTimeout(() => setToast(null), 3000);
  };

  // Strictly 3 Pods: Pod A, Pod B, Pod C
  const defaultPods = [
    {
      id: "pod-a",
      name: "Pod A",
      letter: "A",
      lead: "Vikram M.",
      ratio: "3/3",
      completed: 0,
      pending: 0,
      percentage: 100,
      color: "bg-blue-600",
      textColor: "text-[#7FA0D6]",
      badgeColor: "bg-[#7FA0D6]/15 text-[#7FA0D6]",
      progressBg: "bg-blue-600",
    },
    {
      id: "pod-b",
      name: "Pod B",
      letter: "B",
      lead: "Sarah C.",
      ratio: "3/3",
      completed: 0,
      pending: 0,
      percentage: 100,
      color: "bg-[#0EA5E9]",
      textColor: "text-[#0EA5E9]",
      badgeColor: "bg-[#0EA5E9]/15 text-[#0EA5E9]",
      progressBg: "bg-[#0EA5E9]",
    },
    {
      id: "pod-c",
      name: "Pod C",
      letter: "C",
      lead: "Rohan M.",
      ratio: "3/3",
      completed: 0,
      pending: 0,
      percentage: 100,
      color: "bg-[#10B981]",
      textColor: "text-[#10B981]",
      badgeColor: "bg-[#10B981]/15 text-[#10B981]",
      progressBg: "bg-[#10B981]",
    },
  ];

  const pendingLeavesList =
    leavesData && leavesData.filter((l) => l.status === "pending").length > 0
      ? leavesData
          .filter((l) => l.status === "pending")
          .map((l) => ({
            id: l.id,
            user_name: l.user_name || "Team Member",
            pod: "Pod A",
            avatar: (l.user_name || "TM").slice(0, 2).toUpperCase(),
            avatarBg: "bg-[#1E293B]",
            type: l.reason || "Personal Leave",
            dates: `${l.start_date || "Oct 24"} - ${l.end_date || "Oct 25"}`,
            status: l.status,
          }))
      : localLeaves;

  return (
    <div
      onClick={() => navigate("/admin/team")}
      className="bg-[#161F2D] rounded-2xl border border-[#2A3446] shadow-sm hover:border-[#7FA0D6]/50 transition-all p-4 sm:p-5 flex flex-col w-full h-full font-sans cursor-pointer group hover-card-innovative"
    >
      {/* Toast Feedback */}
      {toast && (
        <div className="mb-3 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-bold rounded-xl animate-fade-in flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-400 hover:text-emerald-200">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-black text-white group-hover:text-[#7FA0D6] transition-colors tracking-tight">Team Details</h2>
          <p className="text-[11px] text-[#97A0B3] font-medium">Team structure & delivery status</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-[#7FA0D6] bg-[#7FA0D6]/15 border border-[#7FA0D6]/30">
          3 pods
        </span>
      </div>

      {/* Top 4 Metrics Row */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3">
        <div className="bg-[#0B111C]/90 border border-[#2A3446] rounded-xl py-1.5 px-1 flex flex-col items-center justify-center text-center">
          <span className="text-sm sm:text-base font-black text-white tracking-tight leading-none">3</span>
          <span className="text-[8.5px] sm:text-[9px] text-[#97A0B3] font-bold uppercase tracking-wider mt-0.5">Pods</span>
        </div>
        <div className="bg-[#0B111C]/90 border border-[#2A3446] rounded-xl py-1.5 px-1 flex flex-col items-center justify-center text-center">
          <span className="text-sm sm:text-base font-black text-white tracking-tight leading-none">9</span>
          <span className="text-[8.5px] sm:text-[9px] text-[#97A0B3] font-bold uppercase tracking-wider mt-0.5">Specialists</span>
        </div>
        <div className="bg-[#0B111C]/90 border border-[#2A3446] rounded-xl py-1.5 px-1 flex flex-col items-center justify-center text-center">
          <span className="text-sm sm:text-base font-black text-white tracking-tight leading-none">9</span>
          <span className="text-[8.5px] sm:text-[9px] text-[#97A0B3] font-bold uppercase tracking-wider mt-0.5">Active</span>
        </div>
        <div className="bg-[#0B111C]/90 border border-[#2A3446] rounded-xl py-1.5 px-1 flex flex-col items-center justify-center text-center">
          <span className="text-sm sm:text-base font-black text-white tracking-tight leading-none">0</span>
          <span className="text-[8.5px] sm:text-[9px] text-[#97A0B3] font-bold uppercase tracking-wider mt-0.5">Done</span>
        </div>
      </div>

      {/* 3 Pods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3.5 flex-1 overflow-y-auto min-h-0 pr-0.5 custom-scrollbar">
        {defaultPods.map((pod) => (
          <div
            key={pod.id}
            className="border border-[#2A3446] rounded-xl p-3 bg-[#0B111C] shadow-2xs flex flex-col justify-between hover:border-[#7FA0D6]/30 transition-all"
          >
            <div>
              {/* Pod Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${pod.color} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                    {pod.letter}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white leading-snug truncate">{pod.name}</span>
                    <span className="text-[9px] text-[#97A0B3] font-medium truncate">{pod.lead}</span>
                  </div>
                </div>

                <div className={`flex items-center gap-1 text-[9px] font-bold ${pod.badgeColor} px-1.5 py-0.5 rounded-full shrink-0`}>
                  <span className="w-1 h-1 rounded-full bg-current" />
                  {pod.ratio}
                </div>
              </div>

              {/* Stats Line */}
              <div className="flex items-center justify-between text-[9px] text-[#97A0B3] font-semibold mb-1.5">
                <span>{pod.completed} Comp · {pod.pending} Pend</span>
                <span className={`text-[10px] font-black ${pod.textColor}`}>{pod.percentage}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#1F2C3F] h-1.5 rounded-full overflow-hidden">
              <div className={`h-full ${pod.progressBg} rounded-full`} style={{ width: `${pod.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Pending Leave Requests Section */}
      <div className="bg-[#0B111C] border border-[#2A3446] rounded-2xl p-3 space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
            <h3 className="text-xs font-bold text-white">Pending Leave Requests</h3>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-[#7FA0D6] bg-[#161F2D] border border-[#2A3446] shadow-2xs">
            {pendingLeavesList.length} to review
          </span>
        </div>

        {pendingLeavesList.length === 0 ? (
          <div className="py-2.5 text-center text-[11px] text-[#97A0B3] font-medium">
            No pending leave requests
          </div>
        ) : (
          <div className="space-y-1.5">
            {pendingLeavesList.map((leave) => (
              <div
                key={leave.id}
                className="bg-[#161F2D] border border-[#2A3446] rounded-xl p-2 flex items-center justify-between shadow-2xs hover:border-[#7FA0D6]/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-full ${leave.avatarBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                    {leave.avatar}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white truncate">{leave.user_name}</span>
                      <span className="text-[9px] text-[#97A0B3]">({leave.pod})</span>
                    </div>
                    <span className="text-[9px] text-[#97A0B3] truncate">
                      {leave.type} · {leave.dates}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleApproveLeave(e, leave.id, leave.user_name)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => handleDeclineLeave(e, leave.id, leave.user_name)}
                    className="px-2 py-1 text-[11px] font-semibold text-[#97A0B3] hover:text-white transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[#2A3446] flex items-center justify-end text-xs" onClick={(e) => e.stopPropagation()}>
        <Link
          to="/admin/team"
          onClick={(e) => e.stopPropagation()}
          className="text-[#7FA0D6] font-bold hover:text-blue-300 transition-colors flex items-center gap-1 text-[11px]"
        >
          Manage teams &rarr;
        </Link>
      </div>
    </div>
  );
}
