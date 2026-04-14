import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak, ImageRun } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { dataUrlToUint8Array } from "./chartImageRenderer";
import { getTableLabel, getFigureLabel, generateTableInterpretation, generateFigureInterpretation, getDescriptiveHeaders } from "./academicFormatter";
import type { AnalysisResultItem } from "./statsEngine";
import { stripLatex } from "./latexSanitizer";
import { formatChiSquare, formatTTest, formatAnova, formatCorrelation, formatRSquared, formatPValue, type StatSoftware } from "./softwareFormatter";

export interface ChartImage {
  title: string;
  dataUrl: string;
  width: number;
  height: number;
  chartType?: string;
  chartData?: { name?: string; value?: number; x?: number; y?: number }[];
}

export interface ExportData {
  projectTitle: string;
  projectType: string;
  projectDomain: string;
  projectDescription: string;
  level: string;
  lang: string;
  university?: string;
  department?: string;
  author?: string;
  statsTable: { variable: string; n: number; mean: number; std: number; min: number; max: number }[];
  testResults: { label: string; value: string }[];
  interpretation: string;
  conclusion: string;
  recommendations: string;
  chartImages?: ChartImage[];
  analysisResults?: AnalysisResultItem[];
  academicReport?: import("@/lib/academicFormatter").AcademicReport;
  // Academic metadata
  objective?: string;
  specificObjectives?: string[];
  studyType?: string;
  studyDesign?: string;
  population?: string;
  primaryVariable?: string;
  hypothesis?: string;
  advancedHypothesis?: string;
  independentVars?: string;
  dependentVar?: string;
  controlVars?: string;
  mediatorVars?: string;
  moderatorVars?: string;
  conceptualModel?: string;
  software?: StatSoftware;
}

/** Format test results with software-adaptive notation */
export function formatTestResultsAdaptive(analysisResults: AnalysisResultItem[], software: StatSoftware): { label: string; value: string }[] {
  const opts = { software };
  const results: { label: string; value: string }[] = [];

  for (const result of analysisResults) {
    if (result.correlations) {
      for (const c of result.correlations) {
        results.push({ label: `Pearson (${c.var1} × ${c.var2})`, value: formatCorrelation(c.r, c.pValue, c.n, "pearson", opts) });
      }
    }
    if (result.spearmanCorrelations) {
      for (const s of result.spearmanCorrelations) {
        results.push({ label: `Spearman (${s.var1} × ${s.var2})`, value: formatCorrelation(s.rho, s.pValue, s.n, "spearman", opts) });
      }
    }
    if (result.regressions) {
      for (const reg of result.regressions) {
        results.push({ label: `${reg.dependent}`, value: formatRSquared(reg.rSquared, reg.adjustedR2, opts) });
        for (const coeff of reg.coefficients) {
          results.push({ label: `  ${coeff.variable}`, value: `b = ${coeff.b}, SE = ${coeff.se}, t = ${coeff.t}, ${formatPValue(coeff.p, opts)}` });
        }
      }
    }
    if (result.tTests) {
      for (const tt of result.tTests) {
        results.push({ label: `T-test: ${tt.variable}`, value: formatTTest(tt.tStat, tt.df, tt.pValue, opts) });
      }
    }
    if (result.pairedTTests) {
      for (const pt of result.pairedTTests) {
        results.push({ label: `Paired t-test: ${pt.var1} × ${pt.var2}`, value: formatTTest(pt.tStat, pt.df, pt.pValue, opts) });
      }
    }
    if (result.anovas) {
      for (const a of result.anovas) {
        results.push({ label: `ANOVA: ${a.dependent} × ${a.factor}`, value: formatAnova(a.fStat, a.dfBetween, a.dfWithin, a.pValue, opts) });
      }
    }
    if (result.chiSquares) {
      for (const c of result.chiSquares) {
        results.push({ label: `Chi²: ${c.var1} × ${c.var2}`, value: formatChiSquare(c.chiSquare, c.df, c.pValue, opts) });
        results.push({ label: `  Cramér's V`, value: c.cramersV.toFixed(3) });
      }
    }
    if (result.mannWhitney) {
      for (const mw of result.mannWhitney) {
        results.push({ label: `Mann-Whitney: ${mw.variable}`, value: `U = ${mw.U}, ${formatPValue(mw.pValue, opts)}` });
      }
    }
    if (result.wilcoxon) {
      for (const w of result.wilcoxon) {
        results.push({ label: `Wilcoxon: ${w.var1} × ${w.var2}`, value: `W = ${w.W}, ${formatPValue(w.pValue, opts)}` });
      }
    }
    if (result.kruskalWallis) {
      for (const kw of result.kruskalWallis) {
        results.push({ label: `Kruskal-Wallis: ${kw.dependent}`, value: `H = ${kw.H}, df = ${kw.df}, ${formatPValue(kw.pValue, opts)}` });
      }
    }
    if (result.shapiroWilk) {
      for (const sw of result.shapiroWilk) {
        results.push({ label: `Shapiro-Wilk: ${sw.variable}`, value: `W = ${sw.W}, ${formatPValue(sw.pValue, opts)}` });
      }
    }
    if (result.cronbachAlpha) {
      results.push({ label: `Cronbach's Alpha`, value: `α = ${result.cronbachAlpha.alpha}, items = ${result.cronbachAlpha.itemCount}` });
    }
    if (result.pca) {
      results.push({ label: `PCA`, value: `${result.pca.components.length} components, KMO = ${result.pca.kmo?.toFixed(3) || "N/A"}` });
    }
    if (result.factorAnalysis) {
      results.push({ label: `Factor Analysis`, value: `${result.factorAnalysis.factors.length} factors (${result.factorAnalysis.rotation})` });
    }
  }

  return results;
}

type ExportContent = "full" | "results" | "graphs" | "interpretation" | "conclusion";

