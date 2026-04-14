// Academic table and graph formatting utilities for Dr Data 2.0

import type { AnalysisResultItem } from "@/lib/statsEngine";
import { formatMetadataLabel } from "@/lib/projectMetadataLabels";

export interface ProjectContext {
  title?: string;
  domain?: string;
  type?: string;
  objective?: string;
  specificObjectives?: string[];
  studyType?: string;
  studyDesign?: string;
  population?: string;
  primaryVariable?: string;
  hypothesis?: string;
  independentVars?: string;
  dependentVar?: string;
  controlVars?: string;
  mediatorVars?: string;
  moderatorVars?: string;
  conceptualModel?: string;
  advancedHypothesis?: string;
}

export interface AcademicTableMeta {
  number: number;
  title: string;
  interpretation: string;
}

export interface AcademicFigureMeta {
  number: number;
  title: string;
  interpretation: string;
}

type TFn = (key: string) => string;

const TABLE_LABEL: Record<string, string> = {
  fr: "Tableau", en: "Table", es: "Tabla", de: "Tabelle", pt: "Tabela",
};
const FIGURE_LABEL: Record<string, string> = {
  fr: "Figure", en: "Figure", es: "Figura", de: "Abbildung", pt: "Figura",
};

// Identifier variable patterns to exclude from tables/charts
const ID_PATTERNS = [
  /^id$/i, /^identifier$/i, /^identifiant$/i, /^index$/i, /^code$/i,
  /^record[_ ]?id$/i, /^numéro$/i, /^numero$/i, /^num$/i, /^no$/i,
  /^row[_ ]?id$/i, /^entry$/i, /^_id$/i, /^record$/i,
  /^participant[_ ]?id$/i, /^serial[_ ]?(number|no)$/i, /^student[_ ]?id$/i,
  /^row[_ ]?(number|num|no)$/i, /^sn$/i, /^s\.?n\.?$/i, /^n°$/i,
  /^matricule$/i, /^matricula$/i, /^matrikelnummer$/i,
  /^respondent[_ ]?id$/i, /^case[_ ]?id$/i, /^subject[_ ]?id$/i,
  /^observation$/i, /^obs$/i, /^seq$/i, /^sequence$/i,
];

const ID_CONTAINS_PATTERNS = [
  /\bid\b/i, /\bidentif/i, /\bindex\b/i, /\bserial\b/i, /\bmatricul/i,
];

export function isIdentifierVariable(name: string, rows?: Record<string, unknown>[]): boolean {
  const trimmed = name.trim();
  // Pattern-based detection
  if (ID_PATTERNS.some(p => p.test(trimmed))) return true;
  // Loose pattern — only if name also looks non-analytical
  if (trimmed.length <= 15 && ID_CONTAINS_PATTERNS.some(p => p.test(trimmed))) return true;
  // Heuristic: if rows provided, check for unique sequential values
  if (rows && rows.length >= 5) {
    const vals = rows.map(r => r[name]).filter(v => v != null && v !== "");
    // All unique values → likely identifier
    const uniqueRatio = new Set(vals.map(String)).size / vals.length;
    if (uniqueRatio > 0.95 && vals.length >= 10) {
      // Check if sequential numeric
      const nums = vals.map(Number).filter(n => !isNaN(n));
      if (nums.length === vals.length) {
        const sorted = [...nums].sort((a, b) => a - b);
        let isSequential = true;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - sorted[i - 1] !== sorted[1] - sorted[0]) { isSequential = false; break; }
        }
        if (isSequential) return true;
      }
      // All unique strings with high cardinality → likely identifier
      if (nums.length === 0 && uniqueRatio === 1) return true;
    }
  }
  return false;
}

// Full academic column headers (no abbreviations)
export function getDescriptiveHeaders(lang: string): string[] {
  const headers: Record<string, string[]> = {
    fr: ["Variable", "Effectif", "Moyenne", "Écart type", "Minimum", "Premier quartile", "Médiane", "Troisième quartile", "Maximum"],
    en: ["Variable", "Sample size", "Mean", "Standard deviation", "Minimum", "First quartile", "Median", "Third quartile", "Maximum"],
    es: ["Variable", "Tamaño de muestra", "Media", "Desviación estándar", "Mínimo", "Primer cuartil", "Mediana", "Tercer cuartil", "Máximo"],
    de: ["Variable", "Stichprobengröße", "Mittelwert", "Standardabweichung", "Minimum", "Erstes Quartil", "Median", "Drittes Quartil", "Maximum"],
    pt: ["Variable", "Tamanho da amostra", "Média", "Desvio padrão", "Mínimo", "Primeiro quartil", "Mediana", "Terceiro quartil", "Máximo"],
  };
  return headers[lang] || headers.en;
}

// Short headers for compact display (UI tables)
export function getDescriptiveHeadersShort(lang: string): string[] {
  const headers: Record<string, string[]> = {
    fr: ["Variable", "N", "Moyenne", "Écart type", "Min", "Q1", "Médiane", "Q3", "Max"],
    en: ["Variable", "N", "Mean", "Std. Dev.", "Min", "Q1", "Median", "Q3", "Max"],
    es: ["Variable", "N", "Media", "Desv. Est.", "Mín", "Q1", "Mediana", "Q3", "Máx"],
    de: ["Variable", "N", "Mittelwert", "Std. Abw.", "Min", "Q1", "Median", "Q3", "Max"],
    pt: ["Variable", "N", "Média", "Desvio Pad.", "Mín", "Q1", "Mediana", "Q3", "Máx"],
  };
  return headers[lang] || headers.en;
}

// Frequency table headers
export function getFrequencyHeaders(lang: string): { value: string; count: string; pct: string } {
  const h: Record<string, { value: string; count: string; pct: string }> = {
    fr: { value: "Modalité", count: "Effectif", pct: "Pourcentage" },
    en: { value: "Category", count: "Count", pct: "Percentage" },
    es: { value: "Categoría", count: "Frecuencia", pct: "Porcentaje" },
    de: { value: "Kategorie", count: "Häufigkeit", pct: "Prozent" },
    pt: { value: "Categoria", count: "Frequência", pct: "Porcentagem" },
  };
  return h[lang] || h.en;
}

// Correlation table headers
export function getCorrelationHeaders(lang: string): { var1: string; var2: string; r: string; p: string; n: string; sig: string } {
  const h: Record<string, any> = {
    fr: { var1: "Variable 1", var2: "Variable 2", r: "r", p: "p", n: "N", sig: "Signification" },
    en: { var1: "Variable 1", var2: "Variable 2", r: "r", p: "p", n: "N", sig: "Significance" },
    es: { var1: "Variable 1", var2: "Variable 2", r: "r", p: "p", n: "N", sig: "Significación" },
    de: { var1: "Variable 1", var2: "Variable 2", r: "r", p: "p", n: "N", sig: "Signifikanz" },
    pt: { var1: "Variável 1", var2: "Variável 2", r: "r", p: "p", n: "N", sig: "Significância" },
  };
  return h[lang] || h.en;
}

function getTableLabel(lang: string) { return TABLE_LABEL[lang] || TABLE_LABEL.en; }
function getFigureLabel(lang: string) { return FIGURE_LABEL[lang] || FIGURE_LABEL.en; }

