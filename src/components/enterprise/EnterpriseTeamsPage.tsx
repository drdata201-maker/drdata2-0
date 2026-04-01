import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Users, Trash2, Pencil } from "lucide-react";

interface TeamRow { id: string; name: string; manager: string | null; department_id: string | null; members_count: number; status: string; created_at: string; }
interface DeptOption { id: string; name: string; }

export function EnterpriseTeamsPage() {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [manager, setManager] = useState("");
  const [deptId, setDeptId] = useState("");
  const [membersCount, setMembersCount] = useState("0");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [tRes, dRes] = await Promise.all([
      supabase.from("teams").select("*").order("created_at", { ascending: false }),
      supabase.from("departments").select("id,name"),
    ]);
    if (tRes.data) setTeams(tRes.data as TeamRow[]);
    if (dRes.data) setDepartments(dRes.data as DeptOption[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setName(""); setManager(""); setDeptId(""); setMembersCount("0"); setEditId(null); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t("pme.newAnalysis.titleRequired")); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const payload = { name: name.trim(), manager: manager.trim() || null, department_id: deptId || null, members_count: parseInt(membersCount) || 0 };
      if (editId) {
        await supabase.from("teams").update(payload).eq("id", editId);
        toast.success(t("enterprise.teams.updated"));
      } else {
        await supabase.from("teams").insert({ ...payload, user_id: session.user.id });
        toast.success(t("enterprise.teams.created"));
      }
      resetForm(); setOpen(false); fetchData();
    } catch { toast.error(t("pme.newAnalysis.error")); }
    finally { setSaving(false); }
  };

  const handleEdit = (t: TeamRow) => { setEditId(t.id); setName(t.name); setManager(t.manager || ""); setDeptId(t.department_id || ""); setMembersCount(String(t.members_count)); setOpen(true); };
  const handleDelete = async (id: string) => { await supabase.from("teams").delete().eq("id", id); setTeams((p) => p.filter((t) => t.id !== id)); toast.success(t("pme.projects.deleted")); };

  const getDeptName = (id: string | null) => departments.find((d) => d.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("enterprise.sidebar.teams")}</h1>
          <p className="mt-1 text-muted-foreground">{t("enterprise.teams.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> {t("enterprise.teams.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? t("freelance.clientManagement.edit") : t("enterprise.teams.add")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t("enterprise.teams.team")} value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder={t("enterprise.teams.manager")} value={manager} onChange={(e) => setManager(e.target.value)} />
              {departments.length > 0 && (
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger><SelectValue placeholder={t("enterprise.teams.department")} /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
              <Input placeholder={t("enterprise.teams.members")} type="number" value={membersCount} onChange={(e) => setMembersCount(e.target.value)} />
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "..." : t("settings.profile.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>{t("enterprise.sidebar.teams")} ({teams.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : teams.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("enterprise.teams.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("enterprise.teams.team")}</TableHead>
                    <TableHead>{t("enterprise.teams.manager")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("enterprise.teams.department")}</TableHead>
                    <TableHead>{t("enterprise.teams.members")}</TableHead>
                    <TableHead>{t("pme.recentProjects.status")}</TableHead>
                    <TableHead className="text-right">{t("pme.projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((tm) => (
                    <TableRow key={tm.id}>
                      <TableCell className="font-medium">{tm.name}</TableCell>
                      <TableCell>{tm.manager || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getDeptName(tm.department_id)}</TableCell>
                      <TableCell>{tm.members_count}</TableCell>
                      <TableCell><Badge variant={tm.status === "active" ? "default" : "outline"}>{tm.status}</Badge></TableCell>
                      <TableCell className="text-right flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tm)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tm.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
