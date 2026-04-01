import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Building2, Trash2, Pencil } from "lucide-react";

interface DeptRow { id: string; name: string; description: string | null; manager: string | null; status: string; created_at: string; }

export function EnterpriseDepartmentsPage() {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manager, setManager] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from("departments").select("*").order("created_at", { ascending: false });
    if (data) setDepartments(data as DeptRow[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setName(""); setDescription(""); setManager(""); setEditId(null); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t("pme.newAnalysis.titleRequired")); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      if (editId) {
        await supabase.from("departments").update({ name: name.trim(), description: description.trim() || null, manager: manager.trim() || null }).eq("id", editId);
        toast.success(t("enterprise.departments.updated"));
      } else {
        await supabase.from("departments").insert({ user_id: session.user.id, name: name.trim(), description: description.trim() || null, manager: manager.trim() || null });
        toast.success(t("enterprise.departments.created"));
      }
      resetForm(); setOpen(false); fetch();
    } catch { toast.error(t("pme.newAnalysis.error")); }
    finally { setSaving(false); }
  };

  const handleEdit = (d: DeptRow) => { setEditId(d.id); setName(d.name); setDescription(d.description || ""); setManager(d.manager || ""); setOpen(true); };
  const handleDelete = async (id: string) => { await supabase.from("departments").delete().eq("id", id); setDepartments((p) => p.filter((d) => d.id !== id)); toast.success(t("pme.projects.deleted")); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("enterprise.sidebar.departments")}</h1>
          <p className="mt-1 text-muted-foreground">{t("enterprise.departments.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> {t("enterprise.departments.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? t("freelance.clientManagement.edit") : t("enterprise.departments.add")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t("enterprise.departments.nameLabel")} value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder={t("enterprise.departments.managerLabel")} value={manager} onChange={(e) => setManager(e.target.value)} />
              <Textarea placeholder={t("pme.newAnalysis.descPlaceholder")} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "..." : t("settings.profile.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>{t("enterprise.sidebar.departments")} ({departments.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : departments.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("enterprise.departments.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pme.recentProjects.name")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("pme.newAnalysis.description")}</TableHead>
                    <TableHead>{t("enterprise.departments.managerLabel")}</TableHead>
                    <TableHead>{t("pme.recentProjects.status")}</TableHead>
                    <TableHead className="text-right">{t("pme.projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="hidden max-w-[200px] truncate sm:table-cell">{d.description || "—"}</TableCell>
                      <TableCell>{d.manager || "—"}</TableCell>
                      <TableCell><Badge variant={d.status === "active" ? "default" : "outline"}>{d.status}</Badge></TableCell>
                      <TableCell className="text-right flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
