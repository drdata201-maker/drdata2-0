import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { Clock, FolderOpen, BarChart3, Eye } from "lucide-react";

interface HistoryItem {
  id: string;
  title: string;
  type: "project" | "analysis";
  status: string;
  domain?: string | null;
  created_at: string;
}

export function StudentHistoryPage({ userType, baseRoute }: { userType: string; baseRoute?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [projRes, analRes] = await Promise.all([
        (supabase.from("projects") as any).select("id,title,status,domain,created_at").eq("user_type", userType).order("created_at", { ascending: false }).limit(50),
        supabase.from("analyses").select("id,title,type,status,created_at").eq("user_type", userType).order("created_at", { ascending: false }).limit(50),
      ]);
      const combined: HistoryItem[] = [
        ...(projRes.data || []).map((d: any) => ({ ...d, type: "project" as const })),
        ...(analRes.data || []).map((d: any) => ({ ...d, type: "analysis" as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(combined);
      setLoading(false);
    };
    fetchAll();
  }, [userType]);

  const typeIcon = (type: string) => {
    return type === "project" ? <FolderOpen className="h-4 w-4 text-primary" /> : <BarChart3 className="h-4 w-4 text-primary" />;
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
          { icon: BarChart3, label: t("pme.history.analysis"), count: items.filter((i) => i.type === "analysis").length },
          { icon: Clock, label: t("student.history.total"), count: items.length },
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
                    <TableHead className="hidden sm:table-cell">{t("student.wizard.domain")}</TableHead>
                    <TableHead>{t("pme.recentProjects.status")}</TableHead>
                    <TableHead>{t("pme.recentProjects.date")}</TableHead>
                    <TableHead className="text-right">{t("pme.projects.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {typeIcon(item.type)}
                          <span className="text-sm capitalize">{item.type === "project" ? t("pme.history.project") : t("pme.history.analysis")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{item.domain || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(`student.status.${item.status}`) || item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {item.type === "project" && baseRoute && (
                          <Button variant="ghost" size="icon" onClick={() => navigate(`${baseRoute}/quick-analysis?project=${item.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
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
