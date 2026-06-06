'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import type { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface MemberStat {
  studentId: string;
  dayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
}

export default function GroupsClient() {
  const { studentId, checked } = useAuthGuard();
  const [groups, setGroups] = useState<Group[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, MemberStat[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!studentId) return;
    const res = await fetch(`/api/groups?studentId=${studentId}`);
    if (res.ok) setGroups(await res.json());
  }, [studentId]);

  useEffect(() => {
    if (checked && studentId) loadGroups();
  }, [checked, studentId, loadGroups]);

  async function loadStats(groupId: string) {
    const res = await fetch(`/api/groups/${groupId}/stats`);
    if (res.ok) {
      const data = await res.json();
      setStats((prev) => ({ ...prev, [groupId]: data }));
    }
  }

  function toggleExpand(groupId: string) {
    if (expandedId === groupId) {
      setExpandedId(null);
    } else {
      setExpandedId(groupId);
      setStats((prev) => { const next = { ...prev }; delete next[groupId]; return next; });
      void loadStats(groupId);
    }
  }

  async function handleCreate() {
    if (submitting) return;
    setError('');
    if (!newGroupName.trim()) { setError('請輸入小組名稱'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim(), studentId }),
      });
      if (res.ok) {
        setNewGroupName('');
        setShowCreate(false);
        await loadGroups();
      } else {
        const data = await res.json();
        setError(data.error ?? '建立失敗');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    if (submitting) return;
    setError('');
    const code = joinCode.trim().toUpperCase();
    if (!code) { setError('請輸入小組 ID'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setJoinCode('');
        setShowJoin(false);
        await loadGroups();
      } else {
        setError(data.error ?? '加入失敗');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeave(groupId: string) {
    if (submitting) return;
    setLeaveError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      if (res.ok) {
        setExpandedId(null);
        setStats((prev) => { const next = { ...prev }; delete next[groupId]; return next; });
        await loadGroups();
      } else {
        const data = await res.json();
        setLeaveError(data.error ?? '操作失敗，請重試');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy(groupId: string) {
    await navigator.clipboard.writeText(groupId);
    setCopied(groupId);
    setTimeout(() => setCopied(null), 1500);
  }

  if (!checked) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">讀書小組</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
          >
            加入小組
          </Button>
          <Button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
          >
            建立小組
          </Button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Card className="mb-4 gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">建立新小組</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="小組名稱"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? '建立中…' : '建立'}
              </Button>
              <Button variant="outline" onClick={() => { setShowCreate(false); setError(''); }}>
                取消
              </Button>
            </div>
          </CardContent>
          {error && (
            <CardFooter>
              <p className="text-sm text-red-500">{error}</p>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Join Modal */}
      {showJoin && (
        <Card className="mb-4 gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">加入小組（輸入 6 碼 ID）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="例如 A3K9QZ"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <Button onClick={handleJoin} disabled={submitting}>
                {submitting ? '加入中…' : '加入'}
              </Button>
              <Button variant="outline" onClick={() => { setShowJoin(false); setError(''); }}>
                取消
              </Button>
            </div>
          </CardContent>
          {error && (
            <CardFooter>
              <p className="text-sm text-red-500">{error}</p>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Group List */}
      {groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">📚</div>
          <p>尚未加入任何小組</p>
          <p className="text-sm mt-1">建立或加入一個小組開始！</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <Card key={g.groupId} className="gap-0 overflow-hidden py-0">
              {/* Card Header — toggle row */}
              <div
                role="button"
                tabIndex={0}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(g.groupId)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand(g.groupId)}
              >
                <div>
                  <span className="font-semibold">{g.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{g.members.length} 人</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={(e) => { e.stopPropagation(); handleCopy(g.groupId); }}
                    title="複製小組 ID"
                  >
                    {copied === g.groupId ? '已複製！' : g.groupId}
                  </Button>
                  <span className="text-muted-foreground text-sm">{expandedId === g.groupId ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded: Member Stats */}
              {expandedId === g.groupId && (
                <>
                  <CardContent className="border-t pt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs">
                          <th className="text-left pb-2 font-medium">學號</th>
                          <th className="text-right pb-2 font-medium">今日（分鐘）</th>
                          <th className="text-right pb-2 font-medium">本週（分鐘）</th>
                          <th className="text-right pb-2 font-medium">本月（分鐘）</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats[g.groupId] ? (
                          stats[g.groupId].map((m) => (
                            <tr key={m.studentId} className="border-t">
                              <td className="py-1.5 font-medium">
                                {m.studentId}
                                {m.studentId === studentId && (
                                  <span className="ml-1 text-xs text-muted-foreground">（我）</span>
                                )}
                                {m.studentId === g.createdBy && (
                                  <span className="ml-1 text-xs text-amber-500">建立者</span>
                                )}
                              </td>
                              <td className="py-1.5 text-right text-muted-foreground">{m.dayMinutes}</td>
                              <td className="py-1.5 text-right text-muted-foreground">{m.weekMinutes}</td>
                              <td className="py-1.5 text-right text-muted-foreground">{m.monthMinutes}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-3 text-center text-muted-foreground text-xs">載入中…</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                  <CardFooter className="border-t justify-end gap-3 py-3">
                    {leaveError && <span className="text-xs text-red-500">{leaveError}</span>}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleLeave(g.groupId)}
                      disabled={submitting}
                    >
                      {g.createdBy === studentId ? '解散小組' : '退出小組'}
                    </Button>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
