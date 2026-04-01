import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function StudentAnalysisPage({ userType }: { userType: string }) {
  const { t } = useLanguage();
  const [projectCount, setProjectCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ name: string; projects: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [p, a] = await Promise.all([
        supabase.from("projects").select("id,created_at").eq("user_type", userType),
        supabase.from("analyses").select("id,created_at").eq("user_type", userType),
      ]);
      setProjectCount(p.data?.length || 0);
      setAnalysisCount(a.data?.length || 0);

      const months: typeof monthlyData = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = dt.toLocaleDateString(undefined, { month: "short" });
        const start = dt.toISOString();
        const end = new Date(dt.getFullYear(), dt.getMonth() + 1, 1).toISOString();
        const pC = (p.data || []).filter((x: any) => x.created_at >= start && x.created_at < end).length;
        months.push({ name: label, projects: pC });
      }
      setMonthlyData(months);
    };
    fetchData();
  }, []);

  const pieData = [
    { name: t("pme.history.project"), value: projectCount, color: "hsl(var(--primary))" },
    { name: t("pme.history.analysis"), value: analysisCount, color: "hsl(var(--accent))" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.quickAnalysis")}</h1>
        <p className="mt-1 text-muted-foreground">{t("student.analysis.desc")}</p>
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