// Generate academic title for a table based on analysis type and variables
export function generateTableTitle(
  result: AnalysisResultItem,
  lang: string,
  t: TFn,
  ctx?: ProjectContext,
): string {
  const analysisLabel = formatMetadataLabel(result.type, "analysis", t) || result.title;

  if (result.descriptive && result.descriptive.length > 0) {
    const vars = result.descriptive.filter(d => !isIdentifierVariable(d.variable)).map(d => d.variable).join(", ");
    return enrichTitle(titleByLang(lang, "descriptive", analysisLabel, vars), ctx, lang);
  }
  if (result.frequencies && result.frequencies.length > 0) {
    const vars = result.frequencies.filter(f => !isIdentifierVariable(f.variable)).map(f => f.variable).join(", ");
    return enrichTitle(titleByLang(lang, "frequency", analysisLabel, vars), ctx, lang);
  }
  if (result.correlations && result.correlations.length > 0) {
    const pairs = result.correlations.slice(0, 2).map(c => `${c.var1} - ${c.var2}`).join(", ");
    return enrichTitle(titleByLang(lang, "correlation", analysisLabel, pairs), ctx, lang);
  }
  if (result.regressions && result.regressions.length > 0) {
    const reg = result.regressions[0];
    return enrichTitle(titleByLang(lang, "regression", analysisLabel, `${reg.dependent} ~ ${reg.independents.join(", ")}`), ctx, lang);
  }
  if (result.tTests && result.tTests.length > 0) {
    const tt = result.tTests[0];
    return enrichTitle(titleByLang(lang, "ttest", analysisLabel, `${tt.variable} × ${tt.groupVar}`), ctx, lang);
  }
  if (result.anovas && result.anovas.length > 0) {
    const a = result.anovas[0];
    return enrichTitle(titleByLang(lang, "anova", analysisLabel, `${a.dependent} × ${a.factor}`), ctx, lang);
  }
  if (result.chiSquares && result.chiSquares.length > 0) {
    const c = result.chiSquares[0];
    return enrichTitle(titleByLang(lang, "chi", analysisLabel, `${c.var1} × ${c.var2}`), ctx, lang);
  }
  if (result.pca) {
    return enrichTitle(titleByLang(lang, "pca", analysisLabel, ""), ctx, lang);
  }
  if (result.factorAnalysis) {
    return enrichTitle(titleByLang(lang, "factor", analysisLabel, ""), ctx, lang);
  }
  if (result.clusterAnalysis) {
    return enrichTitle(titleByLang(lang, "cluster", analysisLabel, ""), ctx, lang);
  }
  return enrichTitle(analysisLabel, ctx, lang);
}

/** Enrich a generated title with population/context when available */
function enrichTitle(base: string, ctx?: ProjectContext, lang?: string): string {
  if (!ctx?.population) return base;
  const amongMap: Record<string, string> = {
    fr: "auprès de", en: "among", es: "entre", de: "bei", pt: "entre",
  };
  const among = amongMap[lang || "en"] || "among";
  return `${base} ${among} ${ctx.population}`;
}

function titleByLang(lang: string, type: string, label: string, vars: string): string {
  const templates: Record<string, Record<string, string>> = {
    fr: {
      descriptive: `Statistiques descriptives de ${vars}`,
      frequency: `Distribution de fréquences de ${vars}`,
      correlation: `Corrélations entre ${vars}`,
      regression: `Résultats de la régression : ${vars}`,
      ttest: `Comparaison des moyennes : ${vars}`,
      anova: `Analyse de variance : ${vars}`,
      chi: `Test du Chi-carré : ${vars}`,
      pca: `Analyse en composantes principales`,
      factor: `Analyse factorielle avec rotation Varimax`,
      cluster: `Analyse de clusters (K-Means)`,
    },
    en: {
      descriptive: `Descriptive Statistics of ${vars}`,
      frequency: `Frequency Distribution of ${vars}`,
      correlation: `Correlations between ${vars}`,
      regression: `Regression Results: ${vars}`,
      ttest: `Comparison of Means: ${vars}`,
      anova: `Analysis of Variance: ${vars}`,
      chi: `Chi-Square Test: ${vars}`,
      pca: `Principal Component Analysis`,
      factor: `Factor Analysis with Varimax Rotation`,
      cluster: `Cluster Analysis (K-Means)`,
    },
    es: {
      descriptive: `Estadísticas descriptivas de ${vars}`,
      frequency: `Distribución de frecuencias de ${vars}`,
      correlation: `Correlaciones entre ${vars}`,
      regression: `Resultados de regresión: ${vars}`,
      ttest: `Comparación de medias: ${vars}`,
      anova: `Análisis de varianza: ${vars}`,
      chi: `Prueba Chi-cuadrado: ${vars}`,
      pca: `Análisis de componentes principales`,
      factor: `Análisis factorial con rotación Varimax`,
      cluster: `Análisis de clusters (K-Means)`,
    },
    de: {
      descriptive: `Deskriptive Statistiken von ${vars}`,
      frequency: `Häufigkeitsverteilung von ${vars}`,
      correlation: `Korrelationen zwischen ${vars}`,
      regression: `Regressionsergebnisse: ${vars}`,
      ttest: `Mittelwertvergleich: ${vars}`,
      anova: `Varianzanalyse: ${vars}`,
      chi: `Chi-Quadrat-Test: ${vars}`,
      pca: `Hauptkomponentenanalyse`,
      factor: `Faktorenanalyse mit Varimax-Rotation`,
      cluster: `Clusteranalyse (K-Means)`,
    },
    pt: {
      descriptive: `Estatísticas descritivas de ${vars}`,
      frequency: `Distribuição de frequências de ${vars}`,
      correlation: `Correlações entre ${vars}`,
      regression: `Resultados da regressão: ${vars}`,
      ttest: `Comparação de médias: ${vars}`,
      anova: `Análise de variância: ${vars}`,
      chi: `Teste Qui-quadrado: ${vars}`,
      pca: `Análise de componentes principais`,
      factor: `Análise fatorial com rotação Varimax`,
      cluster: `Análise de clusters (K-Means)`,
    },
  };
  return (templates[lang] || templates.en)[type] || label;
}

// Generate short inline interpretation for a table (uses full academic terms, no abbreviations)
export function generateTableInterpretation(
  result: AnalysisResultItem,
  lang: string,
  level: string,
): string {
  const interps: string[] = [];
  const lvl = level.includes("doctor") || level.includes("doctorat") ? "doctorate"
    : level.includes("master") ? "master" : "licence";

  if (result.descriptive) {
    for (const d of result.descriptive.filter(d => !isIdentifierVariable(d.variable)).slice(0, 3)) {
      interps.push(interpDescriptive(d, lang));
    }
  }
  if (result.correlations) {
    for (const c of result.correlations.slice(0, 3)) {
      interps.push(interpCorrelation(c, lang, lvl));
    }
  }
  if (result.regressions) {
    for (const r of result.regressions) {
      interps.push(interpRegression(r, lang, lvl));
    }
  }
  if (result.tTests) {
    for (const tt of result.tTests) {
      interps.push(interpTTest(tt, lang));
    }
  }
  if (result.anovas) {
    for (const a of result.anovas) {
      interps.push(interpAnova(a, lang));
    }
  }
  if (result.chiSquares) {
    for (const c of result.chiSquares) {
      interps.push(interpChi(c, lang, lvl));
    }
  }
  if (result.pca) {
    interps.push(interpPCA(result.pca, lang, lvl));
  }
  if (result.factorAnalysis) {
    interps.push(interpFactor(result.factorAnalysis, lang));
  }
  if (result.clusterAnalysis) {
    interps.push(interpCluster(result.clusterAnalysis, lang, lvl));
  }

  return interps.join(" ");
}

