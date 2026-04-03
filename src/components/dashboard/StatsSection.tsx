import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen, BarChart3, FileText } from "lucide-react";

export function StatsSection() {
  const { t } = useLanguage();
  const [counts, setCounts] = useState({ projects: 0, analyses: 0, reports: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const [projRes, analRes, repRes] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("analyses").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("user_id", uid),
      ]);

      setCounts({
        projects: projRes.count ?? 0,
        analyses: analRes.count ?? 0,
        reports: repRes.count ?? 0,
      });
    };
    fetchCounts();
  }, []);

  const stats = [
    { label: "dashboard.stats.projects", value: counts.projects, icon: FolderOpen },
    { label: "dashboard.stats.analyses", value: counts.analyses, icon: BarChart3 },
    { label: "dashboard.stats.reports", value: counts.reports, icon: FileText },
  ];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("dashboard.stats")}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{t(stat.label)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
