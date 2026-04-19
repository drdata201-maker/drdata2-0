import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset } from "@/contexts/DatasetContext";
import type { AnalysisResultItem } from "@/contexts/DatasetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table2, TrendingUp, BarChart3, Upload, Layers, GitBranch, CircleDot, Pencil, Check, X, Trash2, RefreshCw, Settings2 } from "lucide-react";
import {
  generateTableTitle, generateTableInterpretation, getTableLabel,
  getDescriptiveHeadersShort, getFrequencyHeaders, getCorrelationHeaders,
  isIdentifierVariable,
  type ProjectContext,
} from "@/lib/academicFormatter";

function SignificanceBadge({ p }: { p: number }) {
  if (p < 0.001) return <Badge className="bg-green-600 text-white">p &lt; 0.001 ***</Badge>;
  if (p < 0.01) return <Badge className="bg-green-500 text-white">p &lt; 0.01 **</Badge>;
  if (p < 0.05) return <Badge className="bg-primary text-primary-foreground">p &lt; 0.05 *</Badge>;
  return <Badge variant="outline">p = {p}</Badge>;
}

type StudyLevel = "student_license" | "student_master" | "student_doctorate" | string;

/** Determine what statistical detail to show based on academic level */
function getLevelConfig(level: StudyLevel) {
  if (level.includes("doctor") || level.includes("doctorat")) {
    return { showCramersV: true, showEffectSize: true, showAdvancedMetrics: true, showAdjR2: true, showKMO: true, showCommunalities: true, showSilhouette: true, detailLevel: "doctorate" as const };
  }
  if (level.includes("master")) {
    return { showCramersV: true, showEffectSize: true, showAdvancedMetrics: false, showAdjR2: true, showKMO: true, showCommunalities: false, showSilhouette: true, detailLevel: "master" as const };
  }
  return { showCramersV: false, showEffectSize: false, showAdvancedMetrics: false, showAdjR2: false, showKMO: false, showCommunalities: false, showSilhouette: false, detailLevel: "licence" as const };
}

