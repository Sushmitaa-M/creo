import { Link, useLocation, useNavigate } from "react-router";
import { 
  Bell, 
  ChevronLeft, 
  Check, 
  CheckCheck, 
  CalendarCheck, 
  DollarSign, 
  Users, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  LogOut, 
  MessageSquare,
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Briefcase,
  Layers,
  CheckSquare,
  Calendar,
  ListTodo,
  Building2,
  LifeBuoy,
  Megaphone,
  BarChart3,
  Settings
} from "lucide-react";
import { AdminKPIs } from "../../types/ops";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../../lib/http";

interface AdminTopHeaderProps {
  title?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  kpis?: AdminKPIs | null;
  refreshing?: boolean;
  handleRefreshKpis?: () => void;
  showBackButton?: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  created_at?: string;
  type?: "leave" | "revenue" | "team" | "system";
  is_read?: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Leave Request Submitted",
    message: "Elena Rostova requested 3 days of medical/personal leave.",
    link: "/admin/leaves",
    type: "leave",
    created_at: "10 mins ago",
    is_read: false,
  },
  {
    id: "n-2",
    title: "Retainer Counter-Offer",
    message: "Northwind Labs proposed ₹85,000/mo for Enterprise Tier.",
    link: "/admin/revenue",
    type: "revenue",
    created_at: "45 mins ago",
    is_read: false,
  },
  {
    id: "n-3",
    title: "Pod A Delivery Warning",
    message: "Sprint capacity at 92%. Review task queue allocation.",
    link: "/admin/team",
    type: "team",
    created_at: "2 hours ago",
    is_read: true,
  },
];

