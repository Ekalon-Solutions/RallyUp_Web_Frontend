'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isQuickScanner =
    pathname === '/dashboard/quick-scanner' || pathname?.startsWith('/dashboard/quick-scanner/');

  if (isQuickScanner) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
