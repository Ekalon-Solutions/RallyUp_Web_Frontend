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
  return (
    <div className="min-h-[100dvh] bg-black text-white overscroll-none">
      {children}
    </div>
  );
}
