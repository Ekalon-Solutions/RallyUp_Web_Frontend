import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Quick Scanner | RallyUp',
  description: 'Match-day ticket scanner for vendors and bouncers',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function QuickScannerLayout({ children }: { children: React.ReactNode }) {
  // Pass-through: the page now renders inside the shared DashboardLayout chrome
  // (sidebar + header), so this segment must not impose its own full-screen
  // black shell. The scanner views provide their own contained dark surfaces.
  return <>{children}</>;
}
