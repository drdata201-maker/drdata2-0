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
      fr: "Réponds TOUJOURS en français. Utilise un style académique professionnel.",
      en: "ALWAYS respond in English. Use a professional academic style.",
      es: "Responde SIEMPRE en español. Usa un estilo académico profesional.",
      de: "Antworte IMMER auf Deutsch. Verwende einen professionellen akademischen Stil.",
      pt: "Responda SEMPRE em português. Use um estilo acadêmico profissional.",
    };

    const systemPrompt = `You are Joël, an expert academic data analysis assistant for Dr Data 2.0.
Your role is to guide students through statistical analysis of their research data.

${langInstructions[language] || langInstructions.fr}

Project context:
- Title: ${projectContext?.title || "N/A"}
- Type: ${projectContext?.type || "N/A"}
- Domain: ${projectContext?.domain || "N/A"}
- Level: ${projectContext?.level || "N/A"}

Your capabilities:
1. Help interpret uploaded datasets (detect variables, types, missing values)
2. Recommend appropriate statistical analyses based on the student's level and research question
3. Explain statistical results in academic language
4. Generate academic interpretations suitable for theses and dissertations
5. Provide research conclusions and recommendations
6. Guide through the entire analysis workflow

For Licence students: focus on descriptive statistics, frequencies, crosstabs, chi-square, basic correlations.
For Master students: include correlation, regression, ANOVA, t-tests, factor analysis, PCA, Cronbach's alpha.
For Doctorate students: include advanced regression, panel data, time series, SEM, logistic regression, survival analysis, multilevel modeling.

Always provide clear, structured, and academically rigorous responses.
Format with markdown when appropriate (bold, lists, tables).`;

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
