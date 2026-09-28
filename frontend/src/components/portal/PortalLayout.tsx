import { Outlet } from "react-router";
import { PortalSidebarNew } from "./PortalSidebarNew";
import { useRouteMemory } from "../../lib/useRouteMemory";

export function PortalLayout() {
  // Passively save current route to sessionStorage on every navigation
  useRouteMemory();

  return (
    <div className="min-h-screen flex bg-[#0E1420] text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#0E1420] focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>

      {/* Fixed Left Sidebar */}
      <PortalSidebarNew />

      {/* Main Content Area */}
      <main
        id="main-content"
        className="flex-1 ml-0 xl:ml-[280px] min-h-screen overflow-y-auto"
      >
        <div className="px-6 sm:px-8 lg:px-12 py-8 lg:py-10 max-w-[1280px] mx-auto animate-page-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

/* ── Mobile Bottom Navigation ── */
import { Link, useLocation } from "react-router";
import {
  Home,
  FileCheck,
  CalendarDays,
  FolderOpen,
  HelpCircle,
} from "lucide-react";

const MOBILE_TABS = [
  { label: "Home", href: "/portal", icon: Home },
  { label: "Review", href: "/portal/deliverables", icon: FileCheck },
  { label: "Calendar", href: "/portal/calendar", icon: CalendarDays },
  { label: "Library", href: "/portal/library", icon: FolderOpen },
  { label: "Support", href: "/portal/support", icon: HelpCircle },
];

function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[100] bg-[#0E1420]/95 backdrop-blur-xl border-t border-white/[0.06] xl:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_TABS.map((item) => {
          const isActive =
            item.href === "/portal"
              ? location.pathname === "/portal" || location.pathname === "/portal/"
              : location.pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-white"
                  : "text-[#6B7280] hover:text-[#9CA3AF]"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? "scale-110" : ""}`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-[#6B7280]"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
