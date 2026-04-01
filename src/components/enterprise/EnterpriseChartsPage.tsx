import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function EnterpriseChartsPage() {
  const { t } = useLanguage();
  const [projectCount, setProjectCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [deptCount, setDeptCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ name: string; projects: number; analyses: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [p, a, r, d] = await Promise.all([
        supabase.from("projects").select("id,created_at").eq("user_type", "enterprise"),
        supabase.from("analyses").select("id,created_at").eq("user_type", "enterprise"),
        supabase.from("reports").select("id,created_at").eq("user_type", "enterprise"),
        supabase.from("departments").select("id"),
      ]);
      setProjectCount(p.data?.length || 0);
      setAnalysisCount(a.data?.length || 0);
      setReportCount(r.data?.length || 0);
      setDeptCount(d.data?.length || 0);

      const months: typeof monthlyData = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = dt.toLocaleDateString(undefined, { month: "short" });
        const start = dt.toISOString();
        const end = new Date(dt.getFullYear(), dt.getMonth() + 1, 1).toISOString();
        const pC = (p.data || []).filter((x: any) => x.created_at >= start && x.created_at < end).length;
        const aC = (a.data || []).filter((x: any) => x.created_at >= start && x.created_at < end).length;
        months.push({ name: label, projects: pC, analyses: aC });
      }
      setMonthlyData(months);
    };
    fetchData();
  }, []);

  const pieData = [
    { name: t("pme.history.project"), value: projectCount, color: "hsl(var(--primary))" },
    { name: t("pme.history.analysis"), value: analysisCount, color: "hsl(var(--accent))" },
    { name: t("pme.history.report"), value: reportCount, color: "hsl(var(--muted-foreground))" },
    { name: t("enterprise.sidebar.departments"), value: deptCount, color: "hsl(var(--secondary))" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("enterprise.sidebar.charts")}</h1>
        <p className="mt-1 text-muted-foreground">{t("pme.charts.pageDesc")}</p>
      </div>
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
                <Bar dataKey="analyses" name={t("pme.history.analysis")} fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
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
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>{t("pme.charts.trend")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" /><YAxis allowDecimals={false} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="projects" name={t("pme.history.project")} stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="analyses" name={t("pme.history.analysis")} stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
