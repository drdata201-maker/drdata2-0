import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, FolderOpen, FileText, Users } from "lucide-react";

interface HistoryItem { id: string; title: string; type: "project" | "report" | "client"; status: string; created_at: string; }

export function FreelanceHistoryPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [projRes, repRes, cliRes] = await Promise.all([
        supabase.from("projects").select("id,title,status,created_at").eq("user_type", "freelance").order("created_at", { ascending: false }).limit(20),
        supabase.from("reports").select("id,title,status,created_at").eq("user_type", "freelance").order("created_at", { ascending: false }).limit(20),
        supabase.from("clients").select("id,name,created_at").order("created_at", { ascending: false }).limit(20),
      ]);
      const combined: HistoryItem[] = [
        ...(projRes.data || []).map((d: any) => ({ ...d, type: "project" as const })),
        ...(repRes.data || []).map((d: any) => ({ ...d, type: "report" as const })),
        ...(cliRes.data || []).map((d: any) => ({ id: d.id, title: d.name, type: "client" as const, status: "active", created_at: d.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(combined);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const typeIcon = (type: string) => {
    switch (type) {
      case "project": return <FolderOpen className="h-4 w-4 text-primary" />;
      case "report": return <FileText className="h-4 w-4 text-primary" />;
      case "client": return <Users className="h-4 w-4 text-primary" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const typeLabel = (type: string) => {
    const map: Record<string, string> = { project: t("pme.history.project"), report: t("pme.history.report"), client: t("freelance.clients") };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("pme.sidebar.history")}</h1>
        <p className="mt-1 text-muted-foreground">{t("pme.history.desc")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: FolderOpen, label: t("pme.history.project"), count: items.filter((i) => i.type === "project").length },
          { icon: FileText, label: t("pme.history.report"), count: items.filter((i) => i.type === "report").length },
          { icon: Users, label: t("freelance.clients"), count: items.filter((i) => i.type === "client").length },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2"><s.icon className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold text-foreground">{s.count}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{t("pme.history.recent")}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("pme.history.empty")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pme.history.itemType")}</TableHead>
                    <TableHead>{t("pme.recentProjects.name")}</TableHead>
                    <TableHead>{t("pme.recentProjects.status")}</TableHead>
                    <TableHead>{t("pme.recentProjects.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell><div className="flex items-center gap-2">{typeIcon(item.type)}<span className="capitalize">{typeLabel(item.type)}</span></div></TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
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
