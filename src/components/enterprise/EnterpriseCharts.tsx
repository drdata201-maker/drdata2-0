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
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const monthlyData = [
  { month: "Jan", sales: 4200, growth: 5 },
  { month: "Feb", sales: 3800, growth: 3 },
  { month: "Mar", sales: 5100, growth: 8 },
  { month: "Apr", sales: 4700, growth: 6 },
  { month: "May", sales: 5300, growth: 10 },
  { month: "Jun", sales: 6100, growth: 12 },
];

const pieData = [
  { name: "Marketing", value: 35 },
  { name: "Sales", value: 30 },
  { name: "Product", value: 20 },
  { name: "Support", value: 15 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "hsl(var(--secondary))",
];

const barConfig: ChartConfig = {
  sales: { label: "Sales", color: "hsl(var(--primary))" },
};

const lineConfig: ChartConfig = {
  growth: { label: "Growth", color: "hsl(var(--primary))" },
};

const pieConfig: ChartConfig = {
  value: { label: "Performance" },
};

export function EnterpriseCharts() {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{t("enterprise.charts.title")}</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart — Sales */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.salesByMonth")}</h3>
          <ChartContainer config={barConfig} className="h-[220px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Line Chart — Growth */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.monthlyGrowth")}</h3>
          <ChartContainer config={lineConfig} className="h-[220px] w-full">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="growth" stroke="var(--color-growth)" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Pie Chart — Performance */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-foreground">{t("enterprise.charts.projectPerformance")}</h3>
          <ChartContainer config={pieConfig} className="mx-auto h-[250px] w-full max-w-md">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, index) => (
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
