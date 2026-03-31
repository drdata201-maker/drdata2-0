import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const monthlyData = [
  { month: "Jan", revenue: 18500, growth: 5 },
  { month: "Fév", revenue: 21200, growth: 8 },
  { month: "Mar", revenue: 19800, growth: 6 },
  { month: "Avr", revenue: 24100, growth: 12 },
  { month: "Mai", revenue: 22600, growth: 10 },
  { month: "Jun", revenue: 26800, growth: 14 },
];

const salesData = [
  { category: "Produits", value: 45000 },
  { category: "Services", value: 32000 },
  { category: "Conseil", value: 18500 },
  { category: "Support", value: 12000 },
];

export function PmeCharts() {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("pme.charts.title")}</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("pme.charts.monthlyPerformance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("pme.charts.growth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="growth" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by category */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("pme.charts.sales")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="category" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
