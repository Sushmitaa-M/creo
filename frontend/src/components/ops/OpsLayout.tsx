import { Outlet } from "react-router";
import { AdminBottomNav } from "./AdminBottomNav";
import { useRouteMemory } from "../../lib/useRouteMemory";
import { PortalWrapper } from "../common/AntigravityCanvas";

export function OpsLayout() {
  // Passively save current route to sessionStorage on every navigation
  useRouteMemory();

  return (
    <PortalWrapper>
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </div>
        <AdminBottomNav />
      </div>
    </PortalWrapper>
  );
}

