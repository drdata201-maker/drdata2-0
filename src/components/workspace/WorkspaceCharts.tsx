import { useMemo, useState, useEffect, useRef, Component, type ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { useChartStyle } from "@/contexts/ChartStyleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart,
} from "recharts";
import { BarChart3, Upload, Pencil, Check, X, RefreshCw } from "lucide-react";
import { buildChartData, type ChartItem } from "@/lib/chartDataBuilder";
import { ChartStyleSettingsPanel } from "./ChartStyleSettings";
import { getFigureLabel, generateFigureInterpretation, type ProjectContext } from "@/lib/academicFormatter";

// Error boundary for individual charts — prevents one broken chart from crashing all
class ChartErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void; chartTitle: string }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Chart rendering error</p>
          <Button variant="outline" size="sm" onClick={() => { this.setState({ hasError: false }); this.props.onRetry(); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function EditableText({ value, onChange, variant = "text" }: { value: string; onChange: (v: string) => void; variant?: "title" | "text" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        {variant === "title" ? (
          <Input value={draft} onChange={e => setDraft(e.target.value)} className="text-sm font-semibold" autoFocus />
        ) : (
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="text-xs min-h-[50px] resize-y" autoFocus />
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { onChange(draft); setEditing(false); }}>
          <Check className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setDraft(value); setEditing(false); }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex items-start gap-1">
      {variant === "title" ? (
        <span className="font-semibold text-sm text-foreground">{value}</span>
      ) : (
        <span className="text-xs text-muted-foreground italic leading-relaxed">{value}</span>
      )}
      <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={() => { setDraft(value); setEditing(true); }}>
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

function SingleChart({ chart, colors, barRadius, showGrid, showLabels }: {
  chart: ChartItem; colors: string[]; barRadius: [number, number, number, number];
  showGrid: boolean; showLabels: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      {chart.type === "scree" ? (
        <ComposedChart data={chart.data as { name: string; value: number; cumulative?: number }[]}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
          <XAxis dataKey="name" className="text-xs" tick={showLabels ? { fontSize: 10 } : false} />
          <YAxis yAxisId="left" className="text-xs" />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" className="text-xs" />
          <Tooltip />
          <Bar yAxisId="left" dataKey="value" fill={colors[0]} radius={barRadius} name="Eigenvalue" />
          <Line yAxisId="right" dataKey="cumulative" stroke={colors[1] || "#10b981"} strokeWidth={2} dot={{ r: 3 }} name="Cumulative %" />
          <Legend />
        </ComposedChart>
      ) : chart.type === "cluster-scatter" ? (
        <ScatterChart>
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
          <XAxis dataKey="x" type="number" className="text-xs" name="X" />
          <YAxis dataKey="y" type="number" className="text-xs" name="Y" />
          <Tooltip />
          {Array.from(new Set((chart.data as { cluster?: number }[]).map(d => d.cluster))).sort().map((cluster, ci) => (
            <Scatter
              key={cluster}
              name={`Cluster ${cluster}`}
              data={(chart.data as { x: number; y: number; cluster: number }[]).filter(d => d.cluster === cluster)}
              fill={colors[ci % colors.length]}
            />
          ))}
          <Legend />
        </ScatterChart>
      ) : chart.type === "histogram" || chart.type === "bar" ? (
        <BarChart data={chart.data as { name: string; value: number }[]}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
          <XAxis dataKey="name" className="text-xs" tick={showLabels ? { fontSize: 10 } : false} />
          <YAxis className="text-xs" />
          <Tooltip />
          <Bar dataKey="value" fill={colors[0]} radius={barRadius} />
        </BarChart>
      ) : chart.type === "scatter" ? (
        <ScatterChart>
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
          <XAxis dataKey="x" type="number" className="text-xs" />
          <YAxis dataKey="y" type="number" className="text-xs" />
          <Tooltip />
          <Scatter data={chart.data as { x: number; y: number }[]} fill={colors[0]} />
        </ScatterChart>
      ) : chart.type === "pie" ? (
        <PieChart>
          <Pie
            data={chart.data as { name: string; value: number }[]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={showLabels ? ({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
          >
            {(chart.data as { name: string }[]).map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ) : (
        <BarChart data={chart.data as { name: string; value: number }[]}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
          <XAxis dataKey="name" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Bar dataKey="value" fill={colors[0]} radius={barRadius} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

export function WorkspaceCharts({ projectContext }: { projectContext?: ProjectContext } = {}) {
  const { t, lang } = useLanguage();
  const { dataset, analysisResults, cachedCharts, setCachedCharts } = useDataset();
  const { settings } = useChartStyle();
  const [retryKeys, setRetryKeys] = useState<Record<string, number>>({});

  const colors = settings.palette.colors;
  const barRadius: [number, number, number, number] = settings.style === "rounded" ? [4, 4, 0, 0] : settings.style === "flat" ? [0, 0, 0, 0] : [2, 2, 0, 0];

  const charts = useMemo(() => {
    if (!dataset) return [];
    // Only build from rawData if we have actual data rows
    if (!dataset.rawData || dataset.rawData.length === 0) {
      return [];
    }
    return buildChartData(dataset.rawData, dataset.variables, analysisResults, t);
  }, [dataset, analysisResults, t]);

  // Use cached charts as fallback when rawData is unavailable
  const displayCharts = charts.length > 0 ? charts : (cachedCharts as ChartItem[] || []);

  // Cache newly built charts for persistence (outside useMemo to avoid loops)
  const prevChartsRef = useRef<string>("");
  useEffect(() => {
    if (charts.length > 0) {
      const serialized = JSON.stringify(charts.map(c => c.key));
      if (serialized !== prevChartsRef.current) {
        prevChartsRef.current = serialized;
        setCachedCharts(charts as any);
      }
    }
  }, [charts, setCachedCharts]);

  const [overrides, setOverrides] = useState<Record<string, { title?: string; interpretation?: string }>>({});

  const updateOverride = (key: string, field: "title" | "interpretation", value: string) => {
    setOverrides(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const retryChart = (key: string) => {
    setRetryKeys(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  if (!dataset && displayCharts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("charts.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  const regenerateAllCharts = () => {
    setRetryKeys(prev => {
      const next: Record<string, number> = {};
      displayCharts.forEach(c => { next[c.key] = (prev[c.key] || 0) + 1; });
      return next;
    });
  };

  if (displayCharts.length === 0) {
    return (
      <div className="space-y-4">
        <ChartStyleSettingsPanel />
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">{t("charts.noCharts")}</p>
            <p className="text-xs text-muted-foreground">{t("charts.runAnalysis")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const figLabel = getFigureLabel(lang);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ChartStyleSettingsPanel />
        <Button variant="outline" size="sm" onClick={regenerateAllCharts}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {t("charts.regenerateAll") || "Regenerate All"}
        </Button>
      </div>
      <div className="space-y-6">
        {displayCharts.map((chart, idx) => {
          const figNum = idx + 1;
          const ov = overrides[chart.key] || {};
          const title = ov.title || chart.title;
          const autoInterp = generateFigureInterpretation(chart.type, chart.title, chart.data, lang);
          const interpretation = ov.interpretation || autoInterp;
          const retryKey = retryKeys[chart.key] || 0;

          return (
            <Card key={`${chart.key}-${retryKey}`}>
              {/* Academic header */}
              <CardHeader className="pb-2">
                <div className="flex items-baseline gap-2">
                  <Badge variant="secondary" className="text-xs font-bold shrink-0">
                    {figLabel} {figNum}
                  </Badge>
                  <EditableText value={title} onChange={v => updateOverride(chart.key, "title", v)} variant="title" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Chart with error boundary */}
                <ChartErrorBoundary chartTitle={title} onRetry={() => retryChart(chart.key)}>
                  <SingleChart
                    chart={chart}
                    colors={colors}
                    barRadius={barRadius}
                    showGrid={settings.showGrid}
                    showLabels={settings.showLabels}
                  />
                </ChartErrorBoundary>

                {/* Inline interpretation */}
                {interpretation && (
                  <div className="bg-muted/30 border border-dashed border-border rounded-md py-2 px-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{t("results.interpretation") || "Interpretation"}</Badge>
                      <EditableText value={interpretation} onChange={v => updateOverride(chart.key, "interpretation", v)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
