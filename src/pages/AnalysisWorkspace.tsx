import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Table2, BarChart3, MessageSquare, FileText } from "lucide-react";
import { JoelChat } from "@/components/workspace/JoelChat";
import { WorkspaceResults } from "@/components/workspace/WorkspaceResults";
import { WorkspaceCharts } from "@/components/workspace/WorkspaceCharts";
import { WorkspaceExport } from "@/components/workspace/WorkspaceExport";

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
  const [workspaceReady, setWorkspaceReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setAuthed(true);
    });
  }, [mounted, navigate]);

  useEffect(() => {
    if (!mounted || !authed) return;

    const frame = requestAnimationFrame(() => {
      setWorkspaceReady(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [mounted, authed]);

  useEffect(() => {
    if (!projectId) return;

    (supabase.from("projects") as any)
      .select("title")
      .eq("id", projectId)
      .single()
      .then(({ data }: any) => {
        if (data?.title) setProjectTitle(data.title);
      });
  }, [projectId]);

  if (!mounted || !authed || !workspaceReady) {
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
          {JoelChat ? (
            <JoelChat
              projectId={projectId}
              projectTitle={projectTitle}
              projectType={projectType}
              projectDomain={projectDomain}
              level={level}
            />
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Assistant Joël Loading...</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Tabs defaultValue="results">
            <TabsList className="mb-4">
              <TabsTrigger value="results">
                <Table2 className="mr-1 h-4 w-4" />
                {t("workspace.results")}
              </TabsTrigger>
              <TabsTrigger value="charts">
                <BarChart3 className="mr-1 h-4 w-4" />
                {t("workspace.charts")}
              </TabsTrigger>
              <TabsTrigger value="interpretation">
                <MessageSquare className="mr-1 h-4 w-4" />
                {t("workspace.interpretation")}
              </TabsTrigger>
              <TabsTrigger value="export">
                <FileText className="mr-1 h-4 w-4" />
                {t("workspace.export")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              {WorkspaceResults ? <WorkspaceResults /> : <div className="text-sm text-muted-foreground">Assistant Joël Loading...</div>}
            </TabsContent>
            <TabsContent value="charts">
              {WorkspaceCharts ? <WorkspaceCharts /> : <div className="text-sm text-muted-foreground">Assistant Joël Loading...</div>}
            </TabsContent>
            <TabsContent value="interpretation">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-semibold text-foreground">{t("workspace.academicInterpretation")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t("workspace.interpretationPlaceholder")}</p>
              </div>
            </TabsContent>
            <TabsContent value="export">
              {WorkspaceExport ? <WorkspaceExport /> : <div className="text-sm text-muted-foreground">Assistant Joël Loading...</div>}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