function DescriptiveTable({ data }: { data: NonNullable<AnalysisResultItem["descriptive"]> }) {
  const { t, lang } = useLanguage();
  const headers = getDescriptiveHeadersShort(lang);
  // Filter out identifier variables
  const filtered = data.filter(row => !isIdentifierVariable(row.variable));
  if (filtered.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-academic">
          <Table2 className="h-4 w-4 text-primary" />
          {t("results.descriptiveStats")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-academic">
            <thead>
              <tr className="border-b border-border">
                {headers.map(h => (
                  <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.variable} className="border-b border-border/50">
                  <td className="px-2 py-1.5 font-medium text-foreground">{row.variable}</td>
                  <td className="px-2 py-1.5 text-foreground">{row.n}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.mean}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.std}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.min}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.q1}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.median}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.q3}</td>
                  <td className="px-2 py-1.5 font-mono text-foreground">{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function FrequencyTable({ data }: { data: NonNullable<AnalysisResultItem["frequencies"]> }) {
  const { t, lang } = useLanguage();
  const h = getFrequencyHeaders(lang);
  const filtered = data.filter(freq => !isIdentifierVariable(freq.variable));
  if (filtered.length === 0) return null;
  return (
    <>
      {filtered.map(freq => (
        <Card key={freq.variable}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("results.frequency")}: {freq.variable}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{h.value}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{h.count}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{h.pct}</th>
                </tr>
              </thead>
              <tbody>
                {freq.categories.map(cat => (
                  <tr key={cat.value} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-foreground">{cat.value}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{cat.count}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{cat.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function CorrelationTable({ data }: { data: NonNullable<AnalysisResultItem["correlations"]> }) {
  const { t, lang } = useLanguage();
  const h = getCorrelationHeaders(lang);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-academic">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("results.correlations")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm font-academic">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{h.var1}</th>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{h.var2}</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">{h.r}</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">{h.p}</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">{h.n}</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{h.sig}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-2 py-1.5 text-foreground">{c.var1}</td>
                <td className="px-2 py-1.5 text-foreground">{c.var2}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.r}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.pValue}</td>
                <td className="px-2 py-1.5 text-right text-foreground">{c.n}</td>
                <td className="px-2 py-1.5 text-right"><SignificanceBadge p={c.pValue} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function RegressionTable({ data, level }: { data: NonNullable<AnalysisResultItem["regressions"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <>
      {data.map((reg, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">{t("results.regression")}: {reg.dependent}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline"><span className="stat-notation">R²</span> = {reg.rSquared}</Badge>
              {cfg.showAdjR2 && <Badge variant="outline">Adj. <span className="stat-notation">R²</span> = {reg.adjustedR2}</Badge>}
              <Badge variant="outline"><span className="stat-notation">F</span> = {reg.fStat}</Badge>
              <Badge variant="outline"><span className="stat-notation">N</span> = {reg.n}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm font-academic">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">B</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">SE</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">t</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.interpretation") ? "Sig." : "Sig."}</th>
                </tr>
              </thead>
              <tbody>
                {reg.coefficients.map(c => (
                  <tr key={c.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{c.variable}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.b}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.se}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.t}</td>
                    <td className="px-2 py-1.5 text-right"><SignificanceBadge p={c.p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function AnovaTable({ data }: { data: NonNullable<AnalysisResultItem["anovas"]> }) {
  const { t, lang } = useLanguage();
  const descH = getDescriptiveHeadersShort(lang);
  return (
    <>
      {data.map((a, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">ANOVA : {a.dependent} × {a.factor}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline"><span className="stat-notation">F</span>({a.dfBetween},{a.dfWithin}) = {a.fStat}</Badge>
              <SignificanceBadge p={a.pValue} />
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm font-academic">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.group")}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{descH[1]}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{descH[2]}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{descH[3]}</th>
                </tr>
              </thead>
              <tbody>
                {a.groups.map(g => (
                  <tr key={g.name} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-foreground">{g.name}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.n}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.mean}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.std}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ChiSquareTable({ data, level }: { data: NonNullable<AnalysisResultItem["chiSquares"]>; level: StudyLevel }) {
  const { t, lang } = useLanguage();
  const cfg = getLevelConfig(level);

  const categoryLabels: Record<string, Record<string, string>> = {
    fr: { Low: "Faible", Medium: "Moyen", High: "Élevé" },
    es: { Low: "Bajo", Medium: "Medio", High: "Alto" },
    de: { Low: "Niedrig", Medium: "Mittel", High: "Hoch" },
    pt: { Low: "Baixo", Medium: "Médio", High: "Alto" },
  };
  const labelMap = categoryLabels[lang] || {};
  const translateLabel = (label: string) => labelMap[label] || label;

  const autoCatText: Record<string, string> = {
    fr: "Les variables numériques ont été regroupées en catégories (Faible, Moyen, Élevé).",
    en: "Numeric variables were grouped into categories (Low, Medium, High).",
    es: "Las variables numéricas fueron agrupadas en categorías (Bajo, Medio, Alto).",
    de: "Numerische Variablen wurden in Kategorien gruppiert (Niedrig, Mittel, Hoch).",
    pt: "As variáveis numéricas foram agrupadas em categorias (Baixo, Médio, Alto).",
  };

  const relationTitle: Record<string, string> = {
    fr: "Relation entre",
    en: "Relationship between",
    es: "Relación entre",
    de: "Beziehung zwischen",
    pt: "Relação entre",
  };
  const andWord: Record<string, string> = { fr: "et", en: "and", es: "y", de: "und", pt: "e" };

  return (
    <>
      {data.map((c, i) => (
        <div key={i} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-academic">
                {t("results.chiSquareTest") || "Test du Chi-carré"} : {c.var1} × {c.var2}
              </CardTitle>
              {c.categorized && (c.categorized.var1Auto || c.categorized.var2Auto) && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  {autoCatText[lang] || autoCatText.en}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm font-academic">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("results.chiSquareTest") || "Test du Chi-carré"} :</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span className="text-muted-foreground stat-notation">χ² ({c.df})</span>
                  <span className="font-mono text-foreground">= {c.chiSquare}</span>
                </div>
                <div className="flex justify-between pl-4">
                  <span className="text-muted-foreground stat-notation">p</span>
                  <span className="font-mono text-foreground">= {c.pValue}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sig.</span>
                <SignificanceBadge p={c.pValue} />
              </div>
              {cfg.showCramersV && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground stat-notation">V de Cramér</span>
                  <span className="font-mono text-foreground">= {c.cramersV}</span>
                </div>
              )}
              {cfg.showEffectSize && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("results.effectSize") || "Taille d'effet"}</span>
                  <Badge variant="outline" className="text-xs">
                    {c.cramersV < 0.1 ? (t("results.negligible") || "Négligeable") :
                     c.cramersV < 0.3 ? (t("results.weak") || "Faible") :
                     c.cramersV < 0.5 ? (t("results.moderate") || "Modéré") :
                     (t("results.strong") || "Fort")}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {c.contingencyTable && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-academic">
                  {(relationTitle[lang] || relationTitle.en)} {c.var1} {(andWord[lang] || andWord.en)} {c.var2}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-academic">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">{c.var1} \ {c.var2}</th>
                        {c.contingencyTable.colLabels.map(cl => (
                          <th key={cl} className="px-3 py-2 text-center font-medium text-muted-foreground text-xs">{translateLabel(cl)}</th>
                        ))}
                        <th className="px-3 py-2 text-center font-medium text-primary text-xs">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.contingencyTable.rowLabels.map((rl, ri) => (
                        <tr key={rl} className="border-b border-border/50">
                          <td className="px-3 py-2 font-medium text-foreground">{translateLabel(rl)}</td>
                          {c.contingencyTable!.observed[ri].map((obs, ci) => (
                            <td key={ci} className="px-3 py-2 text-center font-mono text-foreground">
                              {obs}
                              {cfg.detailLevel !== "licence" && (
                                <span className="text-muted-foreground text-[10px] block">({c.contingencyTable!.expected[ri][ci]})</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center font-mono font-bold text-primary">{c.contingencyTable!.rowTotals[ri]}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-primary/20">
                        <td className="px-3 py-2 font-bold text-primary">Total</td>
                        {c.contingencyTable.colTotals.map((ct, ci) => (
                          <td key={ci} className="px-3 py-2 text-center font-mono font-bold text-primary">{ct}</td>
                        ))}
                        <td className="px-3 py-2 text-center font-mono font-bold text-primary">{c.contingencyTable.grandTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {cfg.detailLevel !== "licence" && (
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    {t("results.expectedInParens")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </>
  );
}

function TTestTable({ data }: { data: NonNullable<AnalysisResultItem["tTests"]> }) {
  const { t, lang } = useLanguage();
  const descH = getDescriptiveHeadersShort(lang);
  return (
    <>
      {data.map((tt, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">
              <span className="stat-notation">t</span>-Test : {tt.variable} × {tt.groupVar}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-academic">
            <div className="flex justify-between"><span className="text-muted-foreground">{tt.groups[0]} ({descH[2]})</span><span className="font-mono text-foreground">= {tt.means[0]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{tt.groups[1]} ({descH[2]})</span><span className="font-mono text-foreground">= {tt.means[1]}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">t({tt.df})</span><span className="font-mono text-foreground">= {tt.tStat}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">p</span><SignificanceBadge p={tt.pValue} /></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function PCATable({ data, level }: { data: NonNullable<AnalysisResultItem["pca"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-academic">
            <Layers className="h-4 w-4 text-primary" />
            {t("results.pcaVariance")}
          </CardTitle>
          <div className="flex gap-2 mt-1">
            {cfg.showKMO && <Badge variant="outline">KMO = {data.kmo}</Badge>}
            <Badge variant="outline">{t("results.totalVariance")}: {data.totalVarianceExplained}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.component")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.eigenvalue")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.varianceExplained")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.cumulativeVariance")}</th>
              </tr>
            </thead>
            <tbody>
              {data.components.map(c => (
                <tr key={c.component} className={`border-b border-border/50 ${c.eigenvalue >= 1 ? "bg-primary/5" : ""}`}>
                  <td className="px-2 py-1.5 font-medium text-foreground">PC{c.component}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.eigenvalue}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.varianceExplained}%</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.cumulativeVariance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("results.componentLoadings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                  {data.components.filter(c => c.eigenvalue >= 1).map(c => (
                    <th key={c.component} className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">PC{c.component}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.loadings.map(l => (
                  <tr key={l.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{l.variable}</td>
                    {l.components.slice(0, data.components.filter(c => c.eigenvalue >= 1).length).map((v, i) => (
                      <td key={i} className={`px-2 py-1.5 text-right font-mono ${Math.abs(v) >= 0.5 ? "text-primary font-bold" : "text-foreground"}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FactorAnalysisTable({ data, level }: { data: NonNullable<AnalysisResultItem["factorAnalysis"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-academic">
            <GitBranch className="h-4 w-4 text-primary" />
            {t("results.factorAnalysisTitle")}
          </CardTitle>
          <Badge variant="outline" className="mt-1 w-fit">{t("results.rotation")}: {data.rotation}</Badge>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.factor")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.eigenvalue")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.varianceExplained")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.cumulativeVariance")}</th>
              </tr>
            </thead>
            <tbody>
              {data.factors.map(f => (
                <tr key={f.factor} className="border-b border-border/50">
                  <td className="px-2 py-1.5 font-medium text-foreground">F{f.factor}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{f.eigenvalue}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{f.varianceExplained}%</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{f.cumulativeVariance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("results.rotatedLoadings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                   {data.factors.map(f => (
                    <th key={f.factor} className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">F{f.factor}</th>
                  ))}
                  {cfg.showCommunalities && <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.communality")}</th>}
                </tr>
              </thead>
              <tbody>
                {data.rotatedLoadings.map((l, li) => (
                  <tr key={l.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{l.variable}</td>
                    {l.factors.map((v, i) => (
                      <td key={i} className={`px-2 py-1.5 text-right font-mono ${Math.abs(v) >= 0.5 ? "text-primary font-bold" : "text-foreground"}`}>{v}</td>
                    ))}
                    {cfg.showCommunalities && <td className="px-2 py-1.5 text-right font-mono text-foreground">{data.communalities[li]?.extraction}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClusterAnalysisTable({ data, level }: { data: NonNullable<AnalysisResultItem["clusterAnalysis"]>; level: StudyLevel }) {
  const { t } = useLanguage();
  const cfg = getLevelConfig(level);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-academic">
            <CircleDot className="h-4 w-4 text-primary" />
            {t("results.clusterAnalysisTitle")}
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="outline">K = {data.k}</Badge>
            {cfg.showSilhouette && <Badge variant="outline">{t("results.silhouette")}: {data.silhouetteScore}</Badge>}
            {cfg.showAdvancedMetrics && <Badge variant="outline">BSS/TSS = {data.totalSS > 0 ? ((data.betweenSS / data.totalSS) * 100).toFixed(1) : 0}%</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.cluster")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.size")}</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.withinSS")}</th>
              </tr>
            </thead>
            <tbody>
              {data.clusters.map((c, i) => (
                <tr key={c.cluster} className="border-b border-border/50">
                  <td className="px-2 py-1.5 font-medium text-foreground">{t("results.cluster")} {c.cluster}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{c.size}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-foreground">{data.withinSS[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("results.clusterCentroids")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
                  {data.clusters.map(c => (
                    <th key={c.cluster} className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.cluster")} {c.cluster}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.clusters[0]?.centroid.map((cv, vi) => (
                  <tr key={cv.variable} className="border-b border-border/50">
                    <td className="px-2 py-1.5 font-medium text-foreground">{cv.variable}</td>
                    {data.clusters.map(c => (
                      <td key={c.cluster} className="px-2 py-1.5 text-right font-mono text-foreground">{c.centroid[vi]?.value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PairedTTestTable({ data }: { data: NonNullable<AnalysisResultItem["pairedTTests"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map((pt, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">
              {t("results.pairedTTest") || "Paired t-Test"}: {pt.var1} × {pt.var2}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-academic">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("results.meanDiff") || "Mean Difference"}</span><span className="font-mono text-foreground">{pt.meanDiff}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">t({pt.df})</span><span className="font-mono text-foreground">= {pt.tStat}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">p</span><SignificanceBadge p={pt.pValue} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">N</span><span className="font-mono text-foreground">{pt.n}</span></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function SpearmanTable({ data }: { data: NonNullable<AnalysisResultItem["spearmanCorrelations"]> }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-academic">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("results.spearman") || "Spearman Correlation"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm font-academic">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 1</th>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 2</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">ρ</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">p</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">N</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">Sig.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-2 py-1.5 text-foreground">{s.var1}</td>
                <td className="px-2 py-1.5 text-foreground">{s.var2}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{s.rho}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{s.pValue}</td>
                <td className="px-2 py-1.5 text-right text-foreground">{s.n}</td>
                <td className="px-2 py-1.5 text-right"><SignificanceBadge p={s.pValue} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function KendallTable({ data }: { data: NonNullable<AnalysisResultItem["kendallCorrelations"]> }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-academic">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("results.kendall") || "Kendall Tau-b"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm font-academic">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 1</th>
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Var 2</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">τ</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">p</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">N</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">Sig.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((k, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-2 py-1.5 text-foreground">{k.var1}</td>
                <td className="px-2 py-1.5 text-foreground">{k.var2}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{k.tau}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{k.pValue}</td>
                <td className="px-2 py-1.5 text-right text-foreground">{k.n}</td>
                <td className="px-2 py-1.5 text-right"><SignificanceBadge p={k.pValue} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function MannWhitneyTable({ data }: { data: NonNullable<AnalysisResultItem["mannWhitney"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map((mw, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">
              {t("results.mannWhitney") || "Mann-Whitney U"}: {mw.variable} × {mw.groupVar}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-academic">
            <div className="flex justify-between"><span className="text-muted-foreground">{mw.groups[0]} (n={mw.n1})</span><span className="text-muted-foreground">{mw.groups[1]} (n={mw.n2})</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">U</span><span className="font-mono text-foreground">= {mw.U}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">Z</span><span className="font-mono text-foreground">= {mw.z}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">p</span><SignificanceBadge p={mw.pValue} /></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function WilcoxonTable({ data }: { data: NonNullable<AnalysisResultItem["wilcoxon"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map((w, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">
              {t("results.wilcoxon") || "Wilcoxon Signed-Rank"}: {w.var1} × {w.var2}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-academic">
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">W</span><span className="font-mono text-foreground">= {w.W}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">Z</span><span className="font-mono text-foreground">= {w.z}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">p</span><SignificanceBadge p={w.pValue} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground stat-notation">N</span><span className="font-mono text-foreground">{w.n}</span></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function KruskalWallisTable({ data }: { data: NonNullable<AnalysisResultItem["kruskalWallis"]> }) {
  const { t } = useLanguage();
  return (
    <>
      {data.map((kw, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-academic">
              {t("results.kruskalWallis") || "Kruskal-Wallis"}: {kw.dependent} × {kw.factor}
            </CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline"><span className="stat-notation">H</span>({kw.df}) = {kw.H}</Badge>
              <SignificanceBadge p={kw.pValue} />
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm font-academic">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">{t("results.group")}</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">N</th>
                  <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.meanRank") || "Mean Rank"}</th>
                </tr>
              </thead>
              <tbody>
                {kw.groups.map(g => (
                  <tr key={g.name} className="border-b border-border/50">
                    <td className="px-2 py-1.5 text-foreground">{g.name}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.n}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-foreground">{g.meanRank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ShapiroWilkTable({ data }: { data: NonNullable<AnalysisResultItem["shapiroWilk"]> }) {
  const { t } = useLanguage();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-academic">
          {t("results.shapiroWilk") || "Shapiro-Wilk Normality Test"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm font-academic">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">Variable</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">W</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs stat-notation">p</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">N</th>
              <th className="px-2 py-1.5 text-right font-medium text-muted-foreground text-xs">{t("results.normality") || "Normal"}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((sw, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-2 py-1.5 font-medium text-foreground">{sw.variable}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{sw.W}</td>
                <td className="px-2 py-1.5 text-right font-mono text-foreground">{sw.pValue}</td>
                <td className="px-2 py-1.5 text-right text-foreground">{sw.n}</td>
                <td className="px-2 py-1.5 text-right">
                  <Badge variant={sw.isNormal ? "secondary" : "destructive"} className="text-xs">
                    {sw.isNormal ? (t("results.yes") || "Yes") : (t("results.no") || "No")}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CronbachAlphaTable({ data }: { data: NonNullable<AnalysisResultItem["cronbachAlpha"]> }) {
  const { t } = useLanguage();
  const reliability = data.alpha >= 0.9 ? "Excellent" : data.alpha >= 0.8 ? "Good" : data.alpha >= 0.7 ? "Acceptable" : data.alpha >= 0.6 ? "Questionable" : "Poor";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-academic">
          {t("results.cronbachAlpha") || "Cronbach's Alpha"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm font-academic">
        <div className="flex justify-between"><span className="text-muted-foreground stat-notation">α</span><span className="font-mono text-foreground text-lg font-bold">{data.alpha}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("results.reliability") || "Reliability"}</span><Badge variant="outline">{reliability}</Badge></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("results.itemCount") || "Items"}</span><span className="font-mono text-foreground">{data.itemCount}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">N</span><span className="font-mono text-foreground">{data.n}</span></div>
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">{t("results.variables") || "Variables"}: </span>
          <span className="text-xs text-foreground">{data.variables.join(", ")}</span>
        </div>
      </CardContent>
    </Card>
  );
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
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} className="text-xs min-h-[60px] resize-y" autoFocus />
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

const ANALYSIS_KEYS = [
  "descriptive_stats", "frequencies", "correlation", "t_test", "chi_square",
  "crosstab", "anova", "simple_regression", "multiple_regression",
  "pca", "factor_analysis", "cluster_analysis", "cronbach_alpha",
  "paired_t_test", "spearman", "kendall", "mann_whitney", "wilcoxon",
  "kruskal_wallis", "shapiro_wilk",
];

function AnalysisActions({
  result, onDelete, onRecalculate, onEdit,
}: {
  result: AnalysisResultItem;
  onDelete: () => void;
  onRecalculate: () => void;
  onEdit: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onEdit}>
        <Settings2 className="h-3 w-3" /> {t("results.editAnalysis")}
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onRecalculate}>
        <RefreshCw className="h-3 w-3" /> {t("results.recalculate")}
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={onDelete}>
        <Trash2 className="h-3 w-3" /> {t("results.deleteAnalysis")}
      </Button>
    </div>
  );
}

function EditAnalysisPanel({
  result, dataset, onSave, onCancel,
}: {
  result: AnalysisResultItem;
  dataset: NonNullable<ReturnType<typeof useDataset>["dataset"]>;
  onSave: (key: string, depVar?: string, indVars?: string[]) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const { activeVariables, getDisplayLabel } = useDataset();
  const [analysisKey, setAnalysisKey] = useState(result.type);
  const [depVar, setDepVar] = useState("");
  const [indVars, setIndVars] = useState<string[]>([]);

  // BLOCK 3/5 — Selection UI uses activeVariables (raw replaced by derived, excluded hidden).
  const numVars = activeVariables.filter(v => v.type === "numeric").map(v => v.name);
  const catVars = activeVariables.filter(v => v.type === "categorical" || v.type === "ordinal").map(v => v.name);
  const allVars = [...numVars, ...catVars];

  const toggleIndVar = useCallback((v: string) => {
    setIndVars(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }, []);

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="py-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("results.analysisType")}</label>
            <Select value={analysisKey} onValueChange={setAnalysisKey}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANALYSIS_KEYS.map(k => <SelectItem key={k} value={k} className="text-xs">{k.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("joel.varDependent")}</label>
            <Select value={depVar} onValueChange={setDepVar}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {allVars.map(v => <SelectItem key={v} value={v} className="text-xs">{getDisplayLabel(v)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("joel.varIndependent")}</label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {allVars.filter(v => v !== depVar).map(v => (
                <Badge key={v} variant={indVars.includes(v) ? "default" : "outline"}
                  className="cursor-pointer text-[10px]" onClick={() => toggleIndVar(v)}>
                  {getDisplayLabel(v)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>{t("common.cancel") || "Cancel"}</Button>
          <Button size="sm" className="h-7 text-xs" onClick={() => onSave(analysisKey, depVar || undefined, indVars.length ? indVars : undefined)}>
            {t("results.recalculate")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspaceResults({ level = "student_license", projectContext }: { level?: string; projectContext?: ProjectContext }) {
  const { t, lang } = useLanguage();
  const { analysisResults, dataset, tableOverrides, updateTableOverride, deleteAnalysis, replaceAnalysis } = useDataset();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!dataset) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Upload className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("results.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">{t("results.noResults")}</p>
          <p className="text-xs text-muted-foreground">{t("results.selectAnalysis")}</p>
        </CardContent>
      </Card>
    );
  }

  const tableLabel = getTableLabel(lang);

  return (
    <div className="space-y-8">
      {analysisResults.map((result, idx) => {
        const tableNum = idx + 1;
        const autoTitle = generateTableTitle(result, lang, t, projectContext);
        const autoInterp = generateTableInterpretation(result, lang, level);
        const ov = tableOverrides[result.id] || {};
        const title = ov.title || autoTitle;
        const interpretation = ov.interpretation || autoInterp;

        return (
          <div key={result.id} className="space-y-3">
            {/* Academic header with action buttons */}
            <div className="border-b-2 border-primary/20 pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-2 min-w-0">
                  <Badge variant="secondary" className="text-xs font-bold shrink-0">
                    {tableLabel} {tableNum}
                  </Badge>
                  <EditableText value={title} onChange={v => updateTableOverride(result.id, "title", v)} variant="title" />
                </div>
                <AnalysisActions
                  result={result}
                  onDelete={() => deleteAnalysis(result.id)}
                  onRecalculate={() => replaceAnalysis(result.id, result.type, "")}
                  onEdit={() => setEditingId(editingId === result.id ? null : result.id)}
                />
              </div>
            </div>

            {/* Edit panel */}
            {editingId === result.id && (
              <EditAnalysisPanel
                result={result}
                dataset={dataset}
                onSave={(key, dep, ind) => { replaceAnalysis(result.id, key, "", dep, ind); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            )}

            {/* Table content */}
            {result.descriptive && <DescriptiveTable data={result.descriptive} />}
            {result.frequencies && <FrequencyTable data={result.frequencies} />}
            {result.correlations && <CorrelationTable data={result.correlations} />}
            {result.regressions && <RegressionTable data={result.regressions} level={level} />}
            {result.tTests && <TTestTable data={result.tTests} />}
            {result.anovas && <AnovaTable data={result.anovas} />}
            {result.chiSquares && <ChiSquareTable data={result.chiSquares} level={level} />}
            {result.pca && <PCATable data={result.pca} level={level} />}
            {result.factorAnalysis && <FactorAnalysisTable data={result.factorAnalysis} level={level} />}
            {result.clusterAnalysis && <ClusterAnalysisTable data={result.clusterAnalysis} level={level} />}
            {result.pairedTTests && <PairedTTestTable data={result.pairedTTests} />}
            {result.spearmanCorrelations && <SpearmanTable data={result.spearmanCorrelations} />}
            {result.kendallCorrelations && <KendallTable data={result.kendallCorrelations} />}
            {result.mannWhitney && <MannWhitneyTable data={result.mannWhitney} />}
            {result.wilcoxon && <WilcoxonTable data={result.wilcoxon} />}
            {result.kruskalWallis && <KruskalWallisTable data={result.kruskalWallis} />}
            {result.shapiroWilk && <ShapiroWilkTable data={result.shapiroWilk} />}
            {result.cronbachAlpha && <CronbachAlphaTable data={result.cronbachAlpha} />}

            {/* Inline interpretation */}
            {interpretation && (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{t("results.interpretation") || "Interpretation"}</Badge>
                    <EditableText value={interpretation} onChange={v => updateTableOverride(result.id, "interpretation", v)} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
