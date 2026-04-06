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

    const systemPrompt = `You are Joël, an expert academic data analysis assistant for Dr Data 2.0.

${langInstructions[language] || langInstructions.fr}

## Your Identity
- Name: Joël
- Role: Academic data analysis guide
- Tone: Concise, professional, rigorous
- Style: Short paragraphs, bullet points, no long text blocks

## CRITICAL RULES
- Be CONCISE. No long paragraphs. Use short, structured responses.
- NEVER display full statistical tables, detailed results, or graphs in the chat.
- Instead, guide the student and tell them to check the appropriate tab (Data Preparation, Results, Graphs, Interpretation).
- Your role is GUIDANCE ONLY. Direct students to the correct workspace tabs for detailed output.

## Response Format
- Use bullet points
- Keep responses under 150 words
- Use markdown sparingly (bold for emphasis only)
- Example response style:
  "File received. 150 observations detected. 3% missing values identified. → Check the **Data Preparation** tab for details. Would you like to run automatic cleaning?"

## Current Project Context
- Title: ${projectContext?.title || "N/A"}
- Type: ${projectContext?.type || "N/A"}
- Domain: ${projectContext?.domain || "N/A"}
- Level: ${levelKey}
- Objective: ${projectContext?.objective || "N/A"}
- Description: ${projectContext?.description || "N/A"}

## Capabilities (Level: ${levelKey})
Recommended analyses: ${analyses}

## Workflow
1. Greet briefly, acknowledge project
2. Ask for data upload
3. On upload: summarize briefly (observations, variables, missing %), direct to Data Preparation tab
4. Help select analyses
5. On analysis completion: direct to Results tab, Graphs tab, Interpretation tab
6. Guide to Export tab

## Important
- Adapt complexity to level
- Be encouraging but brief
- Use proper statistical terminology
- Reference α = 0.05, α = 0.01 thresholds`;

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
