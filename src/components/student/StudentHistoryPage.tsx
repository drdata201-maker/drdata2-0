import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import { Clock, FolderOpen, BarChart3, Eye, Search, CalendarIcon, X, Filter, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface HistoryItem {
  id: string;
  title: string;
  type: "project" | "analysis";
  analysisType?: string;
  status: string;
  domain?: string | null;
  created_at: string;
}

export function StudentHistoryPage({ userType, baseRoute }: { userType: string; baseRoute?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "project" | "analysis">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    const fetchAll = async () => {
      const [projRes, analRes] = await Promise.all([
        (supabase.from("projects") as any).select("id,title,status,domain,created_at").eq("user_type", userType).order("created_at", { ascending: false }).limit(200),
        supabase.from("analyses").select("id,title,type,status,created_at").eq("user_type", userType).order("created_at", { ascending: false }).limit(200),
      ]);
      const combined: HistoryItem[] = [
        ...(projRes.data || []).map((d: any) => ({ ...d, type: "project" as const })),
        ...(analRes.data || []).map((d: any) => ({ ...d, type: "analysis" as const, analysisType: d.type })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(combined);
      setLoading(false);
    };
    fetchAll();
  }, [userType]);

  // Unique statuses for filter
  const allStatuses = useMemo(() => {
    const s = new Set(items.map(i => i.status));
    return Array.from(s).sort();
  }, [items]);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !(item.domain || "").toLowerCase().includes(q)) return false;
      }
      const d = new Date(item.created_at);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [items, filterType, filterStatus, search, dateFrom, dateTo]);

  const hasActiveFilters = filterType !== "all" || filterStatus !== "all" || !!search || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const buildExportRows = useCallback(() => {
    return filtered.map(item => ({
      [t("pme.history.itemType") || "Type"]: item.type === "project" ? t("pme.history.project") : t("pme.history.analysis"),
      [t("pme.recentProjects.name") || "Nom"]: item.title,
      [t("student.wizard.domain") || "Domaine"]: item.domain || "—",
      [t("pme.recentProjects.status") || "Statut"]: t(`student.status.${item.status}`) || item.status,
      [t("pme.recentProjects.date") || "Date"]: new Date(item.created_at).toLocaleDateString(),
    }));
  }, [filtered, t]);

  const exportCSV = useCallback(() => {
    const rows = buildExportRows();
    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `historique_${format(new Date(), "yyyy-MM-dd")}.csv`);
  }, [buildExportRows]);

  const exportExcel = useCallback(() => {
    const rows = buildExportRows();
    if (rows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historique");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `historique_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  }, [buildExportRows]);

  const handleDelete = useCallback(async (item: HistoryItem) => {
    try {
      const table = item.type === "project" ? "projects" : "analyses";
      const { error } = await (supabase.from(table) as any).delete().eq("id", item.id);
      if (error) throw error;
      setItems(prev => prev.filter(i => !(i.id === item.id && i.type === item.type)));
      toast.success(t("history.deleted") || "Élément supprimé");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la suppression");
    }
  }, [t]);

  const typeIcon = (type: string) =>
    type === "project" ? <FolderOpen className="h-4 w-4 text-primary" /> : <BarChart3 className="h-4 w-4 text-primary" />;

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-accent text-accent-foreground",
      completed: "bg-primary/20 text-primary",
      pending: "bg-muted text-muted-foreground",
      draft: "bg-muted text-muted-foreground",
    };
    return map[status] || "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("pme.sidebar.history")}</h1>
        <p className="mt-1 text-muted-foreground">{t("pme.history.desc")}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: FolderOpen, label: t("pme.history.project"), count: items.filter(i => i.type === "project").length },
          { icon: BarChart3, label: t("pme.history.analysis"), count: items.filter(i => i.type === "analysis").length },
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

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              {t("history.filters") || "Filtres"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {filtered.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs gap-1">
                    <FileText className="h-3 w-3" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportExcel} className="text-xs gap-1">
                    <FileSpreadsheet className="h-3 w-3" /> Excel
                  </Button>
                </>
              )}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
                  <X className="h-3 w-3" />
                  {t("history.clearFilters") || "Effacer"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("history.searchPlaceholder") || "Rechercher..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type filter */}
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder={t("history.filterType") || "Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("history.allTypes") || "Tous les types"}</SelectItem>
                <SelectItem value="project">{t("pme.history.project") || "Projet"}</SelectItem>
                <SelectItem value="analysis">{t("pme.history.analysis") || "Analyse"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t("history.filterStatus") || "Statut"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("history.allStatuses") || "Tous les statuts"}</SelectItem>
                {allStatuses.map(s => (
                  <SelectItem key={s} value={s}>{t(`student.status.${s}`) || s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-left text-xs font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : (t("history.from") || "Du")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("flex-1 justify-start text-left text-xs font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : (t("history.to") || "Au")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {hasActiveFilters && (
            <p className="mt-2 text-xs text-muted-foreground">
              {filtered.length} / {items.length} {t("history.resultsShown") || "résultats affichés"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>{t("pme.history.recent")}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">{t("pme.projects.loading")}</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? (t("history.noResults") || "Aucun résultat pour ces filtres")
                  : t("pme.history.empty")}
              </p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                  {t("history.clearFilters") || "Effacer les filtres"}
                </Button>
              )}
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
                  {filtered.map(item => (
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
                        <Badge variant="outline" className={statusColor(item.status)}>
                          {t(`student.status.${item.status}`) || item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.type === "project" && (
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/analysis/workspace?project=${item.id}&level=${userType}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("history.deleteTitle") || "Supprimer cet élément ?"}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("history.deleteDesc") || "Cette action est irréversible. L'élément sera définitivement supprimé."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel") || "Annuler"}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {t("common.delete") || "Supprimer"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
