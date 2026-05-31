import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: '專注學習',
  description: '讀書追蹤工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        <Nav />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
