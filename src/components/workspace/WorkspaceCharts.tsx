import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import { useChartStyle } from "@/contexts/ChartStyleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, Upload } from "lucide-react";
import { buildChartData } from "@/lib/chartDataBuilder";
import { ChartStyleSettingsPanel } from "./ChartStyleSettings";

export function WorkspaceCharts() {
  const { t } = useLanguage();
  const { dataset, analysisResults } = useDataset();
  const { settings } = useChartStyle();

  const colors = settings.palette.colors;
  const barRadius: [number, number, number, number] = settings.style === "rounded" ? [4, 4, 0, 0] : settings.style === "flat" ? [0, 0, 0, 0] : [2, 2, 0, 0];

  const charts = useMemo(() => {
    if (!dataset) return [];
    return buildChartData(dataset.rawData, dataset.variables, analysisResults, t);
  }, [dataset, analysisResults, t]);

  if (!dataset) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("charts.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  if (charts.length === 0) {
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

  return (
    <div className="space-y-4">
      <ChartStyleSettingsPanel />
      <div className="grid gap-4 md:grid-cols-2">
        {charts.map(chart => (
          <Card key={chart.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm truncate">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {chart.type === "histogram" || chart.type === "bar" ? (
                  <BarChart data={chart.data as { name: string; value: number }[]}>
                    {settings.showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
                    <XAxis dataKey="name" className="text-xs" tick={settings.showLabels ? { fontSize: 10 } : false} />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill={colors[0]} radius={barRadius} />
                  </BarChart>
                ) : chart.type === "scatter" ? (
                  <ScatterChart>
                    {settings.showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
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
                      label={settings.showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
                    >
                      {(chart.data as { name: string }[]).map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <BarChart data={chart.data as { name: string; value: number }[]}>
                    {settings.showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill={colors[0]} radius={barRadius} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