// Use full academic terms: Moyenne, Écart type (not M, ET, SD) — multi-sentence interpretations
function interpDescriptive(d: { variable: string; mean: number; std: number; n: number; min?: number; max?: number; median?: number }, lang: string) {
  const rangeInfo = (d.min != null && d.max != null) ? ` [${d.min} – ${d.max}]` : "";
  const medianInfo = d.median != null ? d.median : d.mean;
  const t: Record<string, string> = {
    fr: `La variable « ${d.variable} » présente une moyenne de ${d.mean} (écart type = ${d.std}, N = ${d.n})${rangeInfo}. La valeur médiane est de ${medianInfo}, ce qui indique une distribution ${Math.abs(d.mean - medianInfo) < d.std * 0.1 ? "relativement symétrique" : "asymétrique"} des données. Ces résultats permettent de caractériser la tendance centrale et la dispersion de cette variable dans l'échantillon étudié.`,
    en: `The variable "${d.variable}" has a mean of ${d.mean} (standard deviation = ${d.std}, N = ${d.n})${rangeInfo}. The median value is ${medianInfo}, indicating a ${Math.abs(d.mean - medianInfo) < d.std * 0.1 ? "relatively symmetric" : "skewed"} distribution. These results characterize the central tendency and dispersion of this variable in the study sample.`,
    es: `La variable "${d.variable}" presenta una media de ${d.mean} (desviación estándar = ${d.std}, N = ${d.n})${rangeInfo}. El valor mediano es ${medianInfo}, lo que indica una distribución ${Math.abs(d.mean - medianInfo) < d.std * 0.1 ? "relativamente simétrica" : "asimétrica"}. Estos resultados permiten caracterizar la tendencia central y la dispersión de esta variable en la muestra estudiada.`,
    de: `Die Variable „${d.variable}" hat einen Mittelwert von ${d.mean} (Standardabweichung = ${d.std}, N = ${d.n})${rangeInfo}. Der Median beträgt ${medianInfo}, was auf eine ${Math.abs(d.mean - medianInfo) < d.std * 0.1 ? "relativ symmetrische" : "schiefe"} Verteilung hinweist. Diese Ergebnisse charakterisieren die zentrale Tendenz und Streuung dieser Variable in der untersuchten Stichprobe.`,
    pt: `A variável "${d.variable}" apresenta uma média de ${d.mean} (desvio padrão = ${d.std}, N = ${d.n})${rangeInfo}. O valor mediano é ${medianInfo}, indicando uma distribuição ${Math.abs(d.mean - medianInfo) < d.std * 0.1 ? "relativamente simétrica" : "assimétrica"}. Estes resultados permitem caracterizar a tendência central e a dispersão desta variável na amostra estudada.`,
  };
  return t[lang] || t.en;
}

function interpCorrelation(c: { var1: string; var2: string; r: number; pValue: number }, lang: string, lvl: string) {
  const strength = Math.abs(c.r) >= 0.7 ? "strong" : Math.abs(c.r) >= 0.4 ? "moderate" : "weak";
  const dir = c.r >= 0 ? "positive" : "negative";
  const sig = c.pValue < 0.05;
  const strengthMap: Record<string, Record<string, string>> = {
    fr: { strong: "forte", moderate: "modérée", weak: "faible" },
    en: { strong: "strong", moderate: "moderate", weak: "weak" },
    es: { strong: "fuerte", moderate: "moderada", weak: "débil" },
    de: { strong: "starke", moderate: "moderate", weak: "schwache" },
    pt: { strong: "forte", moderate: "moderada", weak: "fraca" },
  };
  const dirMap: Record<string, Record<string, string>> = {
    fr: { positive: "positive", negative: "négative" },
    en: { positive: "positive", negative: "negative" },
    es: { positive: "positiva", negative: "negativa" },
    de: { positive: "positive", negative: "negative" },
    pt: { positive: "positiva", negative: "negativa" },
  };
  const s = (strengthMap[lang] || strengthMap.en)[strength];
  const d = (dirMap[lang] || dirMap.en)[dir];

  if (lvl === "licence") {
    const templates: Record<string, string> = {
      fr: `La corrélation entre ${c.var1} et ${c.var2} est ${s} et ${d} (r = ${c.r})${sig ? ", statistiquement significative" : ""}.`,
      en: `The correlation between ${c.var1} and ${c.var2} is ${s} and ${d} (r = ${c.r})${sig ? ", statistically significant" : ""}.`,
      es: `La correlación entre ${c.var1} y ${c.var2} es ${s} y ${d} (r = ${c.r})${sig ? ", estadísticamente significativa" : ""}.`,
      de: `Die Korrelation zwischen ${c.var1} und ${c.var2} ist ${s} und ${d} (r = ${c.r})${sig ? ", statistisch signifikant" : ""}.`,
      pt: `A correlação entre ${c.var1} e ${c.var2} é ${s} e ${d} (r = ${c.r})${sig ? ", estatisticamente significativa" : ""}.`,
    };
    return templates[lang] || templates.en;
  }

  const templates: Record<string, string> = {
    fr: `La corrélation entre ${c.var1} et ${c.var2} est ${s} et ${d} (r = ${c.r}, p = ${c.pValue})${sig ? ", statistiquement significative" : ""}.`,
    en: `The correlation between ${c.var1} and ${c.var2} is ${s} and ${d} (r = ${c.r}, p = ${c.pValue})${sig ? ", statistically significant" : ""}.`,
    es: `La correlación entre ${c.var1} y ${c.var2} es ${s} y ${d} (r = ${c.r}, p = ${c.pValue})${sig ? ", estadísticamente significativa" : ""}.`,
    de: `Die Korrelation zwischen ${c.var1} und ${c.var2} ist ${s} und ${d} (r = ${c.r}, p = ${c.pValue})${sig ? ", statistisch signifikant" : ""}.`,
    pt: `A correlação entre ${c.var1} e ${c.var2} é ${s} e ${d} (r = ${c.r}, p = ${c.pValue})${sig ? ", estatisticamente significativa" : ""}.`,
  };
  return templates[lang] || templates.en;
}

function interpRegression(r: { dependent: string; rSquared: number; fStat: number; fPValue: number }, lang: string, lvl: string) {
  const pct = (r.rSquared * 100).toFixed(1);
  const sig = r.fPValue < 0.05;
  if (lvl === "licence") {
    const templates: Record<string, string> = {
      fr: `Le modèle explique ${pct}% de la variance de ${r.dependent} (R² = ${r.rSquared})${sig ? ". Le modèle est statistiquement significatif" : ""}.`,
      en: `The model explains ${pct}% of the variance in ${r.dependent} (R² = ${r.rSquared})${sig ? ". The model is statistically significant" : ""}.`,
      es: `El modelo explica ${pct}% de la varianza de ${r.dependent} (R² = ${r.rSquared})${sig ? ". El modelo es estadísticamente significativo" : ""}.`,
      de: `Das Modell erklärt ${pct}% der Varianz von ${r.dependent} (R² = ${r.rSquared})${sig ? ". Das Modell ist statistisch signifikant" : ""}.`,
      pt: `O modelo explica ${pct}% da variância de ${r.dependent} (R² = ${r.rSquared})${sig ? ". O modelo é estatisticamente significativo" : ""}.`,
    };
    return templates[lang] || templates.en;
  }
  const templates: Record<string, string> = {
    fr: `Le modèle de régression explique ${pct}% de la variance de ${r.dependent} (R² = ${r.rSquared}, F = ${r.fStat}, p = ${r.fPValue})${sig ? ". Le modèle est statistiquement significatif" : ""}.`,
    en: `The regression model explains ${pct}% of the variance in ${r.dependent} (R² = ${r.rSquared}, F = ${r.fStat}, p = ${r.fPValue})${sig ? ". The model is statistically significant" : ""}.`,
    es: `El modelo de regresión explica ${pct}% de la varianza de ${r.dependent} (R² = ${r.rSquared}, F = ${r.fStat}, p = ${r.fPValue})${sig ? ". El modelo es estadísticamente significativo" : ""}.`,
    de: `Das Regressionsmodell erklärt ${pct}% der Varianz von ${r.dependent} (R² = ${r.rSquared}, F = ${r.fStat}, p = ${r.fPValue})${sig ? ". Das Modell ist statistisch signifikant" : ""}.`,
    pt: `O modelo de regressão explica ${pct}% da variância de ${r.dependent} (R² = ${r.rSquared}, F = ${r.fStat}, p = ${r.fPValue})${sig ? ". O modelo é estatisticamente significativo" : ""}.`,
  };
  return templates[lang] || templates.en;
}