const labels: Record<string, Record<string, string>> = {
  fr: {
    fullReport: "Rapport d'Analyse Complet",
    projectInfo: "Informations du Projet",
    title: "Titre du projet",
    level: "Niveau d'étude",
    domain: "Domaine de recherche",
    type: "Type de projet",
    description: "Description",
    statsResults: "Résultats Statistiques",
    descriptiveStats: "Statistiques Descriptives",
    testResults: "Résultats des Tests",
    variable: "Variable",
    mean: "Moyenne",
    std: "Écart-type",
    interpretation: "Interprétation Académique",
    conclusion: "Conclusion",
    recommendations: "Recommandations",
    generatedBy: "Généré par Dr Data 2.0 — Assistant Joël",
    noData: "Les données seront disponibles après l'analyse.",
    charts: "Graphiques",
    studyObjectives: "Objectifs de l'étude",
    methodology: "Méthodologie",
    generalObjective: "Objectif général",
    specificObjectives: "Objectifs spécifiques",
    studyType: "Type d'étude",
    studyDesign: "Devis de recherche",
    population: "Population d'étude",
    primaryVariable: "Variable principale",
    hypothesis: "Hypothèse",
    advancedHypothesis: "Hypothèse avancée",
    independentVars: "Variables indépendantes",
    dependentVar: "Variable dépendante",
    controlVars: "Variables de contrôle",
    mediatorVars: "Variables médiatrices",
    moderatorVars: "Variables modératrices",
    conceptualModel: "Modèle conceptuel",
  },
  en: {
    fullReport: "Full Analysis Report",
    projectInfo: "Project Information",
    title: "Project Title",
    level: "Study Level",
    domain: "Research Domain",
    type: "Project Type",
    description: "Description",
    statsResults: "Statistical Results",
    descriptiveStats: "Descriptive Statistics",
    testResults: "Test Results",
    variable: "Variable",
    mean: "Mean",
    std: "Std. Dev.",
    interpretation: "Academic Interpretation",
    conclusion: "Conclusion",
    recommendations: "Recommendations",
    generatedBy: "Generated by Dr Data 2.0 — Assistant Joël",
    noData: "Data will be available after analysis.",
    charts: "Charts",
    studyObjectives: "Study Objectives",
    methodology: "Methodology",
    generalObjective: "General Objective",
    specificObjectives: "Specific Objectives",
    studyType: "Study Type",
    studyDesign: "Study Design",
    population: "Study Population",
    primaryVariable: "Primary Variable",
    hypothesis: "Hypothesis",
    advancedHypothesis: "Advanced Hypothesis",
    independentVars: "Independent Variables",
    dependentVar: "Dependent Variable",
    controlVars: "Control Variables",
    mediatorVars: "Mediator Variables",
    moderatorVars: "Moderator Variables",
    conceptualModel: "Conceptual Model",
  },
  es: {
    fullReport: "Informe de Análisis Completo",
    projectInfo: "Información del Proyecto",
    title: "Título del proyecto",
    level: "Nivel de estudio",
    domain: "Dominio de investigación",
    type: "Tipo de proyecto",
    description: "Descripción",
    statsResults: "Resultados Estadísticos",
    descriptiveStats: "Estadísticas Descriptivas",
    testResults: "Resultados de Pruebas",
    variable: "Variable",
    mean: "Media",
    std: "Desv. Est.",
    interpretation: "Interpretación Académica",
    conclusion: "Conclusión",
    recommendations: "Recomendaciones",
    generatedBy: "Generado por Dr Data 2.0 — Asistente Joël",
    noData: "Los datos estarán disponibles después del análisis.",
    charts: "Gráficos",
    studyObjectives: "Objetivos del estudio",
    methodology: "Metodología",
    generalObjective: "Objetivo general",
    specificObjectives: "Objetivos específicos",
    studyType: "Tipo de estudio",
    studyDesign: "Diseño del estudio",
    population: "Población de estudio",
    primaryVariable: "Variable principal",
    hypothesis: "Hipótesis",
    advancedHypothesis: "Hipótesis avanzada",
    independentVars: "Variables independientes",
    dependentVar: "Variable dependiente",
    controlVars: "Variables de control",
    mediatorVars: "Variables mediadoras",
    moderatorVars: "Variables moderadoras",
    conceptualModel: "Modelo conceptual",
  },
  de: {
    fullReport: "Vollständiger Analysebericht",
    projectInfo: "Projektinformationen",
    title: "Projekttitel",
    level: "Studienstufe",
    domain: "Forschungsbereich",
    type: "Projekttyp",
    description: "Beschreibung",
    statsResults: "Statistische Ergebnisse",
    descriptiveStats: "Deskriptive Statistik",
    testResults: "Testergebnisse",
    variable: "Variable",
    mean: "Mittelwert",
    std: "Std. Abw.",
    interpretation: "Akademische Interpretation",
    conclusion: "Schlussfolgerung",
    recommendations: "Empfehlungen",
    generatedBy: "Erstellt mit Dr Data 2.0 — Assistent Joël",
    noData: "Daten werden nach der Analyse verfügbar sein.",
    charts: "Diagramme",
    studyObjectives: "Studienziele",
    methodology: "Methodik",
    generalObjective: "Allgemeines Ziel",
    specificObjectives: "Spezifische Ziele",
    studyType: "Studientyp",
    studyDesign: "Studiendesign",
    population: "Studienpopulation",
    primaryVariable: "Hauptvariable",
    hypothesis: "Hypothese",
    advancedHypothesis: "Erweiterte Hypothese",
    independentVars: "Unabhängige Variablen",
    dependentVar: "Abhängige Variable",
    controlVars: "Kontrollvariablen",
    mediatorVars: "Mediatorvariablen",
    moderatorVars: "Moderatorvariablen",
    conceptualModel: "Konzeptmodell",
  },
  pt: {
    fullReport: "Relatório de Análise Completo",
    projectInfo: "Informações do Projeto",
    title: "Título do projeto",
    level: "Nível de estudo",
    domain: "Domínio de pesquisa",
    type: "Tipo de projeto",
    description: "Descrição",
    statsResults: "Resultados Estatísticos",
    descriptiveStats: "Estatísticas Descritivas",
    testResults: "Resultados dos Testes",
    variable: "Variável",
    mean: "Média",
    std: "Desvio Padrão",
    interpretation: "Interpretação Acadêmica",
    conclusion: "Conclusão",
    recommendations: "Recomendações",
    generatedBy: "Gerado por Dr Data 2.0 — Assistente Joël",
    noData: "Os dados estarão disponíveis após a análise.",
    charts: "Gráficos",
    studyObjectives: "Objetivos do estudo",
    methodology: "Metodologia",
    generalObjective: "Objetivo geral",
    specificObjectives: "Objetivos específicos",
    studyType: "Tipo de estudo",
    studyDesign: "Desenho do estudo",
    population: "População de estudo",
    primaryVariable: "Variável principal",
    hypothesis: "Hipótese",
    advancedHypothesis: "Hipótese avançada",
    independentVars: "Variáveis independentes",
    dependentVar: "Variável dependente",
    controlVars: "Variáveis de controle",
    mediatorVars: "Variáveis mediadoras",
    moderatorVars: "Variáveis moderadoras",
    conceptualModel: "Modelo conceitual",
  },
};

function l(lang: string): Record<string, string> {
  return labels[lang] || labels.en;
}

function levelLabel(level: string, lang: string): string {
  const map: Record<string, Record<string, string>> = {
    fr: { student_license: "Licence", student_master: "Master", student_doctorat: "Doctorat" },
    en: { student_license: "Bachelor", student_master: "Master", student_doctorat: "Doctorate" },
    es: { student_license: "Licenciatura", student_master: "Máster", student_doctorat: "Doctorado" },
    de: { student_license: "Bachelor", student_master: "Master", student_doctorat: "Doktorat" },
    pt: { student_license: "Licenciatura", student_master: "Mestrado", student_doctorat: "Doutorado" },
  };
  return (map[lang] || map.en)[level] || level;
}

function filePrefix(level: string): string {
  if (level.includes("master")) return "Master";
  if (level.includes("doctorat")) return "Doctorate";
  return "Licence";
}

// ─── DOCX Export ───

