import type { ChartItem } from "./chartDataBuilder";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];
const CHART_W = 500;
const CHART_H = 300;
const PAD = { top: 40, right: 20, bottom: 50, left: 60 };

function createCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = CHART_W * 2; // retina
  c.height = CHART_H * 2;
  return c;
}

function drawBarChart(ctx: CanvasRenderingContext2D, data: { name?: string; value?: number }[], title: string) {
  const s = 2; // retina scale
  ctx.scale(s, s);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CHART_W, CHART_H);

  // Title
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title.length > 60 ? title.slice(0, 57) + "…" : title, CHART_W / 2, 22);

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => d.value || 0), 1);
  const barW = Math.min(plotW / data.length - 4, 40);

  // Axes
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  // Y ticks
  ctx.fillStyle = "#64748b";
  ctx.font = "10px Arial";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal * i) / 4;
    const yy = PAD.top + plotH - (plotH * i) / 4;
    ctx.fillText(val % 1 === 0 ? String(val) : val.toFixed(1), PAD.left - 6, yy + 3);
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(PAD.left, yy);
    ctx.lineTo(PAD.left + plotW, yy);
    ctx.stroke();
  }

  // Bars
  data.forEach((d, i) => {
    const x = PAD.left + (plotW / data.length) * i + (plotW / data.length - barW) / 2;
    const h = ((d.value || 0) / maxVal) * plotH;
    const y = PAD.top + plotH - h;
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.fillRect(x, y, barW, h);

    // Label
    ctx.fillStyle = "#64748b";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    const label = String(d.name || "");
    ctx.fillText(label.length > 8 ? label.slice(0, 7) + "…" : label, x + barW / 2, PAD.top + plotH + 14);
  });
}

function drawPieChart(ctx: CanvasRenderingContext2D, data: { name?: string; value?: number }[], title: string) {
  const s = 2;
  ctx.scale(s, s);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CHART_W, CHART_H);

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title.length > 60 ? title.slice(0, 57) + "…" : title, CHART_W / 2, 22);

  const cx = CHART_W / 2 - 60;
  const cy = PAD.top + (CHART_H - PAD.top - 20) / 2;
  const r = Math.min(cx - PAD.left, cy - PAD.top, 90);
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;

  let angle = -Math.PI / 2;
  data.forEach((d, i) => {
    const slice = ((d.value || 0) / total) * Math.PI * 2;
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fill();
    angle += slice;
  });

  // Legend
  const legendX = CHART_W / 2 + 40;
  let legendY = PAD.top + 10;
  ctx.font = "10px Arial";
  ctx.textAlign = "left";
  data.forEach((d, i) => {
    if (legendY > CHART_H - 20) return;
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.fillRect(legendX, legendY - 8, 10, 10);
    ctx.fillStyle = "#1e293b";
    const pct = (((d.value || 0) / total) * 100).toFixed(0);
    const label = `${d.name || ""} (${pct}%)`;
    ctx.fillText(label.length > 20 ? label.slice(0, 19) + "…" : label, legendX + 14, legendY);
    legendY += 16;
  });
}

function drawScatterChart(ctx: CanvasRenderingContext2D, data: { x?: number; y?: number }[], title: string) {
  const s = 2;
  ctx.scale(s, s);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CHART_W, CHART_H);

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title.length > 60 ? title.slice(0, 57) + "…" : title, CHART_W / 2, 22);

  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;

  const xs = data.map(d => d.x || 0);
  const ys = data.map(d => d.y || 0);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  // Axes
  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  // Points
  ctx.fillStyle = "#3b82f6";
  ctx.globalAlpha = 0.6;
  data.forEach(d => {
    const px = PAD.left + ((d.x || 0) - xMin) / xRange * plotW;
    const py = PAD.top + plotH - ((d.y || 0) - yMin) / yRange * plotH;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function renderChart(chart: ChartItem): string {
  const canvas = createCanvas();
  const ctx = canvas.getContext("2d")!;
  
  if (chart.type === "pie") {
    drawPieChart(ctx, chart.data as { name?: string; value?: number }[], chart.title);
  } else if (chart.type === "scatter") {
    drawScatterChart(ctx, chart.data as { x?: number; y?: number }[], chart.title);
  } else {
    drawBarChart(ctx, chart.data as { name?: string; value?: number }[], chart.title);
  }

  return canvas.toDataURL("image/png");
}

/** Render all charts to base64 PNG images */
export function renderChartsToImages(charts: ChartItem[]): { title: string; dataUrl: string; width: number; height: number }[] {
  return charts.slice(0, 8).map(chart => ({
    title: chart.title,
    dataUrl: renderChart(chart),
    width: CHART_W,
    height: CHART_H,
  }));
}

/** Convert a data URL to Uint8Array for docx ImageRun */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}
