// Academic table and graph formatting utilities for Dr Data 2.0

import type { AnalysisResultItem } from "@/lib/statsEngine";

export interface AcademicTableMeta {
  number: number;
  title: string;
  source: string;
  interpretation: string;
}

export interface AcademicFigureMeta {
  number: number;
  title: string;
  source: string;
  interpretation: string;
}

type TFn = (key: string) => string;

const TABLE_LABEL: Record<string, string> = {
  fr: "Tableau", en: "Table", es: "Tabla", de: "Tabelle", pt: "Tabela",
};
const FIGURE_LABEL: Record<string, string> = {
  fr: "Figure", en: "Figure", es: "Figura", de: "Abbildung", pt: "Figura",
};
const SOURCE_LABEL: Record<string, string> = {
  fr: "Source : Données collectées par l'auteur, traitées avec Dr Data 2.0",
  en: "Source: Data collected by the author, processed with Dr Data 2.0",
  es: "Fuente: Datos recopilados por el autor, procesados con Dr Data 2.0",
  de: "Quelle: Vom Autor erhobene Daten, verarbeitet mit Dr Data 2.0",
  pt: "Fonte: Dados coletados pelo autor, processados com Dr Data 2.0",
};

function getTableLabel(lang: string) { return TABLE_LABEL[lang] || TABLE_LABEL.en; }
function getFigureLabel(lang: string) { return FIGURE_LABEL[lang] || FIGURE_LABEL.en; }
function getSource(lang: string) { return SOURCE_LABEL[lang] || SOURCE_LABEL.en; }

