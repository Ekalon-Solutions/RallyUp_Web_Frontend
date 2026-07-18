"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  /** Gate to a specific role. "admin" is satisfied by system owners too, who outrank admins. */
  requiredRole?: "admin" | "system_owner";
  requireSystemOwner?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requiredRole,
  requireSystemOwner = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, isSystemOwner } = useAuth();
  const router = useRouter();

  const needsSystemOwner = requireSystemOwner || requiredRole === "system_owner";
  const needsAdmin = requireAdmin || requiredRole === "admin";
  const allowed = needsSystemOwner ? isSystemOwner : needsAdmin ? isAdmin || isSystemOwner : true;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/");
        return;
      }

      if (!allowed) {
        router.push("/dashboard");
        return;
      }
    }
  }, [isAuthenticated, isLoading, allowed, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}