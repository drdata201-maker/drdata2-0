import type { ChartItem } from "./chartDataBuilder";
import type { ChartStyleSettings } from "@/contexts/ChartStyleContext";

const CHART_W = 500;
const CHART_H = 300;
const PAD = { top: 40, right: 20, bottom: 50, left: 60 };

const DEFAULT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

function createCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = CHART_W * 2;
  c.height = CHART_H * 2;
  return c;
}

function drawBarChart(ctx: CanvasRenderingContext2D, data: { name?: string; value?: number }[], title: string, colors: string[], barRadius: number, showGrid: boolean, showLabels: boolean) {
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
  const maxVal = Math.max(...data.map(d => d.value || 0), 1);
  const barW = Math.min(plotW / data.length - 4, 40);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  if (showGrid) {
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
  }

  data.forEach((d, i) => {
    const x = PAD.left + (plotW / data.length) * i + (plotW / data.length - barW) / 2;
    const h = ((d.value || 0) / maxVal) * plotH;
    const y = PAD.top + plotH - h;
    ctx.fillStyle = colors[i % colors.length];

    if (barRadius > 0) {
      const r = Math.min(barRadius, barW / 2, h);
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.arcTo(x, y, x + barW, y, r);
      ctx.arcTo(x + barW, y, x + barW, y + h, r);
      ctx.lineTo(x + barW, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barW, h);
    }

    if (showLabels) {
      ctx.fillStyle = "#64748b";
      ctx.font = "9px Arial";
      ctx.textAlign = "center";
      const label = String(d.name || "");
      ctx.fillText(label.length > 8 ? label.slice(0, 7) + "…" : label, x + barW / 2, PAD.top + plotH + 14);
    }
  });
}

function drawPieChart(ctx: CanvasRenderingContext2D, data: { name?: string; value?: number }[], title: string, colors: string[], showLabels: boolean) {
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
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fill();
    angle += slice;
  });

  if (showLabels) {
    const legendX = CHART_W / 2 + 40;
    let legendY = PAD.top + 10;
    ctx.font = "10px Arial";
    ctx.textAlign = "left";
    data.forEach((d, i) => {
      if (legendY > CHART_H - 20) return;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, legendY - 8, 10, 10);
      ctx.fillStyle = "#1e293b";
      const pct = (((d.value || 0) / total) * 100).toFixed(0);
      const label = `${d.name || ""} (${pct}%)`;
      ctx.fillText(label.length > 20 ? label.slice(0, 19) + "…" : label, legendX + 14, legendY);
      legendY += 16;
    });
  }
}

function drawScatterChart(ctx: CanvasRenderingContext2D, data: { x?: number; y?: number }[], title: string, colors: string[], showGrid: boolean) {
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
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;

  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
  ctx.stroke();

  if (showGrid) {
    ctx.strokeStyle = "#e2e8f0";
    for (let i = 1; i <= 4; i++) {
      const yy = PAD.top + plotH - (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(PAD.left, yy); ctx.lineTo(PAD.left + plotW, yy); ctx.stroke();
    }
  }

  ctx.fillStyle = colors[0];
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

function drawScreeChart(ctx: CanvasRenderingContext2D, data: { name?: string; value?: number; cumulative?: number }[], title: string, colors: string[], barRadius: number, showGrid: boolean, showLabels: boolean) {
  drawBarChart(ctx, data, title, colors, barRadius, showGrid, showLabels);
  // Overlay cumulative line
  const plotW = CHART_W - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  ctx.strokeStyle = colors[1] || "#10b981";
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = PAD.left + (plotW / data.length) * i + plotW / data.length / 2;
    const y = PAD.top + plotH - ((d.cumulative || 0) / 100) * plotH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  data.forEach((d, i) => {
    const x = PAD.left + (plotW / data.length) * i + plotW / data.length / 2;
    const y = PAD.top + plotH - ((d.cumulative || 0) / 100) * plotH;
    ctx.fillStyle = colors[1] || "#10b981";
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  });
}

function drawClusterScatter(ctx: CanvasRenderingContext2D, data: { x?: number; y?: number; cluster?: number }[], title: string, colors: string[], showGrid: boolean) {
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
  const xs = data.map(d => d.x || 0), ys = data.map(d => d.y || 0);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1;

  ctx.strokeStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top); ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.lineTo(PAD.left + plotW, PAD.top + plotH); ctx.stroke();

  if (showGrid) {
    ctx.strokeStyle = "#e2e8f0";
    for (let i = 1; i <= 4; i++) {
      const yy = PAD.top + plotH - (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(PAD.left, yy); ctx.lineTo(PAD.left + plotW, yy); ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.7;
  data.forEach(d => {
    const px = PAD.left + ((d.x || 0) - xMin) / xRange * plotW;
    const py = PAD.top + plotH - ((d.y || 0) - yMin) / yRange * plotH;
    ctx.fillStyle = colors[((d.cluster || 1) - 1) % colors.length];
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Legend
  const clusters = [...new Set(data.map(d => d.cluster || 1))].sort();
  let lx = PAD.left + plotW - 80, ly = PAD.top + 10;
  ctx.font = "9px Arial"; ctx.textAlign = "left";
  clusters.forEach(c => {
    ctx.fillStyle = colors[(c - 1) % colors.length];
    ctx.fillRect(lx, ly - 7, 8, 8);
    ctx.fillStyle = "#1e293b";
    ctx.fillText(`Cluster ${c}`, lx + 11, ly);
    ly += 13;
  });
}

function renderChart(chart: ChartItem, colors: string[], barRadius: number, showGrid: boolean, showLabels: boolean): string {
  const canvas = createCanvas();
  const ctx = canvas.getContext("2d")!;

  if (chart.type === "pie") {
    drawPieChart(ctx, chart.data as { name?: string; value?: number }[], chart.title, colors, showLabels);
  } else if (chart.type === "scatter") {
    drawScatterChart(ctx, chart.data as { x?: number; y?: number }[], chart.title, colors, showGrid);
  } else if (chart.type === "scree") {
    drawScreeChart(ctx, chart.data as { name?: string; value?: number; cumulative?: number }[], chart.title, colors, barRadius, showGrid, showLabels);
  } else if (chart.type === "cluster-scatter") {
    drawClusterScatter(ctx, chart.data as { x?: number; y?: number; cluster?: number }[], chart.title, colors, showGrid);
  } else {
    drawBarChart(ctx, chart.data as { name?: string; value?: number }[], chart.title, colors, barRadius, showGrid, showLabels);
  }

  return canvas.toDataURL("image/png");
}

/** Render all charts to base64 PNG images with custom style settings */
export function renderChartsToImages(
  charts: ChartItem[],
  styleSettings?: ChartStyleSettings,
): { title: string; dataUrl: string; width: number; height: number }[] {
  const colors = styleSettings?.palette?.colors || DEFAULT_COLORS;
  const barRadius = styleSettings?.style === "rounded" ? 4 : styleSettings?.style === "sharp" ? 2 : 0;
  const showGrid = styleSettings?.showGrid ?? true;
  const showLabels = styleSettings?.showLabels ?? true;

  return charts.slice(0, 8).map(chart => ({
    title: chart.title,
    dataUrl: renderChart(chart, colors, barRadius, showGrid, showLabels),
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