// Generate academic title for a table based on analysis type and variables
export function generateTableTitle(
  result: AnalysisResultItem,
  lang: string,
  t: TFn,
): string {
  const analysisLabel = t(`student.analysis.${result.type}`) || result.title;

  if (result.descriptive && result.descriptive.length > 0) {
    const vars = result.descriptive.map(d => d.variable).join(", ");
    return titleByLang(lang, "descriptive", analysisLabel, vars);
  }
  if (result.frequencies && result.frequencies.length > 0) {
    const vars = result.frequencies.map(f => f.variable).join(", ");
    return titleByLang(lang, "frequency", analysisLabel, vars);
  }
  if (result.correlations && result.correlations.length > 0) {
    const pairs = result.correlations.slice(0, 2).map(c => `${c.var1} - ${c.var2}`).join(", ");
    return titleByLang(lang, "correlation", analysisLabel, pairs);
  }
  if (result.regressions && result.regressions.length > 0) {
    const reg = result.regressions[0];
    return titleByLang(lang, "regression", analysisLabel, `${reg.dependent} ~ ${reg.independents.join(", ")}`);
  }
  if (result.tTests && result.tTests.length > 0) {
    const tt = result.tTests[0];
    return titleByLang(lang, "ttest", analysisLabel, `${tt.variable} × ${tt.groupVar}`);
  }
  if (result.anovas && result.anovas.length > 0) {
    const a = result.anovas[0];
    return titleByLang(lang, "anova", analysisLabel, `${a.dependent} × ${a.factor}`);
  }
  if (result.chiSquares && result.chiSquares.length > 0) {
    const c = result.chiSquares[0];
    return titleByLang(lang, "chi", analysisLabel, `${c.var1} × ${c.var2}`);
  }
  if (result.pca) {
    return titleByLang(lang, "pca", analysisLabel, "");
  }
  if (result.factorAnalysis) {
    return titleByLang(lang, "factor", analysisLabel, "");
  }
  if (result.clusterAnalysis) {
    return titleByLang(lang, "cluster", analysisLabel, "");
  }
  return analysisLabel;
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

// Generate short inline interpretation for a table
export function generateTableInterpretation(
  result: AnalysisResultItem,
  lang: string,
  level: string,
): string {
  const interps: string[] = [];
  const lvl = level.includes("doctor") || level.includes("doctorat") ? "doctorate"
    : level.includes("master") ? "master" : "licence";

  if (result.descriptive) {
    for (const d of result.descriptive.slice(0, 3)) {
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

function interpDescriptive(d: { variable: string; mean: number; std: number; n: number }, lang: string) {
  const t: Record<string, string> = {
    fr: `La variable ${d.variable} présente une moyenne de ${d.mean} (ET = ${d.std}, N = ${d.n}).`,
    en: `The variable ${d.variable} has a mean of ${d.mean} (SD = ${d.std}, N = ${d.n}).`,
    es: `La variable ${d.variable} presenta una media de ${d.mean} (DE = ${d.std}, N = ${d.n}).`,
    de: `Die Variable ${d.variable} hat einen Mittelwert von ${d.mean} (SD = ${d.std}, N = ${d.n}).`,
    pt: `A variável ${d.variable} apresenta uma média de ${d.mean} (DP = ${d.std}, N = ${d.n}).`,
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
  const templates: Record<string, string> = {
    fr: `${sig ? "Il existe une différence significative" : "Aucune différence significative n'a été observée"} entre ${tt.groups[0]} (M = ${tt.means[0]}) et ${tt.groups[1]} (M = ${tt.means[1]}) pour ${tt.variable} (p = ${tt.pValue}).`,
    en: `${sig ? "There is a significant difference" : "No significant difference was observed"} between ${tt.groups[0]} (M = ${tt.means[0]}) and ${tt.groups[1]} (M = ${tt.means[1]}) for ${tt.variable} (p = ${tt.pValue}).`,
    es: `${sig ? "Existe una diferencia significativa" : "No se observó diferencia significativa"} entre ${tt.groups[0]} (M = ${tt.means[0]}) y ${tt.groups[1]} (M = ${tt.means[1]}) para ${tt.variable} (p = ${tt.pValue}).`,
    de: `${sig ? "Es gibt einen signifikanten Unterschied" : "Kein signifikanter Unterschied wurde beobachtet"} zwischen ${tt.groups[0]} (M = ${tt.means[0]}) und ${tt.groups[1]} (M = ${tt.means[1]}) für ${tt.variable} (p = ${tt.pValue}).`,
    pt: `${sig ? "Existe uma diferença significativa" : "Nenhuma diferença significativa foi observada"} entre ${tt.groups[0]} (M = ${tt.means[0]}) e ${tt.groups[1]} (M = ${tt.means[1]}) para ${tt.variable} (p = ${tt.pValue}).`,
  };
  return templates[lang] || templates.en;
}

function interpAnova(a: { dependent: string; factor: string; fStat: number; pValue: number; groups: { name: string; mean: number }[] }, lang: string) {
  const sig = a.pValue < 0.05;
  const templates: Record<string, string> = {
    fr: `L'ANOVA révèle ${sig ? "un effet significatif" : "aucun effet significatif"} de ${a.factor} sur ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}).`,
    en: `ANOVA reveals ${sig ? "a significant effect" : "no significant effect"} of ${a.factor} on ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}).`,
    es: `El ANOVA revela ${sig ? "un efecto significativo" : "ningún efecto significativo"} de ${a.factor} sobre ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}).`,
    de: `Die ANOVA zeigt ${sig ? "einen signifikanten Effekt" : "keinen signifikanten Effekt"} von ${a.factor} auf ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}).`,
    pt: `A ANOVA revela ${sig ? "um efeito significativo" : "nenhum efeito significativo"} de ${a.factor} sobre ${a.dependent} (F = ${a.fStat}, p = ${a.pValue}).`,
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

function interpCluster(cl: NonNullable<AnalysisResultItem["clusterAnalysis"]>, lang: string) {
  const bssRatio = cl.totalSS > 0 ? ((cl.betweenSS / cl.totalSS) * 100).toFixed(1) : "0";
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
  // If chart title already has a meaningful name, use it cleaned up
  return chartTitle;
}

// Generate figure interpretation
export function generateFigureInterpretation(
  chartType: string,
  chartTitle: string,
  data: { name?: string; value?: number; x?: number; y?: number }[],
  lang: string,
): string {
  if (!data || data.length === 0) return "";

  if (chartType === "histogram" || chartType === "bar") {
    const sorted = [...data].filter(d => d.value != null).sort((a, b) => (b.value || 0) - (a.value || 0));
    const top = sorted[0];
    if (!top) return "";
    const templates: Record<string, string> = {
      fr: `Le graphique montre que la modalité "${top.name}" est la plus fréquente avec ${top.value} occurrences.`,
      en: `The chart shows that "${top.name}" is the most frequent category with ${top.value} occurrences.`,
      es: `El gráfico muestra que "${top.name}" es la categoría más frecuente con ${top.value} ocurrencias.`,
      de: `Das Diagramm zeigt, dass "${top.name}" mit ${top.value} Vorkommen die häufigste Kategorie ist.`,
      pt: `O gráfico mostra que "${top.name}" é a categoria mais frequente com ${top.value} ocorrências.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "pie") {
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    const top = [...data].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
    if (!top || !total) return "";
    const pct = ((top.value || 0) / total * 100).toFixed(1);
    const templates: Record<string, string> = {
      fr: `La catégorie "${top.name}" représente ${pct}% de l'ensemble des observations.`,
      en: `The category "${top.name}" accounts for ${pct}% of all observations.`,
      es: `La categoría "${top.name}" representa ${pct}% de todas las observaciones.`,
      de: `Die Kategorie "${top.name}" macht ${pct}% aller Beobachtungen aus.`,
      pt: `A categoria "${top.name}" representa ${pct}% de todas as observações.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "scatter") {
    const templates: Record<string, string> = {
      fr: `Le nuage de points illustre la relation entre les deux variables analysées.`,
      en: `The scatter plot illustrates the relationship between the two analyzed variables.`,
      es: `El diagrama de dispersión ilustra la relación entre las dos variables analizadas.`,
      de: `Das Streudiagramm veranschaulicht die Beziehung zwischen den beiden analysierten Variablen.`,
      pt: `O diagrama de dispersão ilustra a relação entre as duas variáveis analisadas.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "scree") {
    const components = data.filter(d => d.value != null);
    const retained = components.filter(d => (d.value || 0) >= 1).length;
    const lastCum = components[components.length - 1] as { cumulative?: number } | undefined;
    const totalVar = (lastCum as any)?.cumulative || 0;
    const templates: Record<string, string> = {
      fr: `Le scree plot révèle ${retained} composante(s) avec une valeur propre ≥ 1, expliquant ${totalVar.toFixed(1)}% de la variance totale.`,
      en: `The scree plot reveals ${retained} component(s) with eigenvalue ≥ 1, explaining ${totalVar.toFixed(1)}% of total variance.`,
      es: `El gráfico de sedimentación revela ${retained} componente(s) con autovalor ≥ 1, explicando ${totalVar.toFixed(1)}% de la varianza total.`,
      de: `Das Scree-Plot zeigt ${retained} Komponente(n) mit Eigenwert ≥ 1, die ${totalVar.toFixed(1)}% der Gesamtvarianz erklären.`,
      pt: `O scree plot revela ${retained} componente(s) com autovalor ≥ 1, explicando ${totalVar.toFixed(1)}% da variância total.`,
    };
    return templates[lang] || templates.en;
  }

  if (chartType === "cluster-scatter") {
    const clusters = new Set(data.map(d => (d as any).cluster));
    const n = data.length;
    const templates: Record<string, string> = {
      fr: `Le diagramme de dispersion montre ${clusters.size} clusters distincts sur ${n} observations.`,
      en: `The scatter plot shows ${clusters.size} distinct clusters across ${n} observations.`,
      es: `El diagrama de dispersión muestra ${clusters.size} clusters distintos en ${n} observaciones.`,
      de: `Das Streudiagramm zeigt ${clusters.size} verschiedene Cluster über ${n} Beobachtungen.`,
      pt: `O diagrama de dispersão mostra ${clusters.size} clusters distintos em ${n} observações.`,
    };
    return templates[lang] || templates.en;
  }

  return "";
}

export { getTableLabel, getFigureLabel, getSource };
