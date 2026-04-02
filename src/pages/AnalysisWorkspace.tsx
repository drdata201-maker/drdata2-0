import { Component, ReactNode, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Table2, BarChart3, FileText, Bot, ClipboardList, BookOpen, Maximize2, Minimize2, Check } from "lucide-react";
import { JoelChat } from "@/components/workspace/JoelChat";
import { WorkspaceResults } from "@/components/workspace/WorkspaceResults";
import { WorkspaceCharts } from "@/components/workspace/WorkspaceCharts";
import { WorkspaceExport } from "@/components/workspace/WorkspaceExport";
import { WorkspaceDataPrep } from "@/components/workspace/WorkspaceDataPrep";
import { WorkspaceInterpretation } from "@/components/workspace/WorkspaceInterpretation";
import { cn } from "@/lib/utils";

class PanelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function PanelLoading() {
  return <div className="p-4 text-sm text-muted-foreground">Assistant Joël Loading...</div>;
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
  const [projectDescription, setProjectDescription] = useState("");
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [activeTab, setActiveTab] = useState("assistant");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setAuthed(true);
    });
  }, [mounted, navigate]);

  useEffect(() => {
    if (!mounted || !authed) return;
    const id = requestAnimationFrame(() => setWorkspaceReady(true));
    return () => cancelAnimationFrame(id);
  }, [mounted, authed]);

  useEffect(() => {
    if (!projectId) return;
    (supabase.from("projects") as any)
      .select("title, description")
      .eq("id", projectId)
      .single()
      .then(({ data }: any) => {
        if (data?.title) setProjectTitle(data.title);
        if (data?.description) setProjectDescription(data.description);
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

  const tabMeta: Record<string, { maxWidth: string; minHeight: string }> = {
    assistant:      { maxWidth: "4xl", minHeight: "calc(100vh - 160px)" },
    dataprep:       { maxWidth: "6xl", minHeight: "auto" },
    results:        { maxWidth: "full", minHeight: "auto" },
    charts:         { maxWidth: "full", minHeight: "auto" },
    interpretation: { maxWidth: "4xl", minHeight: "auto" },
    export:         { maxWidth: "5xl", minHeight: "auto" },
  };

  const meta = tabMeta[activeTab] || tabMeta.assistant;

  const contentMaxW: Record<string, string> = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div className={cn(
      "flex min-h-screen flex-col bg-background transition-all duration-300",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Header */}
      <header className={cn(
        "flex items-center gap-3 border-b border-border px-4 transition-all duration-300",
        isFullscreen ? "py-2" : "py-3"
      )}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground truncate">{t("joel.workspaceTitle")}</h1>
        {projectTitle && <Badge variant="secondary" className="hidden sm:inline-flex">{projectTitle}</Badge>}
        {projectType && <Badge variant="outline" className="hidden md:inline-flex">{t(`student.type.${projectType}`)}</Badge>}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(f => !f)}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          {/* Tab navigation */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 pt-3 pb-0">
            <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto flex-wrap">
              {[
                { value: "assistant", icon: Bot, label: "Assistant" },
                { value: "dataprep", icon: ClipboardList, label: t("workspace.dataPrep") },
                { value: "results", icon: Table2, label: t("workspace.results") },
                { value: "charts", icon: BarChart3, label: t("workspace.charts") },
                { value: "interpretation", icon: BookOpen, label: t("workspace.interpretation") },
                { value: "export", icon: FileText, label: t("workspace.export") },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "relative rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none",
                    "hover:text-primary/80 hover:bg-muted/50"
                  )}
                >
                  <Icon className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content with dynamic sizing */}
          <div className={cn(
            "flex-1 px-4 py-6 lg:px-6 mx-auto w-full transition-all duration-300",
            contentMaxW[meta.maxWidth]
          )}>
            <TabsContent value="assistant" className="mt-0 animate-fade-in">
              <div
                className="rounded-xl border border-border bg-card flex flex-col shadow-sm"
                style={{ minHeight: meta.minHeight }}
              >
                <PanelBoundary fallback={<PanelLoading />}>
                  <JoelChat
                    projectId={projectId}
                    projectTitle={projectTitle}
                    projectType={projectType}
                    projectDomain={projectDomain}
                    projectDescription={projectDescription}
                    level={level}
                  />
                </PanelBoundary>
              </div>
            </TabsContent>

            <TabsContent value="dataprep" className="mt-0 animate-fade-in">
              <PanelBoundary fallback={<PanelLoading />}>
                <WorkspaceDataPrep />
              </PanelBoundary>
            </TabsContent>

            <TabsContent value="results" className="mt-0 animate-fade-in">
              <PanelBoundary fallback={<PanelLoading />}>
                <WorkspaceResults />
              </PanelBoundary>
            </TabsContent>

            <TabsContent value="charts" className="mt-0 animate-fade-in">
              <PanelBoundary fallback={<PanelLoading />}>
                <WorkspaceCharts />
              </PanelBoundary>
            </TabsContent>

            <TabsContent value="interpretation" className="mt-0 animate-fade-in">
              <PanelBoundary fallback={<PanelLoading />}>
                <WorkspaceInterpretation level={level} />
              </PanelBoundary>
            </TabsContent>

            <TabsContent value="export" className="mt-0 animate-fade-in">
              <PanelBoundary fallback={<PanelLoading />}>
                <WorkspaceExport
                  projectTitle={projectTitle}
                  projectType={projectType}
                  projectDomain={projectDomain}
                  projectDescription={projectDescription}
                  level={level}
                />
              </PanelBoundary>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
