import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import AppProvider from '@/components/AppProvider';

export const metadata: Metadata = {
  title: 'EPMS — Equipment Project Monitoring System',
  description: 'Capital Equipment Project Monitoring System for Mechanical Engineering Division',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased noise-bg">
        <Suspense>
          <AppProvider>{children}</AppProvider>
        </Suspense>
      </body>
    </html>
  );
}
