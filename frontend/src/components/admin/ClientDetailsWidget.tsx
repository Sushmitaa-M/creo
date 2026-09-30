import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Search,
  ExternalLink,
} from "lucide-react";
import { ClientRosterItem } from "@/types/ops";

interface ClientDetailsWidgetProps {
  clients: ClientRosterItem[];
}

export function ClientDetailsWidget({ clients }: ClientDetailsWidgetProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const getClientDisplayName = (client: ClientRosterItem): string => {
    if (client.company_name && client.company_name.trim() !== "" && client.company_name.toLowerCase() !== "unknown") {
      return client.company_name;
    }
    if (client.email) {
      const parts = client.email.split("@");
      const part = (parts[0] || "").replace(/[._0-9]/g, " ").trim();
      if (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }
    }
    return "Client Account";
  };

  const filteredClients = clients.filter((c) => {
    const displayName = getClientDisplayName(c);
    return (
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.plan_display_name || c.plan_name || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t.includes("enterprise") || t.includes("domination") || t.includes("pro")) {
      return "bg-[#7FA0D6]/15 text-[#7FA0D6] border-[#7FA0D6]/30";
    }
    if (t.includes("growth") || t.includes("accelerator")) {
      return "bg-[#BCCCE6]/15 text-[#BCCCE6] border-[#BCCCE6]/30";
    }
    if (t.includes("starter")) {
      return "bg-blue-600/15 text-[#60A5FA] border-blue-500/30";
    }
    return "bg-[#1F2C3F] text-[#F1F5F9] border-[#2A3446]";
  };

  const getInitials = (name: string) => (name ? name.charAt(0).toUpperCase() : "?");

  const getPodInfo = (name: string) => {
    const podLetters = ["A", "B", "C", "D", "E"];
    const podIdx = Math.abs(name.charCodeAt(0) || 0) % podLetters.length;
    const podLetter = podLetters[podIdx];
    const podLeads = ["Maya Lin", "Elena Rostova", "Lena Ortiz", "Theo Clark", "Sarah Jenkins"];
    const podAvatars = ["bg-[#7FA0D6]", "bg-indigo-600", "bg-blue-700", "bg-sky-600", "bg-blue-600"];
    return {
      letter: podLetter,
      name: `Pod ${podLetter}`,
      lead: podLeads[podIdx] || "Creative Lead",
      avatarColor: podAvatars[podIdx] || "bg-[#7FA0D6]",
    };
  };

  return (
    <div className="bg-[#161F2D] rounded-2xl p-4 sm:p-5 flex flex-col w-full font-sans border border-[#2A3446] shadow-sm hover:border-[#7FA0D6]/40 transition-all cursor-default">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-3.5">
        <div className="flex flex-col gap-0.5 cursor-pointer" onClick={() => navigate("/admin/clients")}>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-black text-white hover:text-[#7FA0D6] transition-colors tracking-tight">
              Client Roster
            </h2>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#7FA0D6]/15 text-[#7FA0D6] border border-[#7FA0D6]/30">
              Active Clients
            </span>
          </div>
          <p className="text-[11px] text-[#97A0B3] font-medium">Overview, contract status & creative pod allocation</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#97A0B3]" />
            <input
              type="text"
              placeholder="Search clients, pods, or deliverables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-full sm:w-[240px] rounded-xl border border-[#2A3446] bg-[#0B111C] text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-[#97A0B3] shadow-2xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7FA0D6] bg-[#7FA0D6]/15 w-fit px-2.5 py-1 rounded-full mb-3 border border-[#7FA0D6]/30 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-[#7FA0D6]" />
        <span>{filteredClients.length} Active Retainers</span>
      </div>

      {/* List Header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#97A0B3] mb-1">
        <div className="col-span-4">Client & Tier</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-3">Pod Assigned</div>
        <div className="col-span-3 text-right">Deliverables Progress</div>
      </div>

      {/* List Content */}
      <div className="flex flex-col space-y-1.5">
        {filteredClients.map((client, i) => {
          const tier = client.plan_display_name || client.plan_name || "Custom";
          const deliverables_total = client.quota_usage.reduce((sum, q) => sum + q.quota, 0);
          const deliverables_completed = client.quota_usage.reduce((sum, q) => sum + q.used, 0);
          const company_name = getClientDisplayName(client);
          const initials = getInitials(company_name);
          const pod = getPodInfo(company_name);

          return (
            <motion.div
              key={client.client_id}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              onClick={() => navigate("/admin/clients")}
              className="grid grid-cols-12 gap-3 items-center px-4 py-2.5 bg-[#0B111C]/80 hover:bg-[#0B111C] rounded-xl border border-[#2A3446] hover:border-[#7FA0D6] hover:shadow-md transition-all group cursor-pointer"
            >
              {/* Client & Tier */}
              <div className="col-span-4 flex items-center space-x-2.5 min-w-0">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${pod.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-2xs`}>
                  {initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white truncate tracking-tight group-hover:text-[#7FA0D6] transition-colors">
                      {company_name}
                    </span>
                    <span className={`text-[8px] font-black tracking-wider px-1.5 py-0.2 rounded-md border ${getTierColor(tier)}`}>
                      {tier}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#97A0B3] font-medium truncate">{client.email}</span>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-[#7FA0D6] bg-[#161F2D] border border-[#2A3446]">
                  <span className="w-1 h-1 rounded-full bg-[#7FA0D6]" />
                  {client.subscription_status || client.account_status || "active"}
                </span>
              </div>

              {/* Pod Assigned */}
              <div className="col-span-3 flex items-center space-x-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {pod.letter}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white tracking-tight">{pod.name}</span>
                  <span className="text-[9px] text-[#97A0B3] font-medium">{pod.lead}</span>
                </div>
              </div>

              {/* Deliverables Progress */}
              <div className="col-span-3 text-right flex items-center justify-end space-x-2.5">
                <span className="text-[11px] font-bold text-[#F1F5F9] tracking-tight">
                  {deliverables_completed}/{deliverables_total} Posts
                </span>
                <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-[#2A3446]" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      className="stroke-[#7FA0D6]"
                      strokeWidth="4"
                      strokeDasharray="100"
                      strokeDashoffset={
                        deliverables_total > 0 ? 100 - (deliverables_completed / deliverables_total) * 100 : 100
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="py-8 text-center text-xs text-[#97A0B3] font-medium">
          No clients found matching your search.
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[#2A3446] flex items-center justify-between text-[11px] text-[#97A0B3] font-medium">
        <span>Click any client to view their active retainer details in the Client Roster.</span>
        <button
          type="button"
          onClick={() => navigate("/admin/clients")}
          className="text-[#7FA0D6] font-bold hover:underline cursor-pointer flex items-center gap-1"
        >
          <span>Open Client Roster</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
