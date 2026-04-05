import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, TrendingUp, Activity, FolderOpen, Clock, PieChart as PieIcon } from "lucide-react";

interface AnalysisRow {
  id: string;
  type: string;
  status: string;
  created_at: string;
}

interface ProjectRow {
  id: string;
  status: string;
  created_at: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1", "#ec4899",
];

export function UsageStatsPage({ userType }: { userType: string }) {
  const { t } = useLanguage();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"6" | "12" | "all">("12");

  useEffect(() => {
    const fetch = async () => {
      const [aRes, pRes] = await Promise.all([
        supabase.from("analyses").select("id,type,status,created_at").eq("user_type", userType).order("created_at", { ascending: true }).limit(500),
        (supabase.from("projects") as any).select("id,status,created_at").eq("user_type", userType).order("created_at", { ascending: true }).limit(500),
      ]);
      setAnalyses((aRes.data || []) as AnalysisRow[]);
      setProjects((pRes.data || []) as ProjectRow[]);
      setLoading(false);
    };
    fetch();
  }, [userType]);

  // Filter by period
  const cutoff = useMemo(() => {
    if (period === "all") return null;
    const d = new Date();
    d.setMonth(d.getMonth() - parseInt(period));
    return d;
  }, [period]);

  const filteredAnalyses = useMemo(() =>
    cutoff ? analyses.filter(a => new Date(a.created_at) >= cutoff) : analyses,
    [analyses, cutoff]);

  const filteredProjects = useMemo(() =>
    cutoff ? projects.filter(p => new Date(p.created_at) >= cutoff) : projects,
    [projects, cutoff]);

  // Analyses per month
  const analysesByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of filteredAnalyses) {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [filteredAnalyses]);

  // Most used analysis types
  const typeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of filteredAnalyses) {
      const type = a.type || "general";
      map[type] = (map[type] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAnalyses]);

  // Status breakdown
  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of filteredAnalyses) {
      const s = a.status || "pending";
      map[s] = (map[s] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name: t(`student.status.${name}`) || name, value }));
  }, [filteredAnalyses, t]);

  // Projects per month
  const projectsByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of filteredProjects) {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [filteredProjects]);

  // Merge monthly data for combined chart
  const monthlyOverview = useMemo(() => {
    const allMonths = new Set([
      ...analysesByMonth.map(a => a.month),
      ...projectsByMonth.map(p => p.month),
    ]);
    const aMap = Object.fromEntries(analysesByMonth.map(a => [a.month, a.count]));
    const pMap = Object.fromEntries(projectsByMonth.map(p => [p.month, p.count]));
    return Array.from(allMonths).sort().map(month => ({
      month,
      analyses: aMap[month] || 0,
      projects: pMap[month] || 0,
    }));
  }, [analysesByMonth, projectsByMonth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalAnalyses = filteredAnalyses.length;
  const totalProjects = filteredProjects.length;
  const completedAnalyses = filteredAnalyses.filter(a => a.status === "completed").length;
  const avgPerMonth = monthlyOverview.length > 0 ? Math.round(totalAnalyses / monthlyOverview.length * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      <motion.div className="flex items-center justify-between flex-wrap gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("stats.usageTitle") || "Statistiques d'utilisation"}</h1>
          <p className="mt-1 text-muted-foreground">{t("stats.usageDesc") || "Vue d'ensemble de votre activité"}</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">{t("stats.last6months") || "6 derniers mois"}</SelectItem>
            <SelectItem value="12">{t("stats.last12months") || "12 derniers mois"}</SelectItem>
            <SelectItem value="all">{t("stats.allTime") || "Tout le temps"}</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* KPI cards */}
      <motion.div className="grid grid-cols-2 gap-4 sm:grid-cols-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4, ease: [0, 0, 0.2, 1] }}>
        {[
          { icon: BarChart3, label: t("stats.totalAnalyses") || "Analyses", value: totalAnalyses, color: "text-primary" },
          { icon: FolderOpen, label: t("stats.totalProjects") || "Projets", value: totalProjects, color: "text-primary" },
          { icon: TrendingUp, label: t("stats.completed") || "Complétées", value: completedAnalyses, color: "text-primary" },
          { icon: Clock, label: t("stats.avgPerMonth") || "Moy/mois", value: avgPerMonth, color: "text-primary" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2"><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Monthly activity chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: [0, 0, 0.2, 1] }}><Card>
        <CardHeader>
          <CardTitle className="text-base">{t("stats.monthlyActivity") || "Activité mensuelle"}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyOverview.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{t("stats.noData") || "Aucune donnée"}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyOverview} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Legend />
                <Bar dataKey="analyses" name={t("pme.history.analysis") || "Analyses"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projects" name={t("pme.history.project") || "Projets"} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card></motion.div>

      <motion.div className="grid grid-cols-1 gap-6 lg:grid-cols-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4, ease: [0, 0, 0.2, 1] }}>
        {/* Analysis types pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieIcon className="h-4 w-4" />
              {t("stats.analysisTypes") || "Types d'analyses"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeDistribution.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t("stats.noData") || "Aucune donnée"}</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center">
                  {typeDistribution.slice(0, 6).map((t, i) => (
                    <Badge key={t.name} variant="outline" className="text-xs gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {t.name}: {t.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              {t("stats.statusBreakdown") || "Répartition par statut"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{t("stats.noData") || "Aucune donnée"}</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center">
                  {statusDistribution.map((s, i) => (
                    <Badge key={s.name} variant="outline" className="text-xs gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[(i + 2) % COLORS.length] }} />
                      {s.name}: {s.value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend line */}
      {analysesByMonth.length >= 2 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4, ease: [0, 0, 0.2, 1] }}><Card>
          <CardHeader>
            <CardTitle className="text-base">{t("stats.trend") || "Tendance des analyses"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analysesByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name={t("pme.history.analysis") || "Analyses"} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
