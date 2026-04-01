import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const mockTableData = [
  { variable: "Age", n: 150, mean: 28.4, std: 5.2, min: 18, max: 45 },
  { variable: "Score", n: 150, mean: 72.1, std: 12.8, min: 35, max: 98 },
  { variable: "Revenue", n: 150, mean: 45200, std: 15800, min: 12000, max: 95000 },
];

export function WorkspaceResults() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
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
    </div>
  );
}
