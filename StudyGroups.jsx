import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Copy, LogIn, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { startOfWeek } from "date-fns";

export default function StudyGroups() {
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberStats, setMemberStats] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", code: "" });

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const allGroups = await base44.entities.StudyGroup.list("-created_date", 100);
      const myGroups = allGroups.filter((g) => g.member_ids?.includes(me.id));
      setGroups(myGroups);
    };
    init();
  }, []);

  const handleCreate = async () => {
    if (!form.name) { toast.error("請輸入小組名稱"); return; }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await base44.entities.StudyGroup.create({
      name: form.name,
      description: form.description,
      member_ids: [user.id],
      invite_code: code,
    });
    setShowCreate(false);
    setForm({ name: "", description: "", code: "" });
    toast.success("小組已建立");
    const allGroups = await base44.entities.StudyGroup.list("-created_date", 100);
    setGroups(allGroups.filter((g) => g.member_ids?.includes(user.id)));
  };

  const handleJoin = async () => {
    if (!form.code) { toast.error("請輸入邀請碼"); return; }
    const allGroups = await base44.entities.StudyGroup.list("-created_date", 200);
    const target = allGroups.find((g) => g.invite_code === form.code.toUpperCase());
    if (!target) { toast.error("找不到該小組"); return; }
    if (target.member_ids?.includes(user.id)) { toast.info("你已經在這個小組了"); return; }
    await base44.entities.StudyGroup.update(target.id, {
      member_ids: [...(target.member_ids || []), user.id],
    });
    setShowJoin(false);
    setForm({ name: "", description: "", code: "" });
    toast.success("已加入小組");
    const refreshed = await base44.entities.StudyGroup.list("-created_date", 100);
    setGroups(refreshed.filter((g) => g.member_ids?.includes(user.id)));
  };

  const viewGroup = async (group) => {
    setSelectedGroup(group);
    const allUsers = await base44.entities.User.list();
    const groupMembers = allUsers.filter((u) => group.member_ids?.includes(u.id));
    setMembers(groupMembers);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const sessions = await base44.entities.StudySession.filter({
      date: { $gte: weekStart.toISOString() },
    });

    const stats = groupMembers.map((m) => {
      const mSessions = sessions.filter((s) => s.created_by_id === m.id);
      const totalMin = mSessions.reduce((a, b) => a + (b.duration_minutes || 0), 0);
      const avgFocus = mSessions.length > 0
        ? Math.round(mSessions.reduce((a, b) => a + (b.focus_score || 0), 0) / mSessions.length)
        : 0;
      return { user: m, totalMin, avgFocus, sessions: mSessions.length };
    }).sort((a, b) => b.totalMin - a.totalMin);

    setMemberStats(stats);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">讀書小組</h1>
          <p className="text-muted-foreground text-sm mt-1">和同學一起學習，互相激勵</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowJoin(true)} className="gap-2">
            <LogIn className="h-4 w-4" /> 加入小組
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> 建立小組
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground mt-4">尚未加入任何小組</p>
          <p className="text-sm text-muted-foreground mt-1">建立一個新小組或用邀請碼加入</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => viewGroup(g)}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{g.name}</h3>
                <span className="text-xs bg-muted px-2 py-1 rounded-full">{g.member_ids?.length || 0} 人</span>
              </div>
              {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">邀請碼：</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{g.invite_code}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(g.invite_code);
                  toast.success("已複製邀請碼");
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group detail dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary" />
              {selectedGroup?.name} — 本週排行
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {memberStats.map((stat, i) => (
              <div key={stat.user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <span className={`text-lg font-bold min-w-[28px] ${i === 0 ? "text-secondary" : "text-muted-foreground"}`}>
                  #{i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{stat.user.full_name || stat.user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.totalMin >= 60 ? `${Math.floor(stat.totalMin / 60)}h${stat.totalMin % 60}m` : `${stat.totalMin}m`}
                    {" · "}專注度 {stat.avgFocus}% · {stat.sessions} 次學習
                  </p>
                </div>
              </div>
            ))}
            {memberStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">本週尚無學習記錄</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>建立讀書小組</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>小組名稱</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>描述（選填）</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button onClick={handleCreate} className="w-full">建立</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent>
          <DialogHeader><DialogTitle>加入讀書小組</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>邀請碼</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="輸入6位邀請碼" /></div>
            <Button onClick={handleJoin} className="w-full">加入</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}