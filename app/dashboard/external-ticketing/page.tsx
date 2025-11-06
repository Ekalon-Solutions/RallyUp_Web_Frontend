"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProtectedRoute } from "@/components/protected-route";

export default function ExternalTicketingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);

  useEffect(() => {
      const loadClubs = async () => {
        if (!user) return;
        setIsLoadingClubs(true);
        const resp = await apiClient.getPublicClubs();
        if (resp.success && resp.data) {
          // public endpoint returns { clubs: [...] }
          const payload: any = resp.data;
          setClubs(payload.clubs || []);
        }
        setIsLoadingClubs(false);
      };
    loadClubs();
  }, [user]);

  return (
    <ProtectedRoute requireAdmin={true}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">External Ticketing — Clubs</h1>
              <p className="text-muted-foreground">
                Select a club to view external ticket requests
              </p>
            </div>
          </div>

          <div>
            {isLoadingClubs ? (
              <div>Loading clubs...</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {clubs.map((c) => (
                  <Card
                    key={c._id}
                    className="cursor-pointer hover:shadow-lg"
                    onClick={() =>
                      router.push(`/dashboard/external-ticketing/club/${c._id}`)
                    }>
                    <CardHeader>
                      <CardTitle>{c.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {c.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">Status: {c.status}</div>
                      <div className="text-sm mt-1">
                        Super Admin: {c.superAdmin?.name || "—"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
