import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table2, BarChart3, MessageSquare, FileText } from "lucide-react";

const LazyJoelChat = lazy(() => import("@/components/workspace/JoelChat").then(m => ({ default: m.JoelChat })));
const LazyWorkspaceResults = lazy(() => import("@/components/workspace/WorkspaceResults").then(m => ({ default: m.WorkspaceResults })));
const LazyWorkspaceCharts = lazy(() => import("@/components/workspace/WorkspaceCharts").then(m => ({ default: m.WorkspaceCharts })));
const LazyWorkspaceExport = lazy(() => import("@/components/workspace/WorkspaceExport").then(m => ({ default: m.WorkspaceExport })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function AnalysisWorkspace() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const level = searchParams.get("level") || "student_license";
  const projectType = searchParams.get("type") || "";
  const projectDomain = decodeURIComponent(searchParams.get("domain") || "");
  const [projectTitle, setProjectTitle] = useState("");
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else setAuthed(true);
    });
  }, [navigate]);

  useEffect(() => {
    if (!projectId) return;
    (supabase.from("projects") as any)
      .select("title")
      .eq("id", projectId)
      .single()
      .then(({ data }: any) => {
        if (data) setProjectTitle(data.title);
      });
  }, [projectId]);

  if (!mounted || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Assistant Joël...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{t("joel.workspaceTitle")}</h1>
          {projectTitle && <Badge variant="secondary">{projectTitle}</Badge>}
          {projectType && <Badge variant="outline">{t(`student.type.${projectType}`)}</Badge>}
        </header>

        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="flex w-full flex-col border-r border-border lg:w-96 lg:min-h-[calc(100vh-57px)]">
            <Suspense fallback={<LoadingFallback />}>
              <LazyJoelChat
                projectId={projectId}
                projectTitle={projectTitle}
                projectType={projectType}
                projectDomain={projectDomain}
                level={level}
              />
            </Suspense>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Tabs defaultValue="results">
              <TabsList className="mb-4">
                <TabsTrigger value="results"><Table2 className="mr-1 h-4 w-4" />{t("workspace.results")}</TabsTrigger>
                <TabsTrigger value="charts"><BarChart3 className="mr-1 h-4 w-4" />{t("workspace.charts")}</TabsTrigger>
                <TabsTrigger value="interpretation"><MessageSquare className="mr-1 h-4 w-4" />{t("workspace.interpretation")}</TabsTrigger>
                <TabsTrigger value="export"><FileText className="mr-1 h-4 w-4" />{t("workspace.export")}</TabsTrigger>
              </TabsList>

              <TabsContent value="results">
                <Suspense fallback={<LoadingFallback />}><LazyWorkspaceResults /></Suspense>
              </TabsContent>
              <TabsContent value="charts">
                <Suspense fallback={<LoadingFallback />}><LazyWorkspaceCharts /></Suspense>
              </TabsContent>
              <TabsContent value="interpretation">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{t("workspace.academicInterpretation")}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t("workspace.interpretationPlaceholder")}</p>
                </div>
              </TabsContent>
              <TabsContent value="export">
                <Suspense fallback={<LoadingFallback />}><LazyWorkspaceExport /></Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