export async function exportDocx(data: ExportData, content: ExportContent) {
  const t = l(data.lang);
  const sections: (Paragraph | Table)[] = [];

  const addHeading = (text: string, headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) =>
    sections.push(new Paragraph({ heading: headingLevel, children: [new TextRun({ text, bold: true })] }));

  const addText = (text: string) =>
    sections.push(new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } }));

  const addField = (label: string, value: string) =>
    sections.push(new Paragraph({
      children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun(value)],
      spacing: { after: 80 },
    }));

  // Title page
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 400 },
    children: [new TextRun({ text: t.fullReport, bold: true, size: 48 })],
  }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: data.projectTitle, size: 32 })],
    spacing: { after: 200 },
  }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: t.generatedBy, size: 20, italics: true, color: "666666" })],
    spacing: { after: 600 },
  }));
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // Project Info
  if (content === "full" || content === "results") {
    addHeading(t.projectInfo);
    addField(t.title, data.projectTitle);
    addField(t.level, levelLabel(data.level, data.lang));
    addField(t.type, data.projectType);
    addField(t.domain, data.projectDomain);
    if (data.projectDescription) addField(t.description, data.projectDescription);
    if (data.population) addField(t.population, data.population);
    if (data.primaryVariable) addField(t.primaryVariable, data.primaryVariable);
    sections.push(new Paragraph({ children: [] }));

    // Study Objectives
    const hasObjectives = data.objective || (data.specificObjectives && data.specificObjectives.length > 0);
    if (hasObjectives) {
      addHeading(t.studyObjectives, HeadingLevel.HEADING_2);
      if (data.objective) addField(t.generalObjective, data.objective);
      if (data.specificObjectives && data.specificObjectives.length > 0) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `${t.specificObjectives}:`, bold: true })],
          spacing: { after: 40 },
        }));
        data.specificObjectives.forEach((obj, i) => {
          sections.push(new Paragraph({
            children: [new TextRun(`${i + 1}. ${obj}`)],
            spacing: { after: 40 },
            indent: { left: 360 },
          }));
        });
      }
      sections.push(new Paragraph({ children: [] }));
    }

    // Methodology
    const hasMethodology = data.studyType || data.studyDesign || data.hypothesis || data.independentVars || data.dependentVar;
    if (hasMethodology) {
      addHeading(t.methodology, HeadingLevel.HEADING_2);
      if (data.studyType) addField(t.studyType, data.studyType);
      if (data.studyDesign) addField(t.studyDesign, data.studyDesign);
      if (data.hypothesis) addField(t.hypothesis, data.hypothesis);
      if (data.advancedHypothesis) addField(t.advancedHypothesis, data.advancedHypothesis);
      if (data.independentVars) addField(t.independentVars, data.independentVars);
      if (data.dependentVar) addField(t.dependentVar, data.dependentVar);
      if (data.controlVars) addField(t.controlVars, data.controlVars);
      if (data.mediatorVars) addField(t.mediatorVars, data.mediatorVars);
      if (data.moderatorVars) addField(t.moderatorVars, data.moderatorVars);
      if (data.conceptualModel) addField(t.conceptualModel, data.conceptualModel);
      sections.push(new Paragraph({ children: [] }));
    }
  }

  // Stats tables with academic formatting
  if (content === "full" || content === "results") {
    const tableLabel = getTableLabel(data.lang);
    
    let tableNum = 1;

    addHeading(t.statsResults);

    // Descriptive stats table
    if (data.statsTable.length > 0) {
      // Academic table title
      sections.push(new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
          new TextRun({ text: t.descriptiveStats, bold: true, size: 22 }),
        ],
      }));

      const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
      const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
      const headers = getDescriptiveHeaders(data.lang);
      const headerRow = new TableRow({
        children: headers.map(h => new TableCell({
          borders,
          shading: { fill: "2563EB", type: ShadingType.CLEAR },
          width: { size: 1560, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
        })),
      });
      const dataRows = data.statsTable.map(row => new TableRow({
        children: [row.variable, String(row.n), String(row.mean), String(row.std), String(row.min), String(row.max)].map(v =>
          new TableCell({
            borders,
            width: { size: 1560, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: v, size: 20 })] })],
          })
        ),
      }));

      sections.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1560, 1560, 1560, 1560, 1560, 1560],
        rows: [headerRow, ...dataRows],
      }));

      sections.push(new Paragraph({ spacing: { before: 60, after: 40 }, children: [] }));

      // Interpretation for descriptive stats
      if (data.analysisResults) {
        const descResult = data.analysisResults.find(r => r.descriptive && r.descriptive.length > 0);
        if (descResult) {
          const interp = generateTableInterpretation(descResult, data.lang, data.level);
          if (interp) {
            sections.push(new Paragraph({
              spacing: { before: 40, after: 120 },
              children: [
                new TextRun({ text: t.interpretation + ": ", bold: true, italics: true, size: 20 }),
                new TextRun({ text: interp, italics: true, size: 20 }),
              ],
            }));
          }
        }
      }

      tableNum++;
      sections.push(new Paragraph({ children: [] }));
    }

    // Per-analysis sequential tables with adaptive formatting
    if (data.analysisResults && data.analysisResults.length > 0) {
      const sw = data.software || "" as StatSoftware;
      const opts = { software: sw };
      const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
      const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

      const makeTableHeader = (headers: string[]) => new TableRow({
        children: headers.map(h => new TableCell({
          borders,
          shading: { fill: "2563EB", type: ShadingType.CLEAR },
          width: { size: Math.floor(9360 / headers.length), type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
        })),
      });

      const makeRow = (cells: string[], widths?: number[]) => new TableRow({
        children: cells.map((v, i) => new TableCell({
          borders,
          width: { size: widths ? widths[i] : Math.floor(9360 / cells.length), type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: v, size: 20 })] })],
        })),
      });

      for (const result of data.analysisResults) {
        // Chi-square / Cross-tab
        if (result.chiSquares) {
          for (const chi of result.chiSquares) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `Chi-square — ${chi.var1} × ${chi.var2}`, bold: true, size: 22 }),
              ],
            }));

            // Contingency table
            if (chi.contingencyTable) {
              const ct = chi.contingencyTable;
              const ctHeaders = ["", ...ct.colLabels, "Total"];
              const ctRows = ct.rowLabels.map((rl, ri) => [
                rl,
                ...ct.observed[ri].map((o, ci) => `${o} (${ct.expected[ri][ci]})`),
                String(ct.rowTotals[ri]),
              ]);
              ctRows.push(["Total", ...ct.colTotals.map(String), String(ct.grandTotal)]);

              sections.push(new Table({
                width: { size: 9360, type: WidthType.DXA },
                columnWidths: Array(ctHeaders.length).fill(Math.floor(9360 / ctHeaders.length)),
                rows: [makeTableHeader(ctHeaders), ...ctRows.map(r => makeRow(r))],
              }));
            }

            // Stats summary
            sections.push(new Paragraph({
              spacing: { before: 60, after: 40 },
              children: [new TextRun({ text: formatChiSquare(chi.chiSquare, chi.df, chi.pValue, opts), size: 20, italics: true })],
            }));
            sections.push(new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: `Cramér's V = ${chi.cramersV.toFixed(3)}`, size: 20, italics: true })],
            }));

            const interp = generateTableInterpretation(result, data.lang, data.level);
            if (interp) {
              sections.push(new Paragraph({
                spacing: { before: 40, after: 120 },
                children: [new TextRun({ text: interp, italics: true, size: 20 })],
              }));
            }

            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // Correlations
        if (result.correlations && result.correlations.length > 0) {
          sections.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
              new TextRun({ text: "Correlations", bold: true, size: 22 }),
            ],
          }));
          const corrRows = result.correlations.map(c => makeRow([
            `${c.var1} × ${c.var2}`,
            formatCorrelation(c.r, c.pValue, c.n, "pearson", opts),
          ], [3120, 6240]));
          sections.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [3120, 6240],
            rows: [makeTableHeader(["Variables", "Result"]), ...corrRows],
          }));
          tableNum++;
          sections.push(new Paragraph({ children: [] }));
        }

        // T-tests
        if (result.tTests && result.tTests.length > 0) {
          for (const tt of result.tTests) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `T-test — ${tt.variable}`, bold: true, size: 22 }),
              ],
            }));
            const rows = tt.groups.map((g, i) => makeRow([g, tt.means[i].toFixed(3)], [4680, 4680]));
            rows.push(makeRow(["Result", formatTTest(tt.tStat, tt.df, tt.pValue, opts)], [4680, 4680]));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [4680, 4680],
              rows: [makeTableHeader(["Group", "Mean"]), ...rows],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // ANOVA
        if (result.anovas && result.anovas.length > 0) {
          for (const a of result.anovas) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `ANOVA — ${a.dependent} × ${a.factor}`, bold: true, size: 22 }),
              ],
            }));
            const rows = a.groups.map(g => makeRow([g.name, String(g.n), g.mean.toFixed(3), g.std.toFixed(3)]));
            rows.push(makeRow(["Result", "", formatAnova(a.fStat, a.dfBetween, a.dfWithin, a.pValue, opts), ""]));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [2340, 2340, 2340, 2340],
              rows: [makeTableHeader(["Group", "N", "Mean", "Std. Dev."]), ...rows],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // Regression
        if (result.regressions && result.regressions.length > 0) {
          for (const reg of result.regressions) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `Regression — ${reg.dependent}`, bold: true, size: 22 }),
              ],
            }));
            const rows = reg.coefficients.map(c => makeRow([
              c.variable, c.b.toFixed(4), c.se.toFixed(4), c.t.toFixed(3), formatPValue(c.p, opts),
            ]));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [1872, 1872, 1872, 1872, 1872],
              rows: [makeTableHeader(["Variable", "B", "SE", "t", "p"]), ...rows],
            }));
            sections.push(new Paragraph({
              spacing: { before: 60, after: 120 },
              children: [new TextRun({ text: formatRSquared(reg.rSquared, reg.adjustedR2, opts), italics: true, size: 20 })],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // Spearman Correlations
        if (result.spearmanCorrelations && result.spearmanCorrelations.length > 0) {
          sections.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
              new TextRun({ text: "Spearman Correlations", bold: true, size: 22 }),
            ],
          }));
          const rows = result.spearmanCorrelations.map(s => makeRow([
            `${s.var1} × ${s.var2}`, s.rho.toFixed(3), formatPValue(s.pValue, opts), String(s.n),
          ]));
          sections.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2340, 2340, 2340, 2340],
            rows: [makeTableHeader(["Variables", "ρ", "p", "N"]), ...rows],
          }));
          tableNum++;
          sections.push(new Paragraph({ children: [] }));
        }

        // Kendall Correlations
        if (result.kendallCorrelations && result.kendallCorrelations.length > 0) {
          sections.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
              new TextRun({ text: "Kendall Correlations", bold: true, size: 22 }),
            ],
          }));
          const rows = result.kendallCorrelations.map(k => makeRow([
            `${k.var1} × ${k.var2}`, k.tau.toFixed(3), formatPValue(k.pValue, opts), String(k.n),
          ]));
          sections.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2340, 2340, 2340, 2340],
            rows: [makeTableHeader(["Variables", "τ", "p", "N"]), ...rows],
          }));
          tableNum++;
          sections.push(new Paragraph({ children: [] }));
        }

        // Mann-Whitney
        if (result.mannWhitney && result.mannWhitney.length > 0) {
          for (const mw of result.mannWhitney) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `Mann-Whitney — ${mw.variable}`, bold: true, size: 22 }),
              ],
            }));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [4680, 4680],
              rows: [
                makeTableHeader(["Statistic", "Value"]),
                makeRow(["Groups", mw.groups.join(" vs ")], [4680, 4680]),
                makeRow(["U", mw.U.toFixed(3)], [4680, 4680]),
                makeRow(["z", mw.z.toFixed(3)], [4680, 4680]),
                makeRow(["p-value", formatPValue(mw.pValue, opts)], [4680, 4680]),
                makeRow(["n₁ / n₂", `${mw.n1} / ${mw.n2}`], [4680, 4680]),
              ],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // Wilcoxon
        if (result.wilcoxon && result.wilcoxon.length > 0) {
          for (const w of result.wilcoxon) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `Wilcoxon — ${w.var1} × ${w.var2}`, bold: true, size: 22 }),
              ],
            }));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [4680, 4680],
              rows: [
                makeTableHeader(["Statistic", "Value"]),
                makeRow(["W", w.W.toFixed(3)], [4680, 4680]),
                makeRow(["p-value", formatPValue(w.pValue, opts)], [4680, 4680]),
              ],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // Kruskal-Wallis
        if (result.kruskalWallis && result.kruskalWallis.length > 0) {
          for (const kw of result.kruskalWallis) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `Kruskal-Wallis — ${kw.dependent}`, bold: true, size: 22 }),
              ],
            }));
            const rows = kw.groups.map(g => makeRow([g.name, g.meanRank.toFixed(2)], [4680, 4680]));
            rows.push(makeRow(["Result", `H(${kw.df}) = ${kw.H.toFixed(3)}, ${formatPValue(kw.pValue, opts)}`], [4680, 4680]));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [4680, 4680],
              rows: [makeTableHeader(["Group", "Mean Rank"]), ...rows],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // Shapiro-Wilk
        if (result.shapiroWilk && result.shapiroWilk.length > 0) {
          sections.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
              new TextRun({ text: "Shapiro-Wilk Normality Test", bold: true, size: 22 }),
            ],
          }));
          const rows = result.shapiroWilk.map(sw => makeRow([
            sw.variable, sw.W.toFixed(4), formatPValue(sw.pValue, opts), sw.isNormal ? "Yes" : "No",
          ]));
          sections.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2340, 2340, 2340, 2340],
            rows: [makeTableHeader(["Variable", "W", "p", "Normal"]), ...rows],
          }));
          tableNum++;
          sections.push(new Paragraph({ children: [] }));
        }

        // Cronbach's Alpha
        if (result.cronbachAlpha) {
          const ca = result.cronbachAlpha;
          sections.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
              new TextRun({ text: "Cronbach's Alpha", bold: true, size: 22 }),
            ],
          }));
          const rows = [
            makeRow(["Alpha (α)", ca.alpha.toFixed(4)], [4680, 4680]),
            makeRow(["Items", String(ca.itemCount)], [4680, 4680]),
          ];
          if (ca.variables) rows.push(makeRow(["Variables", ca.variables.join(", ")], [4680, 4680]));
          sections.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [4680, 4680],
            rows: [makeTableHeader(["Statistic", "Value"]), ...rows],
          }));
          const reliability = ca.alpha >= 0.9 ? "Excellent" : ca.alpha >= 0.8 ? "Good" : ca.alpha >= 0.7 ? "Acceptable" : ca.alpha >= 0.6 ? "Questionable" : "Poor";
          sections.push(new Paragraph({
            spacing: { before: 60, after: 120 },
            children: [new TextRun({ text: `${reliability} reliability`, italics: true, size: 20 })],
          }));
          tableNum++;
          sections.push(new Paragraph({ children: [] }));
        }

        // Paired T-tests
        if (result.pairedTTests && result.pairedTTests.length > 0) {
          for (const pt of result.pairedTTests) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `Paired T-test — ${pt.var1} × ${pt.var2}`, bold: true, size: 22 }),
              ],
            }));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: [4680, 4680],
              rows: [
                makeTableHeader(["Statistic", "Value"]),
                makeRow(["Mean Diff", pt.meanDiff.toFixed(4)], [4680, 4680]),
                makeRow(["t", pt.tStat.toFixed(3)], [4680, 4680]),
                makeRow(["df", String(pt.df)], [4680, 4680]),
                makeRow(["p-value", formatPValue(pt.pValue, opts)], [4680, 4680]),
                makeRow(["N", String(pt.n)], [4680, 4680]),
              ],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // PCA
        if (result.pca) {
          const pca = result.pca;
          sections.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
              new TextRun({ text: "PCA — Variance Explained", bold: true, size: 22 }),
            ],
          }));
          const pcaRows = pca.components.map(c => makeRow([
            `PC${c.component}`, c.eigenvalue.toFixed(4), `${c.varianceExplained.toFixed(2)}%`, `${c.cumulativeVariance.toFixed(2)}%`,
          ]));
          sections.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2340, 2340, 2340, 2340],
            rows: [makeTableHeader(["Component", "Eigenvalue", "% Variance", "Cumulative %"]), ...pcaRows],
          }));
          if (pca.kmo !== undefined) {
            sections.push(new Paragraph({
              spacing: { before: 60, after: 40 },
              children: [new TextRun({ text: `KMO = ${pca.kmo.toFixed(3)}`, italics: true, size: 20 })],
            }));
          }
          tableNum++;
          sections.push(new Paragraph({ children: [] }));

          // PCA Loadings
          if (pca.loadings && pca.loadings.length > 0) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: "PCA — Component Loadings", bold: true, size: 22 }),
              ],
            }));
            const loadHeaders = ["Variable", ...pca.components.map(c => `PC${c.component}`)];
            const loadRows = pca.loadings.map(l => makeRow([l.variable, ...l.components.map(v => v.toFixed(3))]));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: Array(loadHeaders.length).fill(Math.floor(9360 / loadHeaders.length)),
              rows: [makeTableHeader(loadHeaders), ...loadRows],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }

        // Factor Analysis
        if (result.factorAnalysis) {
          const fa = result.factorAnalysis;
          sections.push(new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
              new TextRun({ text: `Factor Analysis — Variance Explained (${fa.rotation})`, bold: true, size: 22 }),
            ],
          }));
          const faRows = fa.factors.map(f => makeRow([
            `F${f.factor}`, f.eigenvalue.toFixed(4), `${f.varianceExplained.toFixed(2)}%`, `${f.cumulativeVariance.toFixed(2)}%`,
          ]));
          sections.push(new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2340, 2340, 2340, 2340],
            rows: [makeTableHeader(["Factor", "Eigenvalue", "% Variance", "Cumulative %"]), ...faRows],
          }));
          tableNum++;
          sections.push(new Paragraph({ children: [] }));

          // Rotated Loadings
          if (fa.rotatedLoadings && fa.rotatedLoadings.length > 0) {
            sections.push(new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
                new TextRun({ text: `Rotated Factor Loadings (${fa.rotation})`, bold: true, size: 22 }),
              ],
            }));
            const rlHeaders = ["Variable", ...fa.factors.map(f => `F${f.factor}`), "Communality"];
            const rlRows = fa.rotatedLoadings.map((l, li) => makeRow([
              l.variable, ...l.factors.map(v => v.toFixed(3)), (fa.communalities[li]?.extraction ?? 0).toFixed(3),
            ]));
            sections.push(new Table({
              width: { size: 9360, type: WidthType.DXA },
              columnWidths: Array(rlHeaders.length).fill(Math.floor(9360 / rlHeaders.length)),
              rows: [makeTableHeader(rlHeaders), ...rlRows],
            }));
            tableNum++;
            sections.push(new Paragraph({ children: [] }));
          }
        }
      }
    }

    // Legacy test results fallback (if no analysisResults)
    if ((!data.analysisResults || data.analysisResults.length === 0) && data.testResults.length > 0) {
      const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
      const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
      sections.push(new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: `${tableLabel} ${tableNum}: `, bold: true, size: 22 }),
          new TextRun({ text: t.testResults, bold: true, size: 22 }),
        ],
      }));
      const headerRow = new TableRow({
        children: ["Test", t.variable.charAt(0).toUpperCase() + t.variable.slice(1)].map(h => new TableCell({
          borders,
          shading: { fill: "2563EB", type: ShadingType.CLEAR },
          width: { size: 4680, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })] })],
        })),
      });
      const testRows = data.testResults.map(r => new TableRow({
        children: [r.label, r.value].map(v => new TableCell({
          borders,
          width: { size: 4680, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: v, size: 20 })] })],
        })),
      }));
      sections.push(new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [4680, 4680],
        rows: [headerRow, ...testRows],
      }));
      tableNum++;
      sections.push(new Paragraph({ children: [] }));
    }
  }

  // Charts with academic formatting
  if ((content === "full" || content === "results") && data.chartImages && data.chartImages.length > 0) {
    const figLabel = getFigureLabel(data.lang);
    
    addHeading(t.charts, HeadingLevel.HEADING_2);

    for (let i = 0; i < data.chartImages.length; i++) {
      const chart = data.chartImages[i];
      const figNum = i + 1;

      // Academic figure title
      sections.push(new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: `${figLabel} ${figNum}: `, bold: true, size: 22 }),
          new TextRun({ text: chart.title, bold: true, size: 22 }),
        ],
      }));

      // Chart image
      try {
        const imgData = dataUrlToUint8Array(chart.dataUrl);
        sections.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({
            type: "png",
            data: imgData,
            transformation: { width: chart.width, height: chart.height },
            altText: { title: chart.title, description: chart.title, name: chart.title },
          })],
        }));
      } catch {
        // Skip chart if image fails
      }

      sections.push(new Paragraph({ spacing: { before: 60, after: 40 }, children: [] }));

      // Figure interpretation
      if (chart.chartType && chart.chartData) {
        const figInterp = generateFigureInterpretation(chart.chartType, chart.title, chart.chartData, data.lang);
        if (figInterp) {
          sections.push(new Paragraph({
            spacing: { before: 40, after: 120 },
            children: [
              new TextRun({ text: t.interpretation + ": ", bold: true, italics: true, size: 20 }),
              new TextRun({ text: figInterp, italics: true, size: 20 }),
            ],
          }));
        }
      }

      sections.push(new Paragraph({ children: [] }));
    }
  }

  // Interpretation
  if (content === "full" || content === "interpretation") {
    addHeading(t.interpretation);
    addText(stripLatex(data.interpretation || t.noData));
    sections.push(new Paragraph({ children: [] }));
  }

  // Conclusion
  if (content === "full" || content === "conclusion") {
    addHeading(t.conclusion);
    addText(data.conclusion || t.noData);
    sections.push(new Paragraph({ children: [] }));
    addHeading(t.recommendations);
    addText(data.recommendations || t.noData);
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Times New Roman", size: 24 }, paragraph: { spacing: { line: 360 } } } },
    },
    sections: [{ children: sections }],
  });

  const buffer = await Packer.toBlob(doc);
  const prefix = filePrefix(data.level);
  const contentSuffix = content === "full" ? "Analysis_Report" : content === "results" ? "Statistical_Results" : content === "interpretation" ? "Interpretation" : "Conclusion";
  saveAs(buffer, `${prefix}_${contentSuffix}.docx`);
}

