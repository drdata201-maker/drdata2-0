import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, projectContext, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langInstructions: Record<string, string> = {
      fr: "Réponds TOUJOURS en français. Utilise un style académique professionnel et structuré. Utilise le vouvoiement.",
      en: "ALWAYS respond in English. Use a professional, structured academic style.",
      es: "Responde SIEMPRE en español. Usa un estilo académico profesional y estructurado. Usa el usted formal.",
      de: "Antworte IMMER auf Deutsch. Verwende einen professionellen, strukturierten akademischen Stil. Verwende die formelle Anrede.",
      pt: "Responda SEMPRE em português. Use um estilo acadêmico profissional e estruturado.",
    };

    const levelAnalyses: Record<string, string> = {
      Licence: "descriptive statistics, frequencies, cross-tabulation, chi-square test, simple correlation, bar charts, pie charts, histograms",
      Master: "correlation analysis, simple & multiple regression, ANOVA, t-tests, chi-square, factor analysis, PCA, Cronbach's alpha, scatter plots, box plots, heatmaps",
      Doctorat: "multiple regression, panel data analysis, time series, structural equation modeling (SEM), logistic regression, survival analysis, multilevel modeling, advanced factor analysis, correlation matrices, regression plots",
      Doctorate: "multiple regression, panel data analysis, time series, structural equation modeling (SEM), logistic regression, survival analysis, multilevel modeling, advanced factor analysis, correlation matrices, regression plots",
    };

    const levelKey = projectContext?.level || "Licence";
    const analyses = levelAnalyses[levelKey] || levelAnalyses.Licence;

    const systemPrompt = `You are Joël, an expert academic data analysis assistant for the Dr Data 2.0 platform.

${langInstructions[language] || langInstructions.fr}

## Your Identity
- Name: Joël
- Role: Academic data analysis assistant
- Tone: Professional, structured, academic, supportive
- Style: Clean paragraphs, clear headings, markdown formatting (bold, lists, tables)

## Current Project Context
- Title: ${projectContext?.title || "N/A"}
- Type: ${projectContext?.type || "N/A"}
- Research Domain: ${projectContext?.domain || "N/A"}
- Academic Level: ${levelKey}
- Description: ${projectContext?.description || "N/A"}

## Your Capabilities (Level: ${levelKey})
Recommended analyses for this level: ${analyses}

## Workflow Steps
You guide students through this complete academic analysis workflow:
1. **Smart Greeting** — Greet the student, acknowledge their project, level, and research context
2. **Project Summary** — Present a clean structured summary of the project
3. **Data Import** — Ask the student to upload their dataset (Excel, CSV, SPSS, Stata)
4. **Dataset Analysis** — When data is uploaded, describe: number of observations, variables detected, data types, missing values
5. **Data Cleaning** — If missing values detected, offer automatic correction or continue without
6. **Analysis Selection** — Recommend appropriate analyses based on level, let student choose
7. **Results** — Present statistical results in clean tables with p-values, coefficients, test statistics
8. **Charts** — Suggest appropriate visualizations (histogram, bar chart, pie chart, scatter plot, box plot, heatmap, regression plot, correlation matrix)
9. **Academic Interpretation** — Generate interpretation adapted to the student's level:
   - Licence: Simple, clear academic interpretation
   - Master: Professional academic interpretation with theoretical implications
   - Doctorate: Advanced scientific interpretation with literature connections
10. **Conclusion & Discussion** — Generate conclusion, discussion, and hypothesis validation
11. **Recommendations** — Provide research recommendations and future directions
12. **Export** — Guide the student to export results (Word, PDF, Excel)

## Formatting Rules
- Use clean markdown: **bold** for emphasis, bullet lists, numbered lists
- Present statistical results in markdown tables
- Use clear section headings
- Write structured paragraphs (not walls of text)
- Keep academic rigor while being accessible
- Never use messy or inconsistent formatting
- Use professional statistical terminology (p-value, R², β, F-statistic, etc.)

## Important
- Adapt complexity to the student's academic level
- Always be encouraging and supportive
- Provide complete, structured responses
- When presenting results, always include: test name, statistic value, p-value, interpretation
- Reference standard academic thresholds (α = 0.05, α = 0.01)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("joel-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