export function AdminTopHeader({
  title,
  activeTab = "Dashboard",
  setActiveTab: _setActiveTab,
  kpis: _kpis,
  refreshing: _refreshing,
  handleRefreshKpis: _handleRefreshKpis,
  showBackButton = false,
}: AdminTopHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const isMemberRole =
    user?.role === "team_member" ||
    user?.role === "editor" ||
    user?.role === "designer" ||
    location.pathname.startsWith("/workstation") ||
    location.pathname.startsWith("/member") ||
    location.pathname === "/slack";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close sidebar on Escape key & lock body scrolling when open
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }
    if (sidebarOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Close sidebar on navigation change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Check if a nav item is active
  const isPathActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    if (href === "/workstation") return location.pathname === "/workstation" || location.pathname === "/workstation/overview";
    return location.pathname.startsWith(href);
  };

  // Structured sidebar navigation sections - all directly visible, no hover required
  const adminNavSections = [
    {
      label: "Overview",
      items: [
        { label: "Admin Ops Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      label: "Revenue Engine",
      items: [
        { label: "Manage Revenues", href: "/admin/revenue", icon: TrendingUp },
        { label: "Plans & Negotiations", href: "/admin/plans", icon: FileText },
      ],
    },
    {
      label: "Team Management",
      items: [
        { label: "Team Management", href: "/admin/team", icon: Users },
        { label: "Leave Requests & Approvals", href: "/admin/leaves", icon: CalendarCheck },
        { label: "Pod Lead Dashboard", href: "/admin/pod-dashboard", icon: Briefcase },
      ],
    },
    {
      label: "Content Engine",
      items: [
        { label: "Deliverables Review", href: "/admin/deliverables", icon: Layers },
        { label: "Publishing Calendar", href: "/admin/calendar", icon: Calendar },
        { label: "Production Task Queue", href: "/admin/tasks", icon: ListTodo },
      ],
    },
    {
      label: "Client Details",
      items: [
        { label: "Client Directory & Portals", href: "/admin/clients", icon: Building2 },
      ],
    },
    {
      label: "Support & Operations",
      items: [
        { label: "Support Desk", href: "/admin/support", icon: LifeBuoy },
        { label: "SLA Performance Hub", href: "/admin/support/sla", icon: ShieldCheck },
        { label: "Slack Workspace Hub", href: "/slack", icon: MessageSquare, badge: "Chat" },
      ],
    },
    {
      label: "Governance & Settings",
      items: [
        { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
        { label: "Executive Analytics & KPIs", href: "/admin/reports", icon: BarChart3 },
        { label: "Add-ons Catalog", href: "/admin/addons", icon: Layers },
        { label: "System Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  const leadNavSections = [
    {
      label: "Team Management",
      items: [
        { label: "Pod Lead Dashboard", href: "/admin/pod-dashboard", icon: Briefcase },
        { label: "Leave Approvals & Schedule", href: "/lead/schedule", icon: CalendarCheck },
      ],
    },
    {
      label: "Content Engine",
      items: [
        { label: "Pod Task Board & Backlog", href: "/lead/tasks", icon: ListTodo },
        { label: "Deliverables Review & Sign-Off", href: "/lead/deliverables", icon: Layers },
        { label: "Publishing Calendar", href: "/admin/calendar", icon: Calendar },
      ],
    },
    {
      label: "Client Details",
      items: [
        { label: "Client Allocations", href: "/lead/clients", icon: Building2 },
      ],
    },
    {
      label: "Support & SLA",
      items: [
        { label: "SLA Performance Hub", href: "/admin/sla", icon: ShieldCheck },
        { label: "Support Desk", href: "/admin/support", icon: LifeBuoy },
        { label: "Slack Workspace Hub", href: "/slack", icon: MessageSquare, badge: "Chat" },
      ],
    },
  ];

  const memberNavSections = [
    {
      label: "Workstation",
      items: [
        { label: "Workstation Overview", href: "/workstation", icon: LayoutDashboard },
        { label: "My Production Tasks", href: "/workstation/tasks", icon: CheckSquare },
        { label: "My Schedule & PTO", href: "/workstation/schedule", icon: Calendar },
        { label: "Slack Workspace Hub", href: "/slack", icon: MessageSquare, badge: "Chat" },
      ],
    },
  ];

  const currentNavSections = isMemberRole
    ? memberNavSections
    : user?.role === "team_lead"
    ? leadNavSections
    : adminNavSections;

  const { data: serverNotifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      try {
        const data = await request<any>("/api/v1/notifications");
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.items)) return data.items;
        return DEFAULT_NOTIFICATIONS;
      } catch {
        return DEFAULT_NOTIFICATIONS;
      }
    },
    refetchInterval: 30000,
  });

  const rawNotifications = serverNotifications.length > 0 ? serverNotifications : DEFAULT_NOTIFICATIONS;
  const notificationsList = rawNotifications
    .filter((n) => !deletedIds.has(n.id))
    .filter((n) => {
      if (user?.role === "team_lead") {
        if (n.type === "revenue") return false;
        if (n.message.includes("Pod B") || n.message.includes("Pod C") || n.message.includes("Pod D") || n.message.includes("Pod E")) return false;
      }
      return true;
    })
    .map((n) => {
      const isRead = Boolean(n.is_read || readIds.has(n.id));
      if (user?.role === "team_lead") {
        if (n.link?.includes("/admin/leaves") || n.link?.includes("/admin/leave")) {
          return { ...n, is_read: isRead, link: "/lead/schedule" };
        }
        if (n.link?.includes("/admin/team")) {
          return { ...n, is_read: isRead, link: "/admin/pod-dashboard" };
        }
      }
      return { ...n, is_read: isRead };
    });
  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    const allIds = notificationsList.map((n) => n.id);
    setReadIds((prev) => new Set([...prev, ...allIds]));
    try {
      await request("/api/v1/notifications/mark-all-read", {
        method: "POST",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch {
      // optimistic fallback
    }
  };

  const handleMarkSingleAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setReadIds((prev) => new Set([...prev, id]));
    try {
      await request(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch {
      // optimistic fallback
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletedIds((prev) => new Set([...prev, id]));
    try {
      await request(`/api/v1/notifications/${id}`, {
        method: "DELETE",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch {
      // already optimistically hidden
    }
  };

  const handleClearAllNotifications = async () => {
    const allIds = notificationsList.map((n) => n.id);
    setDeletedIds((prev) => new Set([...prev, ...allIds]));
    try {
      await request("/api/v1/notifications", {
        method: "DELETE",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch {
      // already optimistically cleared
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    setReadIds((prev) => new Set([...prev, item.id]));
    try {
      await request(`/api/v1/notifications/${item.id}/read`, {
        method: "PATCH",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch {
      // optimistic fallback
    }
    setNotificationOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const getNotifIcon = (type?: string) => {
    switch (type) {
      case "leave":
        return <CalendarCheck className="w-4 h-4 text-[#7FA0D6]" />;
      case "revenue":
        return <DollarSign className="w-4 h-4 text-[#34D399]" />;
      case "team":
        return <Users className="w-4 h-4 text-[#D8BF9B]" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-[#BCCCE6]" />;
    }
  };

  const getNotifBadgeBg = (type?: string) => {
    switch (type) {
      case "leave":
        return "bg-[#7FA0D6]/15 border-[#7FA0D6]/30";
      case "revenue":
        return "bg-[#34D399]/15 border-[#34D399]/30";
      case "team":
        return "bg-[#D8BF9B]/15 border-[#D8BF9B]/30";
      default:
        return "bg-[#BCCCE6]/15 border-[#BCCCE6]/30";
    }
  };

  const resolvedTitle =
    title ||
    (location.pathname.startsWith("/workstation/tasks") || location.pathname.startsWith("/member/tasks")
      ? "My Tasks"
      : location.pathname.startsWith("/workstation/schedule") || location.pathname.startsWith("/member/schedule")
      ? "My Schedule & PTO"
      : location.pathname.startsWith("/workstation") || location.pathname.startsWith("/member")
      ? "Workstation Overview"
      : location.pathname.includes("/slack")
      ? "Slack Workspace Hub"
      : location.pathname.includes("/admin/pod-dashboard") || location.pathname.includes("/lead/dashboard")
      ? "Team Details"
      : location.pathname.includes("/lead/tasks")
      ? "Content Engine"
      : location.pathname.includes("/lead/deliverables")
      ? "Content Engine"
      : location.pathname.includes("/lead/schedule")
      ? "Team Details"
      : location.pathname.includes("/lead/clients")
      ? "Client Details"
      : location.pathname.includes("/admin/revenue")
      ? "Revenue Engine"
      : location.pathname.includes("/admin/plans") || location.pathname.includes("/admin/sales")
      ? "Manage Plans & Negotiations"
      : location.pathname.includes("/admin/team")
      ? "Team Details & Management"
      : location.pathname.includes("/admin/leaves") || location.pathname.includes("/admin/leave")
      ? "Leave Approvals"
      : location.pathname.includes("/admin/deliverables")
      ? "Deliverables"
      : location.pathname.includes("/admin/calendar")
      ? "Content Calendar"
      : location.pathname.includes("/admin/tasks")
      ? "Production Task Queue"
      : location.pathname.includes("/admin/clients")
      ? "Client Details"
      : location.pathname.includes("/admin/support/sla") || location.pathname.includes("/admin/sla")
      ? "SLA Performance"
      : location.pathname.includes("/admin/support")
      ? "Support Tickets"
      : location.pathname.includes("/admin/announcements")
      ? "Announcements"
      : location.pathname.includes("/admin/reports") || location.pathname.includes("/admin/kpi")
      ? "Executive Analytics"
      : location.pathname.includes("/admin/addons")
      ? "Add-ons Catalog"
      : location.pathname.includes("/admin/settings")
      ? "System Settings"
      : activeTab);

  return (
    <div className="sticky top-0 z-40 w-full bg-[#0B111C]/90 backdrop-blur-md pt-3 sm:pt-4 pb-2.5 sm:pb-3 px-3.5 sm:px-8 transition-all">
      <header className="max-w-[1500px] mx-auto bg-[#161F2D] rounded-2xl sm:rounded-full border border-[#2A3446] px-4 sm:px-7 lg:px-9 py-2.5 sm:py-3.5 flex items-center justify-between shadow-[0_8px_32px_rgba(5,8,16,0.6)] min-h-[58px] sm:min-h-[66px]">
        {/* Left Section: Hamburger Menu + Back Button + Brand Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="size-10 rounded-full flex items-center justify-center text-[#97A0B3] hover:text-white hover:bg-[#1F2C3F] transition-all cursor-pointer border border-transparent hover:border-[#2A3446] focus:outline-none focus:ring-2 focus:ring-[#7FA0D6] shrink-0"
            aria-label="Open navigation sidebar"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {showBackButton && (
            <Link
              to={isMemberRole ? "/workstation" : "/admin"}
              className="p-1.5 rounded-full hover:bg-[#1F2C3F] text-[#97A0B3] hover:text-white transition-colors shrink-0"
              title="Go Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}

          {/* Brand Logo */}
          <Link
            to={isMemberRole ? "/workstation" : user?.role === "team_lead" ? "/admin/pod-dashboard" : "/admin"}
            className="flex items-center gap-0.5 font-black text-white text-base sm:text-lg tracking-tight shrink-0 px-1 hover:opacity-85 transition-opacity"
            title="creo. Home"
          >
            creo<span className="text-[#7FA0D6] text-lg sm:text-xl leading-none">.</span>
          </Link>

          <span className="h-5 w-px bg-[#2A3446] mx-1 hidden sm:block shrink-0" />

          {/* Active Page Title */}
          <h1 className="text-xs sm:text-sm lg:text-base font-black text-white tracking-tight truncate">
            {resolvedTitle}
          </h1>
        </div>

        {/* Right Utility Icons (Bell with Functional Dropdown, Profile with Dropdown) */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 justify-end">
          {/* Functional Notification Bell Container */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              title="Notifications"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className={`size-10 sm:size-11 rounded-full flex items-center justify-center transition-all relative cursor-pointer ${
                notificationOpen
                  ? "bg-[#1F2C3F] text-white shadow-sm border border-[#7FA0D6]"
                  : "text-[#97A0B3] hover:text-white hover:bg-[#1F2C3F]"
              }`}
              aria-label="Notifications"
            >
              <Bell className="size-5 sm:size-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 size-4 sm:size-4.5 bg-[#7FA0D6] text-[#0B111C] rounded-full text-[10px] sm:text-[11px] font-black flex items-center justify-center border-2 border-[#161F2D] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notificationOpen && (
              <div className="absolute right-0 mt-2 sm:mt-3 w-[calc(100vw-24px)] sm:w-96 max-w-[400px] bg-[#161F2D] rounded-3xl shadow-[0_12px_40px_rgba(5,8,16,0.7)] border border-[#2A3446] z-50 overflow-hidden animate-scale-up text-left">
                {/* Header */}
                <div className="px-4 sm:px-5 py-3.5 border-b border-[#2A3446] flex items-center justify-between bg-[#0B111C]/60">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white">Notifications</h3>
                    {unreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#7FA0D6]/20 text-[#7FA0D6] border border-[#7FA0D6]/30">
                        {unreadCount} Unread
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F2C3F] text-[#97A0B3]">
                        All Caught Up
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-bold text-[#7FA0D6] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Mark all notifications as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Read
                      </button>
                    )}
                    {notificationsList.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[11px] font-bold text-[#97A0B3] hover:text-[#F87171] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Delete all notifications"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification Items List */}
                <div className="max-h-[340px] sm:max-h-[380px] overflow-y-auto divide-y divide-[#2A3446] scrollbar-thin">
                  {notificationsList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 sm:p-4 transition-colors cursor-pointer flex items-start gap-3 hover:bg-[#1F2C3F] group relative ${
                        !item.is_read ? "bg-[#7FA0D6]/10" : "bg-transparent opacity-85"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`size-8 sm:size-9 rounded-2xl flex items-center justify-center border shrink-0 ${getNotifBadgeBg(item.type)}`}>
                        {getNotifIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs truncate ${!item.is_read ? "font-bold text-white" : "font-medium text-[#F1F5F9]"}`}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!item.is_read && (
                              <>
                                <span className="w-2 h-2 rounded-full bg-[#7FA0D6]" />
                                <button
                                  type="button"
                                  title="Mark as read"
                                  onClick={(e) => handleMarkSingleAsRead(e, item.id)}
                                  className="p-1 rounded-lg text-[#7FA0D6] hover:bg-[#1F2C3F] transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {/* Delete Single Notification Button */}
                            <button
                              type="button"
                              title="Delete notification"
                              onClick={(e) => handleDeleteNotification(e, item.id)}
                              className="p-1 rounded-lg text-[#97A0B3] hover:text-[#F87171] hover:bg-[#1F2C3F] transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#97A0B3] line-clamp-2 leading-relaxed font-medium">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-[#97A0B3]/80 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.created_at || "Just now"}
                          </span>
                          {item.link && (
                            <span className="text-[#7FA0D6] font-bold flex items-center gap-0.5 hover:underline">
                              Open <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {notificationsList.length === 0 && (
                    <div className="p-8 text-center text-[#97A0B3] space-y-2">
                      <Bell className="w-8 h-8 text-[#2A3446] mx-auto" />
                      <p className="text-xs font-bold text-white">No notifications</p>
                      <p className="text-[11px] text-[#97A0B3]">You're all caught up with your workspace alerts.</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-[#0B111C]/60 border-t border-[#2A3446] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#97A0B3] font-medium">Real-time alerts</span>
                  <Link
                    to={isMemberRole ? "/workstation/schedule" : "/admin/leaves"}
                    onClick={() => setNotificationOpen(false)}
                    className="text-[11px] font-bold text-[#7FA0D6] hover:underline"
                  >
                    {isMemberRole ? "View Schedule →" : "View Approvals →"}
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Profile Avatar with Interactive Dropdown Menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              title={user?.full_name || "Profile & Account"}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="size-10 sm:size-11 rounded-full bg-[#BCCCE6] hover:bg-[#D4E2F5] text-[#0B111C] font-black text-sm sm:text-base flex items-center justify-center shadow-md shadow-[#050810]/40 cursor-pointer ml-1 transition-all focus:outline-none focus:ring-2 focus:ring-[#7FA0D6]"
              aria-label="User profile menu"
            >
              {(user?.full_name?.[0] || user?.email?.[0] || (isMemberRole ? "D" : "A")).toUpperCase()}
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 sm:mt-3 w-[calc(100vw-24px)] sm:w-72 max-w-[320px] bg-[#161F2D] rounded-3xl shadow-[0_12px_40px_rgba(5,8,16,0.7)] border border-[#2A3446] z-50 overflow-hidden animate-scale-up p-3 space-y-2 text-left">
                {/* User Header */}
                <div className="p-3 bg-[#0B111C]/80 rounded-2xl border border-[#2A3446] flex items-center gap-3">
                  <div className="size-10 rounded-full bg-[#BCCCE6] text-[#0B111C] font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {(user?.full_name?.[0] || user?.email?.[0] || (isMemberRole ? "D" : "A")).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">
                      {user?.full_name || (isMemberRole ? "David Kim" : user?.role === "team_lead" ? "Maya Lin" : "Admin User")}
                    </h4>
                    <p className="text-[11px] text-[#97A0B3] font-medium truncate">
                      {user?.email || (isMemberRole ? "david.kim@creo.agency" : "admin@creo.agency")}
                    </p>
                    <div className="mt-1">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#7FA0D6]/15 text-[#7FA0D6] border border-[#7FA0D6]/30 capitalize">
                        {isMemberRole
                          ? "Pod A · Sr. Motion"
                          : user?.role === "team_lead"
                          ? "Pod A Lead"
                          : user?.role?.replace("_", " ") || "Administrator"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-0.5 pt-1">
                  {isMemberRole ? (
                    <>
                      <Link
                        to="/workstation"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <Users className="w-4 h-4 text-[#97A0B3]" />
                        <span>Workstation Overview</span>
                      </Link>
                      <Link
                        to="/workstation/tasks"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#97A0B3]" />
                        <span>My Tasks</span>
                      </Link>
                      <Link
                        to="/workstation/schedule"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <CalendarCheck className="w-4 h-4 text-[#97A0B3]" />
                        <span>My Schedule & PTO</span>
                      </Link>
                      <Link
                        to="/slack"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#7FA0D6] hover:bg-[#1F2C3F] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Slack Workspace Hub</span>
                      </Link>
                    </>
                  ) : user?.role === "team_lead" ? (
                    <>
                      <Link
                        to="/admin/pod-dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <Users className="w-4 h-4 text-[#97A0B3]" />
                        <span>Pod Lead Dashboard</span>
                      </Link>
                      <Link
                        to="/lead/schedule"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <CalendarCheck className="w-4 h-4 text-[#97A0B3]" />
                        <span>Leave Approvals & Schedule</span>
                      </Link>
                      <Link
                        to="/lead/tasks"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#97A0B3]" />
                        <span>Pod Task Board</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <Users className="w-4 h-4 text-[#97A0B3]" />
                        <span>Admin Ops Dashboard</span>
                      </Link>
                      <Link
                        to="/admin/leaves"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <CalendarCheck className="w-4 h-4 text-[#97A0B3]" />
                        <span>Leave Management</span>
                      </Link>
                      <Link
                        to="/admin/sla"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F1F5F9] hover:bg-[#1F2C3F] hover:text-[#7FA0D6] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#97A0B3]" />
                        <span>SLA Performance Hub</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <div className="pt-2 border-t border-[#2A3446]">
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      try {
                        await logout();
                      } catch {
                        // ignore
                      }
                      navigate("/auth");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#F87171]" />
                    <span>Sign Out / Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#050810]/75 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-80 sm:w-88 max-w-[88vw] bg-[#161F2D] border-r border-[#2A3446] shadow-[0_25px_60px_rgba(5,8,16,0.95)] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#2A3446] flex items-center justify-between bg-[#0B111C]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Link
              to={isMemberRole ? "/workstation" : user?.role === "team_lead" ? "/admin/pod-dashboard" : "/admin"}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-0.5 font-black text-white text-xl tracking-tight"
            >
              creo<span className="text-[#7FA0D6] text-2xl leading-none">.</span>
            </Link>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#7FA0D6]/15 text-[#7FA0D6] border border-[#7FA0D6]/30">
              {isMemberRole ? "Workstation" : user?.role === "team_lead" ? "Pod Lead" : "Admin Ops"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="size-8 rounded-xl flex items-center justify-center text-[#97A0B3] hover:text-white hover:bg-[#1F2C3F] border border-transparent hover:border-[#2A3446] transition-colors cursor-pointer"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation List - All sections & items directly listed, zero hover */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 scrollbar-thin text-left">
          {currentNavSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[#7FA0D6]">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isPathActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? "bg-[#BCCCE6] text-[#0B111C] shadow-sm font-black"
                          : "text-[#97A0B3] hover:text-white hover:bg-[#1F2C3F]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#0B111C]" : "text-[#7FA0D6]"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-black shrink-0 ${
                            active ? "bg-[#0B111C]/20 text-[#0B111C]" : "bg-[#7FA0D6]/20 text-[#7FA0D6]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer: User Profile Card & Direct Sign Out */}
        <div className="p-3.5 border-t border-[#2A3446] bg-[#0B111C]/80 shrink-0 space-y-2 text-left">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#161F2D] border border-[#2A3446]">
            <div className="size-9 rounded-full bg-[#BCCCE6] text-[#0B111C] font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              {(user?.full_name?.[0] || user?.email?.[0] || (isMemberRole ? "D" : "A")).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">
                {user?.full_name || (isMemberRole ? "David Kim" : user?.role === "team_lead" ? "Maya Lin" : "Admin User")}
              </h4>
              <p className="text-[10px] text-[#97A0B3] font-medium truncate">
                {user?.email || (isMemberRole ? "david.kim@creo.agency" : "admin@creo.agency")}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setSidebarOpen(false);
                try {
                  await logout();
                } catch {
                  // ignore
                }
                navigate("/auth");
              }}
              className="p-1.5 rounded-lg text-[#97A0B3] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer"
              title="Sign Out / Log Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