function interpTTest(tt: { variable: string; groupVar: string; groups: string[]; means: number[]; pValue: number }, lang: string) {
  const sig = tt.pValue < 0.05;
  const diff = Math.abs(tt.means[0] - tt.means[1]).toFixed(2);
  const higher = tt.means[0] >= tt.means[1] ? tt.groups[0] : tt.groups[1];
  const templates: Record<string, string> = {
    fr: `${sig ? "Il existe une différence significative" : "Aucune différence significative n'a été observée"} entre ${tt.groups[0]} (moyenne = ${tt.means[0]}) et ${tt.groups[1]} (moyenne = ${tt.means[1]}) pour ${tt.variable} (p = ${tt.pValue}). La différence absolue entre les deux groupes est de ${diff}. ${sig ? `Le groupe « ${higher} » présente une moyenne significativement plus élevée.` : "Ces résultats ne permettent pas de conclure à une différence statistiquement significative entre les groupes."}`,
    en: `${sig ? "There is a significant difference" : "No significant difference was observed"} between ${tt.groups[0]} (mean = ${tt.means[0]}) and ${tt.groups[1]} (mean = ${tt.means[1]}) for ${tt.variable} (p = ${tt.pValue}). The absolute difference between the two groups is ${diff}. ${sig ? `The group "${higher}" shows a significantly higher mean.` : "These results do not support a statistically significant difference between groups."}`,
    es: `${sig ? "Existe una diferencia significativa" : "No se observó diferencia significativa"} entre ${tt.groups[0]} (media = ${tt.means[0]}) y ${tt.groups[1]} (media = ${tt.means[1]}) para ${tt.variable} (p = ${tt.pValue}). La diferencia absoluta entre los dos grupos es de ${diff}. ${sig ? `El grupo "${higher}" presenta una media significativamente más alta.` : "Estos resultados no permiten concluir una diferencia estadísticamente significativa entre los grupos."}`,
    de: `${sig ? "Es gibt einen signifikanten Unterschied" : "Kein signifikanter Unterschied wurde beobachtet"} zwischen ${tt.groups[0]} (Mittelwert = ${tt.means[0]}) und ${tt.groups[1]} (Mittelwert = ${tt.means[1]}) für ${tt.variable} (p = ${tt.pValue}). Der absolute Unterschied beträgt ${diff}. ${sig ? `Die Gruppe „${higher}" weist einen signifikant höheren Mittelwert auf.` : "Diese Ergebnisse lassen keinen statistisch signifikanten Unterschied erkennen."}`,
    pt: `${sig ? "Existe uma diferença significativa" : "Nenhuma diferença significativa foi observada"} entre ${tt.groups[0]} (média = ${tt.means[0]}) e ${tt.groups[1]} (média = ${tt.means[1]}) para ${tt.variable} (p = ${tt.pValue}). A diferença absoluta entre os dois grupos é de ${diff}. ${sig ? `O grupo "${higher}" apresenta uma média significativamente mais elevada.` : "Estes resultados não permitem concluir uma diferença estatisticamente significativa entre os grupos."}`,
  };
  return templates[lang] || templates.en;
}

function interpAnova(a: { dependent: string; factor: string; fStat: number; pValue: number; groups: { name: string; mean: number; std?: number }[] }, lang: string) {
  const sig = a.pValue < 0.05;
  const sorted = [...a.groups].sort((x, y) => y.mean - x.mean);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const templates: Record<string, string> = {
    fr: `L'ANOVA révèle ${sig ? "un effet significatif" : "aucun effet significatif"} de ${a.factor} sur ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}). Le groupe « ${highest.name} » présente la moyenne la plus élevée (${highest.mean}), tandis que le groupe « ${lowest.name} » affiche la moyenne la plus faible (${lowest.mean}). ${sig ? "Ces différences sont statistiquement significatives au seuil de 5%." : "Ces différences ne sont pas statistiquement significatives au seuil conventionnel."}`,
    en: `ANOVA reveals ${sig ? "a significant effect" : "no significant effect"} of ${a.factor} on ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}). The group "${highest.name}" has the highest mean (${highest.mean}), while "${lowest.name}" shows the lowest mean (${lowest.mean}). ${sig ? "These differences are statistically significant at the 5% level." : "These differences are not statistically significant at the conventional threshold."}`,
    es: `El ANOVA revela ${sig ? "un efecto significativo" : "ningún efecto significativo"} de ${a.factor} sobre ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}). El grupo "${highest.name}" presenta la media más alta (${highest.mean}), mientras que "${lowest.name}" muestra la media más baja (${lowest.mean}). ${sig ? "Estas diferencias son estadísticamente significativas al nivel del 5%." : "Estas diferencias no son estadísticamente significativas al umbral convencional."}`,
    de: `Die ANOVA zeigt ${sig ? "einen signifikanten Effekt" : "keinen signifikanten Effekt"} von ${a.factor} auf ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}). Die Gruppe „${highest.name}" hat den höchsten Mittelwert (${highest.mean}), während „${lowest.name}" den niedrigsten Mittelwert aufweist (${lowest.mean}). ${sig ? "Diese Unterschiede sind auf dem 5%-Niveau statistisch signifikant." : "Diese Unterschiede sind auf dem konventionellen Niveau nicht statistisch signifikant."}`,
    pt: `A ANOVA revela ${sig ? "um efeito significativo" : "nenhum efeito significativo"} de ${a.factor} sobre ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}). O grupo "${highest.name}" apresenta a média mais alta (${highest.mean}), enquanto "${lowest.name}" mostra a média mais baixa (${lowest.mean}). ${sig ? "Estas diferenças são estatisticamente significativas ao nível de 5%." : "Estas diferenças não são estatisticamente significativas ao limiar convencional."}`,
  };
  return templates[lang] || templates.en;
}

function interpChi(c: { var1: string; var2: string; chiSquare: number; df: number; pValue: number; cramersV: number }, lang: string, lvl: string) {
  const sig = c.pValue < 0.05;

  if (lvl === "licence") {
    const templates: Record<string, string> = {
      fr: `${sig ? "Il existe une association significative" : "Il n'existe pas d'association significative"} entre ${c.var1} et ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}).`,
      en: `${sig ? "There is a significant association" : "There is no significant association"} between ${c.var1} and ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}).`,
      es: `${sig ? "Existe una asociación significativa" : "No existe asociación significativa"} entre ${c.var1} y ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}).`,
      de: `${sig ? "Es besteht ein signifikanter Zusammenhang" : "Es besteht kein signifikanter Zusammenhang"} zwischen ${c.var1} und ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}).`,
      pt: `${sig ? "Existe uma associação significativa" : "Não existe associação significativa"} entre ${c.var1} e ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}).`,
    };
    return templates[lang] || templates.en;
  }

  if (lvl === "doctorate") {
    const vStrength = c.cramersV < 0.1 ? "negligible" : c.cramersV < 0.3 ? "weak" : c.cramersV < 0.5 ? "moderate" : "strong";
    const vMap: Record<string, Record<string, string>> = {
      fr: { negligible: "négligeable", weak: "faible", moderate: "modérée", strong: "forte" },
      en: { negligible: "negligible", weak: "weak", moderate: "moderate", strong: "strong" },
      es: { negligible: "insignificante", weak: "débil", moderate: "moderada", strong: "fuerte" },
      de: { negligible: "vernachlässigbar", weak: "schwach", moderate: "moderat", strong: "stark" },
      pt: { negligible: "insignificante", weak: "fraca", moderate: "moderada", strong: "forte" },
    };
    const vLabel = (vMap[lang] || vMap.en)[vStrength];
    const templates: Record<string, string> = {
      fr: `Le test du Chi-carré ${sig ? "montre une association significative" : "ne montre pas d'association significative"} entre ${c.var1} et ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}). La force de l'association, mesurée par le V de Cramér (V = ${c.cramersV}), est ${vLabel}.`,
      en: `The Chi-square test ${sig ? "shows a significant association" : "shows no significant association"} between ${c.var1} and ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}). The association strength, measured by Cramér's V (V = ${c.cramersV}), is ${vLabel}.`,
      es: `La prueba Chi-cuadrado ${sig ? "muestra una asociación significativa" : "no muestra asociación significativa"} entre ${c.var1} y ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}). La fuerza de la asociación, medida por la V de Cramér (V = ${c.cramersV}), es ${vLabel}.`,
      de: `Der Chi-Quadrat-Test ${sig ? "zeigt einen signifikanten Zusammenhang" : "zeigt keinen signifikanten Zusammenhang"} zwischen ${c.var1} und ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}). Die Stärke des Zusammenhangs, gemessen durch Cramér's V (V = ${c.cramersV}), ist ${vLabel}.`,
      pt: `O teste Qui-quadrado ${sig ? "mostra uma associação significativa" : "não mostra associação significativa"} entre ${c.var1} e ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}). A força da associação, medida pelo V de Cramér (V = ${c.cramersV}), é ${vLabel}.`,
    };
    return templates[lang] || templates.en;
  }

  // Master level
  const templates: Record<string, string> = {
    fr: `Le test du Chi-carré ${sig ? "montre une association significative" : "ne montre pas d'association significative"} entre ${c.var1} et ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}, V de Cramér = ${c.cramersV}).`,
    en: `The Chi-square test ${sig ? "shows a significant association" : "shows no significant association"} between ${c.var1} and ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}, Cramér's V = ${c.cramersV}).`,
    es: `La prueba Chi-cuadrado ${sig ? "muestra una asociación significativa" : "no muestra asociación significativa"} entre ${c.var1} y ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}, V de Cramér = ${c.cramersV}).`,
    de: `Der Chi-Quadrat-Test ${sig ? "zeigt einen signifikanten Zusammenhang" : "zeigt keinen signifikanten Zusammenhang"} zwischen ${c.var1} und ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}, Cramér's V = ${c.cramersV}).`,
    pt: `O teste Qui-quadrado ${sig ? "mostra uma associação significativa" : "não mostra associação significativa"} entre ${c.var1} e ${c.var2} (χ²(${c.df}) = ${c.chiSquare}, p = ${c.pValue}, V de Cramér = ${c.cramersV}).`,
  };
  return templates[lang] || templates.en;
}

