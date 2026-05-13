'use client';

import dynamic from 'next/dynamic';

const NotificationBell = dynamic(() => import('./NotificationBell'), {
  ssr: false,
  loading: () => <div className="w-[38px] h-[38px] rounded-xl bg-white border border-border" />,
});

export default function TopBar() {
  return (
    <div className="fixed top-3 right-4 md:right-6 z-30 flex items-center gap-2">
      <NotificationBell />
    </div>
  );
}
