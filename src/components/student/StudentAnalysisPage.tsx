import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FolderOpen, Play } from "lucide-react";

interface ProjectRow {
  id: string;
  title: string;
  status: string;
  domain: string | null;
  created_at: string;
}

export function StudentAnalysisPage({ userType, baseRoute }: { userType: string; baseRoute?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectIdParam = searchParams.get("project");

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectIdParam || "");
  const [projectCount, setProjectCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ name: string; projects: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [pRes, aRes] = await Promise.all([
        (supabase.from("projects") as any).select("id,title,status,domain,created_at").eq("user_type", userType).order("created_at", { ascending: false }),
        supabase.from("analyses").select("id,created_at").eq("user_type", userType),
      ]);
      const projectsData = (pRes.data || []) as ProjectRow[];
      setProjects(projectsData);
      setProjectCount(projectsData.length);
      setAnalysisCount(aRes.data?.length || 0);

      if (!selectedProjectId && projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }

      const months: typeof monthlyData = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = dt.toLocaleDateString(undefined, { month: "short" });
        const start = dt.toISOString();
        const end = new Date(dt.getFullYear(), dt.getMonth() + 1, 1).toISOString();
        const pC = projectsData.filter((x) => x.created_at >= start && x.created_at < end).length;
        months.push({ name: label, projects: pC });
      }
      setMonthlyData(months);
      setLoading(false);
    };
    fetchData();
  }, [userType]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const pieData = [
    { name: t("pme.history.project"), value: projectCount, color: "hsl(var(--primary))" },
    { name: t("pme.history.analysis"), value: analysisCount, color: "hsl(var(--accent))" },
  ];

  if (loading) return <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.quickAnalysis")}</h1>
        <p className="mt-1 text-muted-foreground">{t("student.analysis.desc")}</p>
      </div>

      {/* Project selector */}
      <Card>
        <CardHeader><CardTitle>{t("student.analysis.selectProject")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">{t("student.analysis.noProjects")}</p>
              {baseRoute && (
                <Button variant="outline" className="mt-3" onClick={() => navigate(`${baseRoute}/new-project`)}>
                  {t("pme.projects.create")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger><SelectValue placeholder={t("student.analysis.choosePlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} — <span className="text-muted-foreground">{p.domain || t("student.analysis.noDomain")}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && (
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{selectedProject.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedProject.domain || "—"}</p>
                  </div>
                  <Badge variant="outline">{t(`student.status.${selectedProject.status}`)}</Badge>
                  <Button size="sm">
                    <Play className="mr-1 h-3 w-3" /> {t("student.analysis.startAnalysis")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t("pme.charts.monthlyActivity")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis allowDecimals={false} />
                <Tooltip /><Legend />
                <Bar dataKey="projects" name={t("pme.history.project")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("pme.charts.distribution")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                  {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
