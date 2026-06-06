'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const VALID = /^[A-Za-z0-9]+$/;

export default function LoginClient() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const sid = studentId.trim();
    const pwd = password.trim();
    if (!sid || !pwd || !VALID.test(sid) || !VALID.test(pwd)) {
      setError('學號與密碼只能包含英文字母與數字，且不可為空');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: sid, password: pwd }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? '登入失敗');
      return;
    }
    localStorage.setItem('currentUser', data.studentId);
    localStorage.setItem('currentUserName', data.displayName);
    router.push('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <p className="text-2xl font-bold">📚 專注學習</p>
          <p className="text-slate-500 text-sm">請登入以繼續</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">學號</label>
            <Input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="請輸入學號"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">密碼</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登入中...' : '登入'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          還沒有帳號？{' '}
          <Link href="/register" className="text-slate-900 font-medium underline">
            去註冊
          </Link>
        </p>
      </div>
    </div>
  );
}