function interpPCA(pca: NonNullable<AnalysisResultItem["pca"]>, lang: string, lvl: string) {
  const retained = pca.components.filter(c => c.eigenvalue >= 1).length;
  if (lvl === "licence") {
    const templates: Record<string, string> = {
      fr: `L'ACP identifie ${retained} composante(s) principale(s) expliquant ${pca.totalVarianceExplained}% de la variance totale.`,
      en: `PCA identifies ${retained} principal component(s) explaining ${pca.totalVarianceExplained}% of total variance.`,
      es: `El ACP identifica ${retained} componente(s) principal(es) que explican ${pca.totalVarianceExplained}% de la varianza total.`,
      de: `Die PCA identifiziert ${retained} Hauptkomponente(n), die ${pca.totalVarianceExplained}% der Gesamtvarianz erklären.`,
      pt: `A ACP identifica ${retained} componente(s) principal(is) que explicam ${pca.totalVarianceExplained}% da variância total.`,
    };
    return templates[lang] || templates.en;
  }
  const templates: Record<string, string> = {
    fr: `L'ACP révèle ${retained} composante(s) avec une valeur propre > 1, expliquant ${pca.totalVarianceExplained}% de la variance totale (KMO = ${pca.kmo}).`,
    en: `PCA reveals ${retained} component(s) with eigenvalue > 1, explaining ${pca.totalVarianceExplained}% of total variance (KMO = ${pca.kmo}).`,
    es: `El ACP revela ${retained} componente(s) con autovalor > 1, explicando ${pca.totalVarianceExplained}% de la varianza total (KMO = ${pca.kmo}).`,
    de: `Die PCA ergibt ${retained} Komponente(n) mit Eigenwert > 1, die ${pca.totalVarianceExplained}% der Gesamtvarianz erklären (KMO = ${pca.kmo}).`,
    pt: `A ACP revela ${retained} componente(s) com autovalor > 1, explicando ${pca.totalVarianceExplained}% da variância total (KMO = ${pca.kmo}).`,
  };
  return templates[lang] || templates.en;
}

function interpFactor(fa: NonNullable<AnalysisResultItem["factorAnalysis"]>, lang: string) {
  const nFactors = fa.factors.length;
  const cumVar = fa.factors[fa.factors.length - 1]?.cumulativeVariance || 0;
  const templates: Record<string, string> = {
    fr: `L'analyse factorielle avec rotation ${fa.rotation} identifie ${nFactors} facteur(s) expliquant ${cumVar}% de la variance cumulée.`,
    en: `Factor analysis with ${fa.rotation} rotation identifies ${nFactors} factor(s) explaining ${cumVar}% of cumulative variance.`,
    es: `El análisis factorial con rotación ${fa.rotation} identifica ${nFactors} factor(es) que explican ${cumVar}% de la varianza acumulada.`,
    de: `Die Faktorenanalyse mit ${fa.rotation}-Rotation identifiziert ${nFactors} Faktor(en), die ${cumVar}% der kumulierten Varianz erklären.`,
    pt: `A análise fatorial com rotação ${fa.rotation} identifica ${nFactors} fator(es) que explicam ${cumVar}% da variância acumulada.`,
  };
  return templates[lang] || templates.en;
}

function interpCluster(cl: NonNullable<AnalysisResultItem["clusterAnalysis"]>, lang: string, lvl: string) {
  const bssRatio = cl.totalSS > 0 ? ((cl.betweenSS / cl.totalSS) * 100).toFixed(1) : "0";
  if (lvl === "licence") {
    const templates: Record<string, string> = {
      fr: `L'analyse de clusters identifie ${cl.k} groupes distincts dans les données.`,
      en: `Cluster analysis identifies ${cl.k} distinct groups in the data.`,
      es: `El análisis de clusters identifica ${cl.k} grupos distintos en los datos.`,
      de: `Die Clusteranalyse identifiziert ${cl.k} verschiedene Gruppen in den Daten.`,
      pt: `A análise de clusters identifica ${cl.k} grupos distintos nos dados.`,
    };
    return templates[lang] || templates.en;
  }
  const templates: Record<string, string> = {
    fr: `L'analyse de clusters identifie ${cl.k} groupes distincts (silhouette = ${cl.silhouetteScore}, BSS/TSS = ${bssRatio}%).`,
    en: `Cluster analysis identifies ${cl.k} distinct groups (silhouette = ${cl.silhouetteScore}, BSS/TSS = ${bssRatio}%).`,
    es: `El análisis de clusters identifica ${cl.k} grupos distintos (silueta = ${cl.silhouetteScore}, BSS/TSS = ${bssRatio}%).`,
    de: `Die Clusteranalyse identifiziert ${cl.k} distinkte Gruppen (Silhouette = ${cl.silhouetteScore}, BSS/TSS = ${bssRatio}%).`,
    pt: `A análise de clusters identifica ${cl.k} grupos distintos (silhueta = ${cl.silhouetteScore}, BSS/TSS = ${bssRatio}%).`,
  };
  return templates[lang] || templates.en;
}

// Generate figure title
export function generateFigureTitle(
  chartTitle: string,
  variables: string[],
  analysisType: string,
  lang: string,
): string {
  return chartTitle;
}

