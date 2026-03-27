import { useLanguage } from "@/contexts/LanguageContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface EnterpriseChartsProps {
  companyType: "sme" | "enterprise";
}

const globalPerf = [
  { month: "Jan", revenue: 195000, costs: 142000 },
  { month: "Fév", revenue: 210000, costs: 148000 },
  { month: "Mar", revenue: 228000, costs: 151000 },
  { month: "Avr", revenue: 215000, costs: 146000 },
  { month: "Mai", revenue: 245000, costs: 155000 },
  { month: "Jun", revenue: 268000, costs: 162000 },
  { month: "Jul", revenue: 252000, costs: 158000 },
  { month: "Aoû", revenue: 241000, costs: 153000 },
  { month: "Sep", revenue: 275000, costs: 165000 },
  { month: "Oct", revenue: 298000, costs: 172000 },
  { month: "Nov", revenue: 285000, costs: 168000 },
  { month: "Déc", revenue: 320000, costs: 180000 },
];

const salesPerf = [
  { month: "Jan", b2b: 120, b2c: 85 },
  { month: "Fév", b2b: 135, b2c: 92 },
  { month: "Mar", b2b: 148, b2c: 98 },
  { month: "Avr", b2b: 142, b2c: 88 },
  { month: "Mai", b2b: 160, b2c: 105 },
  { month: "Jun", b2b: 175, b2c: 112 },
];

const deptData = [
  { name: "Marketing", value: 28, fill: "hsl(var(--primary))" },
  { name: "Finance", value: 22, fill: "hsl(var(--accent))" },
  { name: "RH", value: 12, fill: "hsl(var(--muted))" },
  { name: "Commercial", value: 25, fill: "hsl(var(--secondary))" },
  { name: "Production", value: 13, fill: "hsl(var(--primary) / 0.6)" },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--secondary))", "hsl(var(--primary) / 0.6)"];

const growthData = [
  { month: "Jan", growth: 8, target: 10 },
  { month: "Fév", growth: 10, target: 10 },
  { month: "Mar", growth: 14, target: 12 },
  { month: "Avr", growth: 11, target: 12 },
  { month: "Mai", growth: 16, target: 14 },
  { month: "Jun", growth: 18, target: 14 },
];

const revenueConfig: ChartConfig = {
  revenue: { label: "CA", color: "hsl(var(--primary))" },
  costs: { label: "Coûts", color: "hsl(var(--muted-foreground))" },
};
const salesConfig: ChartConfig = {
  b2b: { label: "B2B", color: "hsl(var(--primary))" },
  b2c: { label: "B2C", color: "hsl(var(--accent-foreground))" },
};
const growthConfig: ChartConfig = {
  growth: { label: "Croissance", color: "hsl(var(--primary))" },
  target: { label: "Objectif", color: "hsl(var(--muted-foreground))" },
};
const pieConfig: ChartConfig = { value: { label: "Performance" } };

export function EnterpriseCharts({ companyType }: EnterpriseChartsProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.charts.title")}</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Global Performance — Area */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.globalPerformance")}</h3>
          <ChartContainer config={revenueConfig} className="h-[240px] w-full">
            <AreaChart data={globalPerf}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="costs" stroke="var(--color-costs)" fill="var(--color-costs)" fillOpacity={0.08} strokeWidth={1.5} />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Sales Performance — Bar */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.salesPerformance")}</h3>
          <ChartContainer config={salesConfig} className="h-[240px] w-full">
            <BarChart data={salesPerf}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="b2b" fill="var(--color-b2b)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="b2c" fill="var(--color-b2c)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Growth — Line */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.monthlyGrowth")}</h3>
          <ChartContainer config={growthConfig} className="h-[240px] w-full">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="growth" stroke="var(--color-growth)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="target" stroke="var(--color-target)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Dept Pie */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.deptPerformance")}</h3>
          <ChartContainer config={pieConfig} className="mx-auto h-[260px] w-full max-w-md">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {deptData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        {/* Enterprise-only: Marketing & Finance charts */}
        {companyType === "enterprise" && (
          <>
            <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.marketingPerf")}</h3>
              <ChartContainer config={{ leads: { label: "Leads", color: "hsl(var(--primary))" }, conversion: { label: "Conversion", color: "hsl(var(--accent-foreground))" } }} className="h-[240px] w-full">
                <BarChart data={[
                  { month: "Jan", leads: 320, conversion: 48 },
                  { month: "Fév", leads: 385, conversion: 55 },
                  { month: "Mar", leads: 410, conversion: 62 },
                  { month: "Avr", leads: 375, conversion: 51 },
                  { month: "Mai", leads: 450, conversion: 68 },
                  { month: "Jun", leads: 520, conversion: 78 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leads" fill="var(--color-leads)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversion" fill="var(--color-conversion)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.financePerf")}</h3>
              <ChartContainer config={{ profit: { label: "Profit", color: "hsl(var(--primary))" } }} className="h-[240px] w-full">
                <AreaChart data={[
                  { month: "Jan", profit: 53000 },
                  { month: "Fév", profit: 62000 },
                  { month: "Mar", profit: 77000 },
                  { month: "Avr", profit: 69000 },
                  { month: "Mai", profit: 90000 },
                  { month: "Jun", profit: 106000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="profit" stroke="var(--color-profit)" fill="var(--color-profit)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
