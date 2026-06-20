'use client';

import { DashboardLayout } from '@/components/dashboard-layout';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  // Every dashboard route — including the vendor quick-scanner — renders inside
  // the standard sidebar + header chrome so vendors get the same shell as
  // members, admins, super-admins, and system owners.
  return <DashboardLayout>{children}</DashboardLayout>;
}
