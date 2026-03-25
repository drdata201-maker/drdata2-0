import { useLanguage } from "@/contexts/LanguageContext";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface EnterpriseChartsProps {
  companyType: "sme" | "enterprise";
}

const monthlyRevenue = [
  { month: "Jan", revenue: 12400, clients: 24 },
  { month: "Feb", revenue: 11800, clients: 22 },
  { month: "Mar", revenue: 15600, clients: 28 },
  { month: "Apr", revenue: 14200, clients: 26 },
  { month: "May", revenue: 16800, clients: 31 },
  { month: "Jun", revenue: 19200, clients: 35 },
  { month: "Jul", revenue: 18100, clients: 33 },
  { month: "Aug", revenue: 17500, clients: 30 },
  { month: "Sep", revenue: 20400, clients: 38 },
  { month: "Oct", revenue: 22100, clients: 42 },
  { month: "Nov", revenue: 21300, clients: 40 },
  { month: "Dec", revenue: 24600, clients: 45 },
];

const growthData = [
  { month: "Jan", growth: 5, target: 8 },
  { month: "Feb", growth: 3, target: 8 },
  { month: "Mar", growth: 8, target: 8 },
  { month: "Apr", growth: 6, target: 10 },
  { month: "May", growth: 10, target: 10 },
  { month: "Jun", growth: 12, target: 10 },
  { month: "Jul", growth: 9, target: 12 },
  { month: "Aug", growth: 7, target: 12 },
  { month: "Sep", growth: 14, target: 12 },
  { month: "Oct", growth: 16, target: 15 },
  { month: "Nov", growth: 13, target: 15 },
  { month: "Dec", growth: 18, target: 15 },
];

const departmentData = [
  { name: "Marketing", value: 35, fill: "hsl(var(--primary))" },
  { name: "Sales", value: 30, fill: "hsl(var(--accent))" },
  { name: "Product", value: 20, fill: "hsl(var(--muted))" },
  { name: "Support", value: 15, fill: "hsl(var(--secondary))" },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "hsl(var(--secondary))",
];

const revenueConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
};

const growthConfig: ChartConfig = {
  growth: { label: "Growth", color: "hsl(var(--primary))" },
  target: { label: "Target", color: "hsl(var(--muted-foreground))" },
};

const clientConfig: ChartConfig = {
  clients: { label: "Clients", color: "hsl(var(--primary))" },
};

const pieConfig: ChartConfig = {
  value: { label: "Performance" },
};

export function EnterpriseCharts({ companyType }: EnterpriseChartsProps) {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.charts.title")}</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart — Monthly Revenue */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.monthlyRevenue")}</h3>
          <ChartContainer config={revenueConfig} className="h-[240px] w-full">
            <BarChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Line Chart — Growth Rate */}
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.growthRate")}</h3>
          <ChartContainer config={growthConfig} className="h-[240px] w-full">
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="growth" stroke="var(--color-growth)" strokeWidth={2} dot={{ r: 3 }} />
              {companyType === "enterprise" && (
                <Line type="monotone" dataKey="target" stroke="var(--color-target)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              )}
            </LineChart>
          </ChartContainer>
        </div>

        {/* Area Chart — Customer Growth (Enterprise only) */}
        {companyType === "enterprise" && (
          <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.customerGrowth")}</h3>
            <ChartContainer config={clientConfig} className="h-[240px] w-full">
              <AreaChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="clients" stroke="var(--color-clients)" fill="var(--color-clients)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </div>
        )}

        {/* Pie Chart — Department Performance */}
        <div className={`rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md ${companyType === "sme" ? "lg:col-span-2" : ""}`}>
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.projectPerformance")}</h3>
          <ChartContainer config={pieConfig} className="mx-auto h-[260px] w-full max-w-md">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={departmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {departmentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