// Generate figure interpretation — multi-sentence academic paragraphs
export function generateFigureInterpretation(
  chartType: string,
  chartTitle: string,
  data: { name?: string; value?: number; x?: number; y?: number }[],
  lang: string,
  level?: string,
): string {
  if (!data || data.length === 0) return "";

  if (chartType === "histogram" || chartType === "bar") {
    const sorted = [...data].filter(d => d.value != null).sort((a, b) => (b.value || 0) - (a.value || 0));
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (!top) return "";
    const total = sorted.reduce((s, d) => s + (d.value || 0), 0);
    const topPct = total > 0 ? ((top.value || 0) / total * 100).toFixed(1) : "0";
    const templates: Record<string, string> = {
      fr: `Les résultats indiquent que la modalité « ${top.name} » est la plus fréquente avec ${top.value} occurrences, représentant ${topPct}% de l'ensemble. ${sorted.length > 1 ? `La modalité « ${bottom?.name} » est la moins représentée avec ${bottom?.value} occurrences.` : ""} Cette distribution met en évidence une tendance marquée dans la répartition des observations.`,
      en: `The results indicate that "${top.name}" is the most frequent category with ${top.value} occurrences, representing ${topPct}% of the total. ${sorted.length > 1 ? `The category "${bottom?.name}" is the least represented with ${bottom?.value} occurrences.` : ""} This distribution highlights a notable trend in the data.`,
      es: `Los resultados indican que "${top.name}" es la categoría más frecuente con ${top.value} ocurrencias, representando ${topPct}% del total. ${sorted.length > 1 ? `La categoría "${bottom?.name}" es la menos representada con ${bottom?.value} ocurrencias.` : ""} Esta distribución destaca una tendencia notable en los datos.`,
      de: `Die Ergebnisse zeigen, dass „${top.name}" mit ${top.value} Vorkommen die häufigste Kategorie ist und ${topPct}% der Gesamtheit ausmacht. ${sorted.length > 1 ? `Die Kategorie „${bottom?.name}" ist mit ${bottom?.value} Vorkommen am wenigsten vertreten.` : ""} Diese Verteilung verdeutlicht einen bemerkenswerten Trend in den Daten.`,
      pt: `Os resultados indicam que "${top.name}" é a categoria mais frequente com ${top.value} ocorrências, representando ${topPct}% do total. ${sorted.length > 1 ? `A categoria "${bottom?.name}" é a menos representada com ${bottom?.value} ocorrências.` : ""} Esta distribuição evidencia uma tendência notável nos dados.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "pie") {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));
    const top = sorted[0];
    const second = sorted[1];
    if (!top || !total) return "";
    const pct = ((top.value || 0) / total * 100).toFixed(1);
    const secondPct = second ? ((second.value || 0) / total * 100).toFixed(1) : null;
    const templates: Record<string, string> = {
      fr: `Les résultats montrent que la catégorie « ${top.name} » représente ${pct}% de l'ensemble des observations, constituant ainsi la modalité dominante. ${secondPct ? `La catégorie « ${second.name} » occupe la deuxième position avec ${secondPct}% des observations.` : ""} Cette répartition suggère une prédominance de la modalité « ${top.name} » dans la population étudiée.`,
      en: `The results show that the category "${top.name}" accounts for ${pct}% of all observations, making it the dominant category. ${secondPct ? `The category "${second.name}" ranks second with ${secondPct}% of observations.` : ""} This distribution suggests a predominance of "${top.name}" in the study population.`,
      es: `Los resultados muestran que la categoría "${top.name}" representa ${pct}% de todas las observaciones, constituyendo la modalidad dominante. ${secondPct ? `La categoría "${second.name}" ocupa el segundo lugar con ${secondPct}% de las observaciones.` : ""} Esta distribución sugiere una predominancia de "${top.name}" en la población estudiada.`,
      de: `Die Ergebnisse zeigen, dass die Kategorie „${top.name}" ${pct}% aller Beobachtungen ausmacht und damit die dominierende Kategorie darstellt. ${secondPct ? `Die Kategorie „${second.name}" belegt den zweiten Platz mit ${secondPct}% der Beobachtungen.` : ""} Diese Verteilung deutet auf eine Vorherrschaft von „${top.name}" in der untersuchten Population hin.`,
      pt: `Os resultados mostram que a categoria "${top.name}" representa ${pct}% de todas as observações, constituindo a modalidade dominante. ${secondPct ? `A categoria "${second.name}" ocupa a segunda posição com ${secondPct}% das observações.` : ""} Esta distribuição sugere uma predominância de "${top.name}" na população estudada.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "scatter") {
    const n = data.length;
    const templates: Record<string, string> = {
      fr: `Le nuage de points illustre la relation entre les deux variables analysées sur ${n} observations. La dispersion des points permet de visualiser la nature et l'intensité de cette relation. L'examen de la tendance générale permet d'évaluer le degré d'association entre les variables.`,
      en: `The scatter plot illustrates the relationship between the two analyzed variables across ${n} observations. The distribution of data points reveals the nature and strength of this relationship. The overall trend allows for an assessment of the degree of association between the variables.`,
      es: `El diagrama de dispersión ilustra la relación entre las dos variables analizadas en ${n} observaciones. La distribución de los puntos revela la naturaleza e intensidad de esta relación. La tendencia general permite evaluar el grado de asociación entre las variables.`,
      de: `Das Streudiagramm veranschaulicht die Beziehung zwischen den beiden analysierten Variablen über ${n} Beobachtungen. Die Verteilung der Datenpunkte zeigt Art und Stärke dieser Beziehung. Der allgemeine Trend ermöglicht eine Bewertung des Assoziationsgrads zwischen den Variablen.`,
      pt: `O diagrama de dispersão ilustra a relação entre as duas variáveis analisadas em ${n} observações. A distribuição dos pontos revela a natureza e a intensidade desta relação. A tendência geral permite avaliar o grau de associação entre as variáveis.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "scree") {
    const components = data.filter(d => d.value != null);
    const retained = components.filter(d => (d.value || 0) >= 1).length;
    const lastCum = components[components.length - 1] as { cumulative?: number } | undefined;
    const totalVar = (lastCum as any)?.cumulative || 0;
    const templates: Record<string, string> = {
      fr: `Le scree plot révèle ${retained} composante(s) principale(s) avec une valeur propre supérieure ou égale à 1, conformément au critère de Kaiser. Ces composantes expliquent ${totalVar.toFixed(1)}% de la variance totale. La rupture observée dans la courbe de sédimentation confirme la pertinence du nombre de composantes retenues.`,
      en: `The scree plot reveals ${retained} principal component(s) with eigenvalue ≥ 1, in accordance with Kaiser's criterion. These components explain ${totalVar.toFixed(1)}% of the total variance. The observed break in the scree curve confirms the appropriateness of the number of retained components.`,
      es: `El gráfico de sedimentación revela ${retained} componente(s) principal(es) con autovalor ≥ 1, según el criterio de Kaiser. Estos componentes explican ${totalVar.toFixed(1)}% de la varianza total. La ruptura observada en la curva confirma la pertinencia del número de componentes retenidos.`,
      de: `Das Scree-Plot zeigt ${retained} Hauptkomponente(n) mit Eigenwert ≥ 1 gemäß dem Kaiser-Kriterium. Diese Komponenten erklären ${totalVar.toFixed(1)}% der Gesamtvarianz. Der beobachtete Knick in der Kurve bestätigt die Angemessenheit der Anzahl der beibehaltenen Komponenten.`,
      pt: `O scree plot revela ${retained} componente(s) principal(is) com autovalor ≥ 1, de acordo com o critério de Kaiser. Estes componentes explicam ${totalVar.toFixed(1)}% da variância total. A ruptura observada na curva de sedimentação confirma a pertinência do número de componentes retidos.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "cluster-scatter") {
    const clusters = new Set(data.map(d => (d as any).cluster));
    const n = data.length;
    const templates: Record<string, string> = {
      fr: `Le diagramme de dispersion montre ${clusters.size} clusters distincts identifiés parmi ${n} observations. La séparation visuelle des groupes suggère une structure naturelle dans les données. Cette segmentation permet de distinguer des profils différenciés au sein de la population étudiée.`,
      en: `The scatter plot shows ${clusters.size} distinct clusters identified across ${n} observations. The visual separation of groups suggests a natural structure in the data. This segmentation reveals differentiated profiles within the study population.`,
      es: `El diagrama de dispersión muestra ${clusters.size} clusters distintos identificados entre ${n} observaciones. La separación visual de los grupos sugiere una estructura natural en los datos. Esta segmentación revela perfiles diferenciados dentro de la población estudiada.`,
      de: `Das Streudiagramm zeigt ${clusters.size} verschiedene Cluster über ${n} Beobachtungen. Die visuelle Trennung der Gruppen deutet auf eine natürliche Struktur in den Daten hin. Diese Segmentierung zeigt differenzierte Profile innerhalb der untersuchten Population.`,
      pt: `O diagrama de dispersão mostra ${clusters.size} clusters distintos identificados em ${n} observações. A separação visual dos grupos sugere uma estrutura natural nos dados. Esta segmentação revela perfis diferenciados na população estudada.`,
    };
    return templates[lang] || templates.en;
  }

  return "";
}

// ─── Academic Report Structure (Sections 3.1–3.9) for Licence ───

export interface AcademicSection {
  number: string;
  title: string;
  content: string;
  tables?: { label: string; title: string; data: string[][] ; headers: string[] }[];
}

export interface AcademicReport {
  sections: AcademicSection[];
  level: string;
  lang: string;
}

const SECTION_TITLES: Record<string, Record<string, string>> = {
  fr: {
    "3.1": "Statistiques descriptives",
    "3.2": "Tableaux de fréquences",
    "3.3": "Tableaux croisés et test du Chi-carré",
    "3.4": "Corrélations",
    "3.5": "Comparaison de moyennes (T-test)",
    "3.6": "Analyse de variance (ANOVA)",
    "3.7": "Régression",
    "3.8": "Interprétation générale des résultats",
    "3.9": "Conclusion et recommandations",
  },
  en: {
    "3.1": "Descriptive Statistics",
    "3.2": "Frequency Tables",
    "3.3": "Cross-tabulation and Chi-Square Test",
    "3.4": "Correlations",
    "3.5": "Comparison of Means (T-test)",
    "3.6": "Analysis of Variance (ANOVA)",
    "3.7": "Regression",
    "3.8": "General Interpretation of Results",
    "3.9": "Conclusion and Recommendations",
  },
  es: {
    "3.1": "Estadísticas descriptivas",
    "3.2": "Tablas de frecuencias",
    "3.3": "Tablas cruzadas y prueba Chi-cuadrado",
    "3.4": "Correlaciones",
    "3.5": "Comparación de medias (T-test)",
    "3.6": "Análisis de varianza (ANOVA)",
    "3.7": "Regresión",
    "3.8": "Interpretación general de los resultados",
    "3.9": "Conclusión y recomendaciones",
  },
  de: {
    "3.1": "Deskriptive Statistik",
    "3.2": "Häufigkeitstabellen",
    "3.3": "Kreuztabellen und Chi-Quadrat-Test",
    "3.4": "Korrelationen",
    "3.5": "Mittelwertvergleich (T-Test)",
    "3.6": "Varianzanalyse (ANOVA)",
    "3.7": "Regression",
    "3.8": "Allgemeine Interpretation der Ergebnisse",
    "3.9": "Schlussfolgerung und Empfehlungen",
  },
  pt: {
    "3.1": "Estatísticas descritivas",
    "3.2": "Tabelas de frequências",
    "3.3": "Tabelas cruzadas e teste Qui-quadrado",
    "3.4": "Correlações",
    "3.5": "Comparação de médias (T-test)",
    "3.6": "Análise de variância (ANOVA)",
    "3.7": "Regressão",
    "3.8": "Interpretação geral dos resultados",
    "3.9": "Conclusão e recomendações",
  },
};

function sectionTitle(num: string, lang: string): string {
  return (SECTION_TITLES[lang] || SECTION_TITLES.en)[num] || "";
}

/**
 * Generate a structured academic report (sections 3.1–3.9) from analysis results.
 * Designed for Licence level — clean, sequential, with inline interpretations.
 */
export function generateAcademicReport(
  results: AnalysisResultItem[],
  lang: string,
  level: string,
  ctx?: ProjectContext,
  globalInterpretation?: string,
  globalConclusion?: string,
  globalRecommendations?: string,
): AcademicReport {
  const sections: AcademicSection[] = [];
  const tableLabel = getTableLabel(lang);
  let tableNum = 0;

  // Helper: no-data message
  const noData: Record<string, string> = {
    fr: "Aucune analyse de ce type n'a été réalisée dans ce projet.",
    en: "No analysis of this type was performed in this project.",
    es: "No se realizó ningún análisis de este tipo en este proyecto.",
    de: "Für dieses Projekt wurde keine Analyse dieses Typs durchgeführt.",
    pt: "Nenhuma análise deste tipo foi realizada neste projeto.",
  };

  // 3.1 Descriptive Statistics
  const descriptives = results.flatMap(r => (r.descriptive || []).filter(d => !isIdentifierVariable(d.variable)));
  {
    const interps: string[] = [];
    if (descriptives.length > 0) {
      for (const d of descriptives) {
        interps.push(interpDescriptive(d, lang));
      }
      tableNum++;
    }
    sections.push({
      number: "3.1",
      title: sectionTitle("3.1", lang),
      content: descriptives.length > 0 ? interps.join("\n\n") : (noData[lang] || noData.en),
    });
  }

  // 3.2 Frequency Tables
  const frequencies = results.flatMap(r => (r.frequencies || []).filter(f => !isIdentifierVariable(f.variable)));
  {
    const interps: string[] = [];
    if (frequencies.length > 0) {
      for (const f of frequencies) {
        tableNum++;
        const sorted = [...f.counts].sort((a, b) => b.count - a.count);
        const topCat = sorted[0];
        const total = sorted.reduce((s, c) => s + c.count, 0);
        const topPct = total > 0 ? ((topCat.count / total) * 100).toFixed(1) : "0";
        const freqInterp: Record<string, string> = {
          fr: `La distribution de « ${f.variable} » montre que la modalité « ${topCat.value} » est la plus fréquente avec ${topCat.count} occurrences (${topPct}%). ${sorted.length} modalités ont été identifiées au total.`,
          en: `The distribution of "${f.variable}" shows that "${topCat.value}" is the most frequent category with ${topCat.count} occurrences (${topPct}%). ${sorted.length} categories were identified in total.`,
          es: `La distribución de "${f.variable}" muestra que "${topCat.value}" es la categoría más frecuente con ${topCat.count} ocurrencias (${topPct}%). Se identificaron ${sorted.length} categorías en total.`,
          de: `Die Verteilung von "${f.variable}" zeigt, dass "${topCat.value}" mit ${topCat.count} Vorkommen (${topPct}%) die häufigste Kategorie ist. Insgesamt wurden ${sorted.length} Kategorien identifiziert.`,
          pt: `A distribuição de "${f.variable}" mostra que "${topCat.value}" é a categoria mais frequente com ${topCat.count} ocorrências (${topPct}%). ${sorted.length} categorias foram identificadas no total.`,
        };
        interps.push(freqInterp[lang] || freqInterp.en);
      }
    }
    sections.push({
      number: "3.2",
      title: sectionTitle("3.2", lang),
      content: frequencies.length > 0 ? interps.join("\n\n") : (noData[lang] || noData.en),
    });
  }

  // 3.3 Cross-tab / Chi-Square
  const chiSquares = results.flatMap(r => r.chiSquares ? r.chiSquares.map(c => ({ chi: c, result: r })) : []);
  {
    const interps: string[] = [];
    for (const { chi, result } of chiSquares) {
      tableNum++;
      interps.push(interpChi(chi, lang, "licence"));
    }
    sections.push({
      number: "3.3",
      title: sectionTitle("3.3", lang),
      content: chiSquares.length > 0 ? interps.join("\n\n") : (noData[lang] || noData.en),
    });
  }

  // 3.4 Correlations
  const correlations = results.flatMap(r => (r.correlations || []).concat(
    (r.spearmanCorrelations || []).map(s => ({ var1: s.var1, var2: s.var2, r: s.rho, pValue: s.pValue, n: s.n }))
  ));
  {
    const interps: string[] = [];
    if (correlations.length > 0) {
      tableNum++;
      for (const c of correlations) {
        interps.push(interpCorrelation(c, lang, "licence"));
      }
    }
    sections.push({
      number: "3.4",
      title: sectionTitle("3.4", lang),
      content: correlations.length > 0 ? interps.join("\n\n") : (noData[lang] || noData.en),
    });
  }

  // 3.5 T-test
  const tTests = results.flatMap(r => (r.tTests || []).map(tt => ({ tt, result: r })));
  const pairedTTests = results.flatMap(r => (r.pairedTTests || []).map(pt => ({ pt, result: r })));
  {
    const interps: string[] = [];
    for (const { tt } of tTests) {
      tableNum++;
      interps.push(interpTTest(tt, lang));
    }
    for (const { pt } of pairedTTests) {
      tableNum++;
      const sig = pt.pValue < 0.05;
      const ptInterp: Record<string, string> = {
        fr: `Le test T apparié entre ${pt.var1} et ${pt.var2} ${sig ? "révèle une différence significative" : "ne révèle pas de différence significative"} (t(${pt.df}) = ${pt.tStat.toFixed(3)}, p = ${pt.pValue.toFixed(4)}, différence moyenne = ${pt.meanDiff.toFixed(3)}).`,
        en: `The paired T-test between ${pt.var1} and ${pt.var2} ${sig ? "reveals a significant difference" : "reveals no significant difference"} (t(${pt.df}) = ${pt.tStat.toFixed(3)}, p = ${pt.pValue.toFixed(4)}, mean difference = ${pt.meanDiff.toFixed(3)}).`,
        es: `La prueba T pareada entre ${pt.var1} y ${pt.var2} ${sig ? "revela una diferencia significativa" : "no revela diferencia significativa"} (t(${pt.df}) = ${pt.tStat.toFixed(3)}, p = ${pt.pValue.toFixed(4)}, diferencia media = ${pt.meanDiff.toFixed(3)}).`,
        de: `Der gepaarte T-Test zwischen ${pt.var1} und ${pt.var2} ${sig ? "zeigt einen signifikanten Unterschied" : "zeigt keinen signifikanten Unterschied"} (t(${pt.df}) = ${pt.tStat.toFixed(3)}, p = ${pt.pValue.toFixed(4)}, mittlere Differenz = ${pt.meanDiff.toFixed(3)}).`,
        pt: `O teste T pareado entre ${pt.var1} e ${pt.var2} ${sig ? "revela uma diferença significativa" : "não revela diferença significativa"} (t(${pt.df}) = ${pt.tStat.toFixed(3)}, p = ${pt.pValue.toFixed(4)}, diferença média = ${pt.meanDiff.toFixed(3)}).`,
      };
      interps.push(ptInterp[lang] || ptInterp.en);
    }
    sections.push({
      number: "3.5",
      title: sectionTitle("3.5", lang),
      content: (tTests.length + pairedTTests.length) > 0 ? interps.join("\n\n") : (noData[lang] || noData.en),
    });
  }

  // 3.6 ANOVA
  const anovas = results.flatMap(r => (r.anovas || []).map(a => ({ anova: a, result: r })));
  {
    const interps: string[] = [];
    for (const { anova } of anovas) {
      tableNum++;
      interps.push(interpAnova(anova, lang));
    }
    sections.push({
      number: "3.6",
      title: sectionTitle("3.6", lang),
      content: anovas.length > 0 ? interps.join("\n\n") : (noData[lang] || noData.en),
    });
  }

  // 3.7 Regression
  const regressions = results.flatMap(r => (r.regressions || []).map(reg => ({ reg, result: r })));
  {
    const interps: string[] = [];
    for (const { reg } of regressions) {
      tableNum++;
      interps.push(interpRegression(reg, lang, "licence"));
    }
    sections.push({
      number: "3.7",
      title: sectionTitle("3.7", lang),
      content: regressions.length > 0 ? interps.join("\n\n") : (noData[lang] || noData.en),
    });
  }

  // 3.8 General Interpretation
  {
    const allInterps: string[] = [];
    for (const result of results) {
      const interp = generateTableInterpretation(result, lang, level);
      if (interp) allInterps.push(interp);
    }
    const globalContent = globalInterpretation || allInterps.join("\n\n");
    sections.push({
      number: "3.8",
      title: sectionTitle("3.8", lang),
      content: globalContent || (noData[lang] || noData.en),
    });
  }

  // 3.9 Conclusion & Recommendations
  {
    const conclusionContent: string[] = [];
    if (globalConclusion) conclusionContent.push(globalConclusion);
    if (globalRecommendations) conclusionContent.push(globalRecommendations);

    if (conclusionContent.length === 0) {
      // Auto-generate from significant results
      const sigResults: string[] = [];
      const nonSigResults: string[] = [];
      for (const r of results) {
        for (const c of r.chiSquares || []) {
          (c.pValue < 0.05 ? sigResults : nonSigResults).push(`${c.var1} × ${c.var2}`);
        }
        for (const c of r.correlations || []) {
          (c.pValue < 0.05 ? sigResults : nonSigResults).push(`${c.var1} × ${c.var2}`);
        }
        for (const tt of r.tTests || []) {
          (tt.pValue < 0.05 ? sigResults : nonSigResults).push(`${tt.variable}`);
        }
        for (const a of r.anovas || []) {
          (a.pValue < 0.05 ? sigResults : nonSigResults).push(`${a.dependent} × ${a.factor}`);
        }
        for (const reg of r.regressions || []) {
          (reg.fPValue < 0.05 ? sigResults : nonSigResults).push(`${reg.dependent}`);
        }
      }

      const concTemplates: Record<string, string> = {
        fr: `${sigResults.length > 0 ? `Les résultats montrent des associations significatives pour : ${sigResults.join(", ")}.` : "Aucune association significative n'a été identifiée."} ${nonSigResults.length > 0 ? `Les variables suivantes n'ont pas montré d'association significative : ${nonSigResults.join(", ")}.` : ""}`,
        en: `${sigResults.length > 0 ? `Results show significant associations for: ${sigResults.join(", ")}.` : "No significant associations were identified."} ${nonSigResults.length > 0 ? `The following variables showed no significant association: ${nonSigResults.join(", ")}.` : ""}`,
        es: `${sigResults.length > 0 ? `Los resultados muestran asociaciones significativas para: ${sigResults.join(", ")}.` : "No se identificaron asociaciones significativas."} ${nonSigResults.length > 0 ? `Las siguientes variables no mostraron asociación significativa: ${nonSigResults.join(", ")}.` : ""}`,
        de: `${sigResults.length > 0 ? `Die Ergebnisse zeigen signifikante Zusammenhänge für: ${sigResults.join(", ")}.` : "Es wurden keine signifikanten Zusammenhänge identifiziert."} ${nonSigResults.length > 0 ? `Die folgenden Variablen zeigten keinen signifikanten Zusammenhang: ${nonSigResults.join(", ")}.` : ""}`,
        pt: `${sigResults.length > 0 ? `Os resultados mostram associações significativas para: ${sigResults.join(", ")}.` : "Nenhuma associação significativa foi identificada."} ${nonSigResults.length > 0 ? `As seguintes variáveis não mostraram associação significativa: ${nonSigResults.join(", ")}.` : ""}`,
      };

      const recTemplates: Record<string, string> = {
        fr: "Il est recommandé d'approfondir l'analyse avec un échantillon plus large et d'explorer les variables médiatrices potentielles.",
        en: "It is recommended to deepen the analysis with a larger sample and explore potential mediating variables.",
        es: "Se recomienda profundizar el análisis con una muestra más grande y explorar variables mediadoras potenciales.",
        de: "Es wird empfohlen, die Analyse mit einer größeren Stichprobe zu vertiefen und potenzielle Mediatorvariablen zu untersuchen.",
        pt: "Recomenda-se aprofundar a análise com uma amostra maior e explorar variáveis mediadoras potenciais.",
      };

      conclusionContent.push(concTemplates[lang] || concTemplates.en);
      conclusionContent.push(recTemplates[lang] || recTemplates.en);
    }

    sections.push({
      number: "3.9",
      title: sectionTitle("3.9", lang),
      content: conclusionContent.join("\n\n"),
    });
  }

  return { sections, level, lang };
}

export { getTableLabel, getFigureLabel };