// ─── PDF Export ───

export function exportPdf(data: ExportData, content: ExportContent) {
  const t = l(data.lang);
  const doc = new jsPDF();
  let y = 20;

  const addTitle = (text: string) => {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(text, 105, y, { align: "center" });
    y += 12;
  };

  const addH2 = (text: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(text, 14, y);
    y += 8;
  };

  const addBody = (text: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 14, y);
    y += lines.length * 6 + 4;
  };

  const addFieldPdf = (label: string, value: string) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}: `, 14, y);
    const labelW = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal");
    doc.text(value, 14 + labelW, y);
    y += 7;
  };

  // Title
  addTitle(t.fullReport);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(data.projectTitle, 105, y, { align: "center" });
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(t.generatedBy, 105, y, { align: "center" });
  doc.setTextColor(0);
  y += 16;

  if (content === "full" || content === "results") {
    addH2(t.projectInfo);
    addFieldPdf(t.title, data.projectTitle);
    addFieldPdf(t.level, levelLabel(data.level, data.lang));
    addFieldPdf(t.type, data.projectType);
    addFieldPdf(t.domain, data.projectDomain);
    if (data.projectDescription) addFieldPdf(t.description, data.projectDescription);
    if (data.population) addFieldPdf(t.population, data.population);
    if (data.primaryVariable) addFieldPdf(t.primaryVariable, data.primaryVariable);
    y += 4;

    // Study Objectives
    if (data.objective || (data.specificObjectives && data.specificObjectives.length > 0)) {
      addH2(t.studyObjectives);
      if (data.objective) addFieldPdf(t.generalObjective, data.objective);
      if (data.specificObjectives && data.specificObjectives.length > 0) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${t.specificObjectives}:`, 14, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        data.specificObjectives.forEach((obj, i) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(`${i + 1}. ${obj}`, 20, y);
          y += 6;
        });
      }
      y += 4;
    }

    // Methodology
    if (data.studyType || data.studyDesign || data.hypothesis || data.independentVars || data.dependentVar) {
      addH2(t.methodology);
      if (data.studyType) addFieldPdf(t.studyType, data.studyType);
      if (data.studyDesign) addFieldPdf(t.studyDesign, data.studyDesign);
      if (data.hypothesis) addFieldPdf(t.hypothesis, data.hypothesis);
      if (data.advancedHypothesis) addFieldPdf(t.advancedHypothesis, data.advancedHypothesis);
      if (data.independentVars) addFieldPdf(t.independentVars, data.independentVars);
      if (data.dependentVar) addFieldPdf(t.dependentVar, data.dependentVar);
      if (data.controlVars) addFieldPdf(t.controlVars, data.controlVars);
      if (data.mediatorVars) addFieldPdf(t.mediatorVars, data.mediatorVars);
      if (data.moderatorVars) addFieldPdf(t.moderatorVars, data.moderatorVars);
      if (data.conceptualModel) addFieldPdf(t.conceptualModel, data.conceptualModel);
      y += 4;
    }
    y += 2;

    addH2(t.descriptiveStats);

    const tableLabel = getTableLabel(data.lang);
    
    let tableNum = 1;

    // Academic table title
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${tableLabel} ${tableNum}: ${t.descriptiveStats}`, 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [[t.variable, "N", t.mean, t.std, "Min", "Max"]],
      body: data.statsTable.map(r => [r.variable, r.n, r.mean, r.std, r.min, r.max]),
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    y += 4;

    // Interpretation
    if (data.analysisResults) {
      const descResult = data.analysisResults.find(r => r.descriptive && r.descriptive.length > 0);
      if (descResult) {
        const interp = generateTableInterpretation(descResult, data.lang, data.level);
        if (interp) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          const interpLines = doc.splitTextToSize(interp, 180);
          doc.text(interpLines, 14, y);
          y += interpLines.length * 5 + 4;
        }
      }
    }
    doc.setFont("helvetica", "normal");
    tableNum++;
    y += 4;

    // Per-analysis sequential tables (matching Word structure)
    if (data.analysisResults && data.analysisResults.length > 0) {
      const sw = data.software || "" as StatSoftware;
      const opts = { software: sw };

      for (const result of data.analysisResults) {
        // Chi-square with contingency table
        if (result.chiSquares) {
          for (const chi of result.chiSquares) {
            if (y > 200) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: Chi² — ${chi.var1} × ${chi.var2}`, 14, y);
            y += 6;

            if (chi.contingencyTable) {
              const ct = chi.contingencyTable;
              const ctHead = [["", ...ct.colLabels, "Total"]];
              const ctBody = ct.rowLabels.map((rl, ri) => [
                rl,
                ...ct.observed[ri].map((o, ci) => `${o} (${ct.expected[ri][ci].toFixed(1)})`),
                String(ct.rowTotals[ri]),
              ]);
              ctBody.push(["Total", ...ct.colTotals.map(String), String(ct.grandTotal)]);

              autoTable(doc, {
                startY: y, head: ctHead, body: ctBody, theme: "grid",
                headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
              });
              y = (doc as any).lastAutoTable.finalY + 4;
            }

            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text(formatChiSquare(chi.chiSquare, chi.df, chi.pValue, opts), 14, y);
            y += 5;
            doc.text(`Cramér's V = ${chi.cramersV.toFixed(3)}`, 14, y);
            y += 5;

            const interp = generateTableInterpretation(result, data.lang, data.level);
            if (interp) {
              const interpLines = doc.splitTextToSize(interp, 180);
              doc.text(interpLines, 14, y);
              y += interpLines.length * 5 + 4;
            }
            doc.setFont("helvetica", "normal");
            tableNum++;
            y += 4;
          }
        }

        // Correlations
        if (result.correlations && result.correlations.length > 0) {
          if (y > 220) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${tableLabel} ${tableNum}: Correlations`, 14, y);
          y += 6;

          autoTable(doc, {
            startY: y,
            head: [["Variables", "r", "p", "N"]],
            body: result.correlations.map(c => [`${c.var1} × ${c.var2}`, c.r.toFixed(3), c.pValue.toFixed(4), String(c.n)]),
            theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
          tableNum++;
        }

        // T-tests
        if (result.tTests && result.tTests.length > 0) {
          for (const tt of result.tTests) {
            if (y > 220) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: T-test — ${tt.variable}`, 14, y);
            y += 6;

            const rows = tt.groups.map((g, i) => [g, tt.means[i].toFixed(3)]);
            rows.push(["Result", formatTTest(tt.tStat, tt.df, tt.pValue, opts)]);
            autoTable(doc, {
              startY: y, head: [["Group", "Mean"]], body: rows,
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }

        // ANOVA
        if (result.anovas && result.anovas.length > 0) {
          for (const a of result.anovas) {
            if (y > 200) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: ANOVA — ${a.dependent} × ${a.factor}`, 14, y);
            y += 6;

            const rows = a.groups.map(g => [g.name, String(g.n), g.mean.toFixed(3), g.std.toFixed(3)]);
            rows.push(["Result", "", formatAnova(a.fStat, a.dfBetween, a.dfWithin, a.pValue, opts), ""]);
            autoTable(doc, {
              startY: y, head: [["Group", "N", "Mean", "Std. Dev."]], body: rows,
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }

        // Regression
        if (result.regressions && result.regressions.length > 0) {
          for (const reg of result.regressions) {
            if (y > 200) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: Regression — ${reg.dependent}`, 14, y);
            y += 6;

            const rows = reg.coefficients.map(c => [c.variable, c.b.toFixed(4), c.se.toFixed(4), c.t.toFixed(3), formatPValue(c.p, opts)]);
            autoTable(doc, {
              startY: y, head: [["Variable", "B", "SE", "t", "p"]], body: rows,
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 4;
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text(formatRSquared(reg.rSquared, reg.adjustedR2, opts), 14, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            y += 4;
          tableNum++;
          }
        }

        // Spearman Correlations
        if (result.spearmanCorrelations && result.spearmanCorrelations.length > 0) {
          if (y > 220) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${tableLabel} ${tableNum}: Spearman Correlations`, 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [["Variables", "ρ", "p", "N"]],
            body: result.spearmanCorrelations.map(s => [`${s.var1} × ${s.var2}`, s.rho.toFixed(3), s.pValue.toFixed(4), String(s.n)]),
            theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
          tableNum++;
        }

        // Kendall Correlations
        if (result.kendallCorrelations && result.kendallCorrelations.length > 0) {
          if (y > 220) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${tableLabel} ${tableNum}: Kendall Correlations`, 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [["Variables", "τ", "p", "N"]],
            body: result.kendallCorrelations.map(k => [`${k.var1} × ${k.var2}`, k.tau.toFixed(3), k.pValue.toFixed(4), String(k.n)]),
            theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
          tableNum++;
        }

        // Mann-Whitney
        if (result.mannWhitney && result.mannWhitney.length > 0) {
          for (const mw of result.mannWhitney) {
            if (y > 220) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: Mann-Whitney — ${mw.variable}`, 14, y);
            y += 6;
            const rows: string[][] = [
              ["Groups", mw.groups.join(" vs ")],
              ["U", mw.U.toFixed(3)],
              ["z", mw.z.toFixed(3)],
              ["p-value", mw.pValue.toFixed(4)],
              ["n₁ / n₂", `${mw.n1} / ${mw.n2}`],
            ];
            autoTable(doc, {
              startY: y, head: [["Statistic", "Value"]], body: rows,
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }

        // Wilcoxon
        if (result.wilcoxon && result.wilcoxon.length > 0) {
          for (const w of result.wilcoxon) {
            if (y > 220) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: Wilcoxon — ${w.var1} × ${w.var2}`, 14, y);
            y += 6;
            autoTable(doc, {
              startY: y, head: [["Statistic", "Value"]], body: [["W", w.W.toFixed(3)], ["p-value", w.pValue.toFixed(4)]],
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }

        // Kruskal-Wallis
        if (result.kruskalWallis && result.kruskalWallis.length > 0) {
          for (const kw of result.kruskalWallis) {
            if (y > 200) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: Kruskal-Wallis — ${kw.dependent}`, 14, y);
            y += 6;
            const rows = kw.groups.map(g => [g.name, g.meanRank.toFixed(2)]);
            rows.push(["Result", `H(${kw.df}) = ${kw.H.toFixed(3)}, p = ${kw.pValue.toFixed(4)}`]);
            autoTable(doc, {
              startY: y, head: [["Group", "Mean Rank"]], body: rows,
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }

        // Shapiro-Wilk
        if (result.shapiroWilk && result.shapiroWilk.length > 0) {
          if (y > 220) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${tableLabel} ${tableNum}: Shapiro-Wilk`, 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [["Variable", "W", "p", "Normal"]],
            body: result.shapiroWilk.map(sw => [sw.variable, sw.W.toFixed(4), sw.pValue.toFixed(4), sw.isNormal ? "Yes" : "No"]),
            theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
          tableNum++;
        }

        // Cronbach's Alpha
        if (result.cronbachAlpha) {
          if (y > 220) { doc.addPage(); y = 20; }
          const ca = result.cronbachAlpha;
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${tableLabel} ${tableNum}: Cronbach's Alpha`, 14, y);
          y += 6;
          const caRows: string[][] = [["Alpha (α)", ca.alpha.toFixed(4)], ["Items", String(ca.itemCount)]];
          if (ca.variables) caRows.push(["Variables", ca.variables.join(", ")]);
          autoTable(doc, {
            startY: y, head: [["Statistic", "Value"]], body: caRows,
            theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 4;
          const reliability = ca.alpha >= 0.9 ? "Excellent" : ca.alpha >= 0.8 ? "Good" : ca.alpha >= 0.7 ? "Acceptable" : ca.alpha >= 0.6 ? "Questionable" : "Poor";
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.text(`${reliability} reliability`, 14, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          y += 4;
          tableNum++;
        }

        // Paired T-tests
        if (result.pairedTTests && result.pairedTTests.length > 0) {
          for (const pt of result.pairedTTests) {
            if (y > 220) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: Paired T-test — ${pt.var1} × ${pt.var2}`, 14, y);
            y += 6;
            autoTable(doc, {
              startY: y, head: [["Statistic", "Value"]], body: [
                ["Mean Diff", pt.meanDiff.toFixed(4)],
                ["t", pt.tStat.toFixed(3)],
                ["df", String(pt.df)],
                ["p-value", pt.pValue.toFixed(4)],
                ["N", String(pt.n)],
              ],
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }

        // PCA
        if (result.pca) {
          const pca = result.pca;
          if (y > 200) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${tableLabel} ${tableNum}: PCA — Variance Explained`, 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [["Component", "Eigenvalue", "% Variance", "Cumulative %"]],
            body: pca.components.map(c => [`PC${c.component}`, c.eigenvalue.toFixed(4), `${c.varianceExplained.toFixed(2)}%`, `${c.cumulativeVariance.toFixed(2)}%`]),
            theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 4;
          if (pca.kmo !== undefined) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text(`KMO = ${pca.kmo.toFixed(3)}`, 14, y);
            y += 5;
            doc.setFont("helvetica", "normal");
          }
          y += 4;
          tableNum++;

          // PCA Loadings
          if (pca.loadings && pca.loadings.length > 0) {
            if (y > 200) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: PCA — Component Loadings`, 14, y);
            y += 6;
            autoTable(doc, {
              startY: y,
              head: [["Variable", ...pca.components.map(c => `PC${c.component}`)]],
              body: pca.loadings.map(l => [l.variable, ...l.components.map(v => v.toFixed(3))]),
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }

        // Factor Analysis
        if (result.factorAnalysis) {
          const fa = result.factorAnalysis;
          if (y > 200) { doc.addPage(); y = 20; }
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${tableLabel} ${tableNum}: Factor Analysis — ${fa.rotation}`, 14, y);
          y += 6;
          autoTable(doc, {
            startY: y,
            head: [["Factor", "Eigenvalue", "% Variance", "Cumulative %"]],
            body: fa.factors.map(f => [`F${f.factor}`, f.eigenvalue.toFixed(4), `${f.varianceExplained.toFixed(2)}%`, `${f.cumulativeVariance.toFixed(2)}%`]),
            theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
          });
          y = (doc as any).lastAutoTable.finalY + 8;
          tableNum++;

          // Rotated Loadings
          if (fa.rotatedLoadings && fa.rotatedLoadings.length > 0) {
            if (y > 200) { doc.addPage(); y = 20; }
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${tableLabel} ${tableNum}: Rotated Loadings (${fa.rotation})`, 14, y);
            y += 6;
            autoTable(doc, {
              startY: y,
              head: [["Variable", ...fa.factors.map(f => `F${f.factor}`), "Communality"]],
              body: fa.rotatedLoadings.map((l, li) => [l.variable, ...l.factors.map(v => v.toFixed(3)), (fa.communalities[li]?.extraction ?? 0).toFixed(3)]),
              theme: "grid", headStyles: { fillColor: [37, 99, 235] }, margin: { left: 14 },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
            tableNum++;
          }
        }
      }
    }

    // Legacy test results fallback
    if ((!data.analysisResults || data.analysisResults.length === 0) && data.testResults.length > 0) {
      addH2(t.testResults);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${tableLabel} ${tableNum}: ${t.testResults}`, 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Test", t.variable]],
        body: data.testResults.map(r => [r.label, r.value]),
        theme: "grid",
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
      y += 4;
      doc.setFont("helvetica", "normal");
    }
    y += 2;
  }

  // Charts in PDF with academic formatting
  if ((content === "full" || content === "results") && data.chartImages && data.chartImages.length > 0) {
    const figLabel = getFigureLabel(data.lang);
    
    addH2(t.charts);

    for (let i = 0; i < data.chartImages.length; i++) {
      const chart = data.chartImages[i];
      const figNum = i + 1;

      if (y > 160) { doc.addPage(); y = 20; }

      // Academic figure title
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const figTitle = `${figLabel} ${figNum}: ${chart.title}`;
      const titleText = figTitle.length > 80 ? figTitle.slice(0, 77) + "…" : figTitle;
      doc.text(titleText, 14, y);
      y += 5;

      // Chart image
      try {
        const imgW = 170;
        const imgH = (chart.height / chart.width) * imgW;
        doc.addImage(chart.dataUrl, "PNG", 14, y, imgW, imgH);
        y += imgH + 4;
      } catch {
        y += 4;
      }

      y += 4;

      // Figure interpretation
      if (chart.chartType && chart.chartData) {
        const figInterp = generateFigureInterpretation(chart.chartType, chart.title, chart.chartData, data.lang);
        if (figInterp) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          const interpLines = doc.splitTextToSize(figInterp, 180);
          doc.text(interpLines, 14, y);
          y += interpLines.length * 5 + 4;
        }
      }

      doc.setFont("helvetica", "normal");
      y += 4;
    }
  }

  if (content === "full" || content === "interpretation") {
    addH2(t.interpretation);
    addBody(stripLatex(data.interpretation || t.noData));
  }

  if (content === "full" || content === "conclusion") {
    addH2(t.conclusion);
    addBody(data.conclusion || t.noData);
    addH2(t.recommendations);
    addBody(data.recommendations || t.noData);
  }

  const prefix = filePrefix(data.level);
  const contentSuffix = content === "full" ? "Analysis_Report" : content === "results" ? "Statistical_Results" : content === "interpretation" ? "Interpretation" : "Conclusion";
  doc.save(`${prefix}_${contentSuffix}.pdf`);
}

// ─── XLSX Export ───

export function exportXlsx(data: ExportData, content: ExportContent) {
  const t = l(data.lang);
  const wb = XLSX.utils.book_new();

  if (content === "full" || content === "results") {
    const infoData: (string | undefined)[][] = [
      [t.projectInfo, ""],
      [t.title, data.projectTitle],
      [t.level, levelLabel(data.level, data.lang)],
      [t.type, data.projectType],
      [t.domain, data.projectDomain],
      [t.description, data.projectDescription],
    ];
    if (data.population) infoData.push([t.population, data.population]);
    if (data.primaryVariable) infoData.push([t.primaryVariable, data.primaryVariable]);
    if (data.objective) infoData.push([], [t.studyObjectives, ""], [t.generalObjective, data.objective]);
    if (data.specificObjectives?.length) {
      infoData.push([t.specificObjectives, ""]);
      data.specificObjectives.forEach((o, i) => infoData.push([`  ${i + 1}.`, o]));
    }
    if (data.studyType || data.hypothesis || data.independentVars) {
      infoData.push([], [t.methodology, ""]);
      if (data.studyType) infoData.push([t.studyType, data.studyType]);
      if (data.studyDesign) infoData.push([t.studyDesign, data.studyDesign]);
      if (data.hypothesis) infoData.push([t.hypothesis, data.hypothesis]);
      if (data.advancedHypothesis) infoData.push([t.advancedHypothesis, data.advancedHypothesis]);
      if (data.independentVars) infoData.push([t.independentVars, data.independentVars]);
      if (data.dependentVar) infoData.push([t.dependentVar, data.dependentVar]);
      if (data.controlVars) infoData.push([t.controlVars, data.controlVars]);
      if (data.mediatorVars) infoData.push([t.mediatorVars, data.mediatorVars]);
      if (data.moderatorVars) infoData.push([t.moderatorVars, data.moderatorVars]);
      if (data.conceptualModel) infoData.push([t.conceptualModel, data.conceptualModel]);
    }
    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    infoSheet["!cols"] = [{ wch: 30 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, infoSheet, t.projectInfo.substring(0, 31));

    const statsData = [
      [t.variable, "N", t.mean, t.std, "Min", "Max"],
      ...data.statsTable.map(r => [r.variable, r.n, r.mean, r.std, r.min, r.max]),
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    statsSheet["!cols"] = [{ wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, statsSheet, t.descriptiveStats.substring(0, 31));

    const testData = [[t.testResults, ""], ...data.testResults.map(r => [r.label, r.value])];
    const testSheet = XLSX.utils.aoa_to_sheet(testData);
    testSheet["!cols"] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, testSheet, t.testResults.substring(0, 31));
  }

  if (content === "full" || content === "interpretation") {
    const intSheet = XLSX.utils.aoa_to_sheet([[t.interpretation], [stripLatex(data.interpretation || t.noData)]]);
    intSheet["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, intSheet, t.interpretation.substring(0, 31));
  }

  if (content === "full" || content === "conclusion") {
    const concSheet = XLSX.utils.aoa_to_sheet([
      [t.conclusion], [data.conclusion || t.noData],
      [], [t.recommendations], [data.recommendations || t.noData],
    ]);
    concSheet["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, concSheet, t.conclusion.substring(0, 31));
  }

  const prefix = filePrefix(data.level);
  const contentSuffix = content === "full" ? "Analysis_Report" : content === "results" ? "Statistical_Results" : content === "interpretation" ? "Interpretation" : "Conclusion";
  XLSX.writeFile(wb, `${prefix}_${contentSuffix}.xlsx`);
}
