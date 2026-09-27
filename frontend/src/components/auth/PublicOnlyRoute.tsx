import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../lib/auth-context";
import { getRoleHome } from "./ProtectedRoute";
import { getPostLoginRedirect } from "../../lib/useRouteMemory";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B111C] text-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="size-11 animate-spin rounded-full border-3 border-[#2A3446] border-t-[#7FA0D6] shadow-[0_0_20px_rgba(127,160,214,0.25)]" />
            <span className="absolute font-black text-xs text-[#7FA0D6]">C</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#97A0B3]">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  // Already authenticated -> redirect to saved route or role home
  if (user) {
    const defaultHome = getRoleHome(user.role);
    const destination = getPostLoginRedirect(user.role, null, defaultHome);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

