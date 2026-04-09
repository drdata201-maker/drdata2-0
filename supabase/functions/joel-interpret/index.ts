import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { analysisResults, level, language, projectContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langMap: Record<string, string> = {
      fr: "Rédige ENTIÈREMENT en français. Style académique formel avec vouvoiement.",
      en: "Write ENTIRELY in English. Use formal academic style.",
      es: "Escribe ENTERAMENTE en español. Estilo académico formal con usted.",
      de: "Schreibe VOLLSTÄNDIG auf Deutsch. Formeller akademischer Stil mit Sie.",
      pt: "Escreva INTEIRAMENTE em português. Estilo acadêmico formal.",
    };

    const levelStyle: Record<string, string> = {
      student_license: `Licence/Bachelor level:
- Simple, clear academic language
- Explain statistical concepts briefly
- Use phrases like "The results show...", "We observe..."
- Keep paragraphs short (3-4 sentences)
- Focus on basic interpretation`,
      student_master: `Master level:
- Academic tone with moderate technical detail
- Reference methodological choices
- Use phrases like "The analysis reveals...", "The results indicate..."
- Discuss effect sizes and practical significance
- Connect findings to research hypotheses`,
      student_doctorate: `Doctorate/PhD level:
- Advanced academic writing, research-level
- Discuss methodological implications
- Reference statistical power and model fit
- Use phrases like "The findings demonstrate...", "These results corroborate..."
- Discuss limitations and theoretical implications
- Suggest directions for future research`,
    };

    const systemPrompt = `You are Joël, an expert academic data analysis assistant writing formal statistical interpretations.

${langMap[language] || langMap.fr}

## Academic Level
${levelStyle[level] || levelStyle.student_license}

## Project Context
- Title: ${projectContext?.title || "N/A"}
- Domain: ${projectContext?.domain || "N/A"}
- Type: ${projectContext?.type || "N/A"}
- Objective: ${projectContext?.objective || "N/A"}
${projectContext?.specificObjectives?.length ? `- Specific Objectives:\n${projectContext.specificObjectives.map((o: string, i: number) => `  ${i + 1}. ${o}`).join("\n")}` : ""}
${projectContext?.studyType ? `- Study Type: ${projectContext.studyType}` : ""}
${projectContext?.studyDesign ? `- Study Design: ${projectContext.studyDesign}` : ""}
${projectContext?.population ? `- Study Population: ${projectContext.population}` : ""}
${projectContext?.primaryVariable ? `- Primary Variable: ${projectContext.primaryVariable}` : ""}
${projectContext?.hypothesis ? `- Hypothesis: ${projectContext.hypothesis}` : ""}
${projectContext?.advancedHypothesis ? `- Advanced Hypothesis: ${projectContext.advancedHypothesis}` : ""}
${projectContext?.independentVars ? `- Independent Variables: ${projectContext.independentVars}` : ""}
${projectContext?.dependentVar ? `- Dependent Variable: ${projectContext.dependentVar}` : ""}
${projectContext?.controlVars ? `- Control Variables: ${projectContext.controlVars}` : ""}
${projectContext?.mediatorVars ? `- Mediator Variables: ${projectContext.mediatorVars}` : ""}
${projectContext?.moderatorVars ? `- Moderator Variables: ${projectContext.moderatorVars}` : ""}
${projectContext?.conceptualModel ? `- Conceptual Model: ${projectContext.conceptualModel}` : ""}

## CRITICAL OUTPUT FORMAT
You must return a valid JSON object with this exact structure:
{
  "sections": [
    {
      "analysisType": "name of the analysis",
      "interpretation": "2-4 paragraphs of academic interpretation of the statistical results",
      "conclusion": "1-2 paragraphs summarizing key findings",
      "recommendations": "1-2 paragraphs with academic recommendations"
    }
  ],
  "globalConclusion": "1-2 paragraphs with overall conclusion across all analyses",
  "globalRecommendations": "1-2 paragraphs with overall recommendations"
}

## Advanced Analysis Interpretation Guidelines

### PCA (Principal Component Analysis)
- Discuss KMO adequacy (>0.6 acceptable, >0.8 meritorious)
- Interpret eigenvalues and the Kaiser criterion (eigenvalue > 1)
- Explain total variance explained and whether it's sufficient (>60% generally acceptable)
- Discuss component loadings: which variables load on which components (threshold ≥ 0.5)
- Name/label components based on their loadings when possible
- Reference the scree plot pattern

### Factor Analysis
- Discuss the Varimax rotation and why it was applied
- Interpret the rotated factor loadings matrix
- Discuss communalities (high = well-represented, low = poorly explained)
- Compare with PCA results if both are present
- Identify latent constructs from factor groupings

### Cluster Analysis (K-Means)
- Interpret the number of clusters and their sizes
- Discuss cluster centroids and what characterizes each group
- Interpret the silhouette score (>0.5 = reasonable, >0.7 = strong structure)
- Discuss BSS/TSS ratio (higher = better separation)
- Profile each cluster by describing its distinguishing variables
- Suggest practical implications of the groupings

## Rules
- Base interpretation ONLY on the actual statistical values provided
- Reference specific numbers (p-values, coefficients, means, eigenvalues, loadings, silhouette scores, etc.)
- Use α = 0.05 as significance threshold unless stated otherwise
- Do NOT invent data or results not present in the input
- Write in structured paragraphs, no bullet points
- Academic style suitable for a thesis/dissertation
- RETURN ONLY THE JSON, no markdown fences

## CRITICAL: NO LATEX FORMATTING
- NEVER use LaTeX syntax like $\\alpha$, $\\chi^2$, $p$, $\\beta$, etc.
- Write symbols directly as Unicode characters: α, β, χ², p, r, R², F, t, M, SD
- Write "α = 0,05" NOT "$\\alpha = 0,05$"
- Write "χ²(4) = 2.643" NOT "$\\chi^2(4) = 2.643$"
- Write "p = 0.032" NOT "$p = 0.032$"
- Use plain text with Unicode symbols only`;

    const userContent = `Here are the statistical analysis results to interpret:\n\n${JSON.stringify(analysisResults, null, 2)}`;

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
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI interpretation error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (strip markdown fences if present)
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        sections: [{ analysisType: "General", interpretation: raw, conclusion: "", recommendations: "" }],
        globalConclusion: "",
        globalRecommendations: "",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("joel-interpret error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
