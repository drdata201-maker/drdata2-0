import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users, Trash2, Pencil } from "lucide-react";

interface ClientRow { id: string; name: string; email: string | null; company: string | null; phone: string | null; notes: string | null; created_at: string; }

export function FreelanceClientsPage() {
  const { t } = useLanguage();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (data) setClients(data as ClientRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const resetForm = () => { setName(""); setEmail(""); setCompany(""); setPhone(""); setNotes(""); setEditId(null); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t("pme.newAnalysis.titleRequired")); return; }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (editId) {
        const { error } = await supabase.from("clients").update({ name: name.trim(), email: email.trim() || null, company: company.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null }).eq("id", editId);
        if (error) throw error;
        toast.success(t("freelance.clients.updated"));
      } else {
        const { error } = await supabase.from("clients").insert({ user_id: session.user.id, name: name.trim(), email: email.trim() || null, company: company.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null });
        if (error) throw error;
        toast.success(t("freelance.clients.created"));
      }
      resetForm(); setOpen(false); fetchClients();
    } catch { toast.error(t("pme.newAnalysis.error")); }
    finally { setSaving(false); }
  };

  const handleEdit = (c: ClientRow) => {
    setEditId(c.id); setName(c.name); setEmail(c.email || ""); setCompany(c.company || ""); setPhone(c.phone || ""); setNotes(c.notes || ""); setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    toast.success(t("freelance.clients.deleted"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("freelance.clients")}</h1>
          <p className="mt-1 text-muted-foreground">{t("freelance.clients.desc")}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> {t("freelance.clientManagement.add")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? t("freelance.clientManagement.edit") : t("freelance.clientManagement.add")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder={t("freelance.clientManagement.name")} value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder={t("freelance.clientManagement.email")} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Input placeholder={t("freelance.clients.company")} value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input placeholder={t("freelance.clients.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Textarea placeholder={t("freelance.clients.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "..." : editId ? t("settings.profile.save") : t("freelance.clientManagement.add")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("freelance.clients")} ({clients.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("freelance.clientManagement.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("freelance.clientManagement.name")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("freelance.clientManagement.email")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("freelance.clients.company")}</TableHead>
                    <TableHead>{t("pme.recentProjects.date")}</TableHead>
                    <TableHead className="text-right">{t("pme.projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.email || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.company || "—"}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
