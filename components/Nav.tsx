'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, Timer, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: '總覽' },
  { to: '/calendar', icon: Calendar, label: '行事曆' },
  { to: '/timer', icon: Timer, label: '計時器' },
  { to: '/groups', icon: Users, label: '讀書小組' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem('currentUser'));
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem('currentUser');
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-8">
        <span className="text-lg font-bold tracking-tight text-slate-800">📚 專注學習</span>
        <nav className="flex items-center gap-1 flex-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              href={n.to}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname === n.to
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <n.icon className="h-4 w-4" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        {currentUser && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">{currentUser}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>登出</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
