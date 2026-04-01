import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MessageSquare, Table2, BarChart3, FileText, Send, ArrowLeft } from "lucide-react";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const mockTableData = [
  { variable: "Age", n: 150, mean: 28.4, std: 5.2, min: 18, max: 45 },
  { variable: "Score", n: 150, mean: 72.1, std: 12.8, min: 35, max: 98 },
  { variable: "Revenue", n: 150, mean: 45200, std: 15800, min: 12000, max: 95000 },
];
const mockChartData = [
  { name: "18-24", value: 35 }, { name: "25-34", value: 52 },
  { name: "35-44", value: 38 }, { name: "45-54", value: 25 },
];
const mockScatterData = Array.from({ length: 30 }, (_, i) => ({
  x: 20 + Math.random() * 30, y: 50 + Math.random() * 40 + i * 0.5,
}));

export default function AnalysisWorkspace() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: t("workspace.welcome") },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: t("workspace.processing") }]);
    }, 800);
    setInput("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">{t("workspace.title")}</h1>
        {projectId && <Badge variant="secondary">ID: {projectId.slice(0, 8)}</Badge>}
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: Chat */}
        <div className="flex w-full flex-col border-r border-border lg:w-96">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("workspace.askQuestion")}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Tabs defaultValue="results">
            <TabsList className="mb-4">
              <TabsTrigger value="results"><Table2 className="mr-1 h-4 w-4" />{t("workspace.results")}</TabsTrigger>
              <TabsTrigger value="charts"><BarChart3 className="mr-1 h-4 w-4" />{t("workspace.charts")}</TabsTrigger>
              <TabsTrigger value="interpretation"><MessageSquare className="mr-1 h-4 w-4" />{t("workspace.interpretation")}</TabsTrigger>
              <TabsTrigger value="export"><FileText className="mr-1 h-4 w-4" />{t("workspace.export")}</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{t("workspace.statsTable")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          {["Variable", "N", t("workspace.mean"), t("workspace.std"), "Min", "Max"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mockTableData.map((row) => (
                          <tr key={row.variable} className="border-b border-border/50">
                            <td className="px-3 py-2 font-medium text-foreground">{row.variable}</td>
                            <td className="px-3 py-2 text-foreground">{row.n}</td>
                            <td className="px-3 py-2 text-foreground">{row.mean}</td>
                            <td className="px-3 py-2 text-foreground">{row.std}</td>
                            <td className="px-3 py-2 text-foreground">{row.min}</td>
                            <td className="px-3 py-2 text-foreground">{row.max}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t("workspace.testResults")}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">p-value</span><Badge>0.003</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">t-statistic</span><span className="font-mono text-foreground">3.12</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">R²</span><span className="font-mono text-foreground">0.78</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Coefficient</span><span className="font-mono text-foreground">0.45</span></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>{t("workspace.histogram")}</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={mockChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>{t("workspace.scatter")}</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="x" name="X" type="number" className="text-xs" />
                        <YAxis dataKey="y" name="Y" type="number" className="text-xs" />
                        <Tooltip />
                        <Scatter data={mockScatterData} fill="hsl(var(--primary))" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>{t("workspace.pieChart")}</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={mockChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {mockChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>{t("workspace.lineChart")}</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={mockChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="interpretation" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{t("workspace.academicInterpretation")}</CardTitle></CardHeader>
                <CardContent className="prose prose-sm text-foreground">
                  <p>{t("workspace.interpretationPlaceholder")}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>{t("workspace.exportResults")}</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button variant="outline">PDF</Button>
                  <Button variant="outline">Word (.docx)</Button>
                  <Button variant="outline">Excel (.xlsx)</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
