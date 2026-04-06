/**
 * Strips LaTeX formatting from text and replaces with clean Unicode symbols.
 * Ensures academic notation displays correctly without raw LaTeX syntax.
 */
export function stripLatex(text: string): string {
  if (!text) return text;
  
  let result = text;

  // Replace common LaTeX math wrappers: $...$ 
  // First handle specific known patterns inside $...$
  const latexSymbols: Record<string, string> = {
    "\\alpha": "α",
    "\\beta": "β",
    "\\gamma": "γ",
    "\\delta": "δ",
    "\\epsilon": "ε",
    "\\sigma": "σ",
    "\\mu": "μ",
    "\\lambda": "λ",
    "\\chi": "χ",
    "\\rho": "ρ",
    "\\eta": "η",
    "\\omega": "ω",
    "\\pi": "π",
    "\\tau": "τ",
    "\\phi": "φ",
    "\\psi": "ψ",
    "\\Delta": "Δ",
    "\\Sigma": "Σ",
    "\\Omega": "Ω",
    "\\leq": "≤",
    "\\geq": "≥",
    "\\neq": "≠",
    "\\approx": "≈",
    "\\times": "×",
    "\\pm": "±",
    "\\infty": "∞",
    "\\sqrt": "√",
  };

  // Replace LaTeX commands outside of $...$ too
  for (const [latex, unicode] of Object.entries(latexSymbols)) {
    result = result.replaceAll(latex, unicode);
  }

  // Handle superscripts: ^2, ^{2}, ^{n}
  result = result.replace(/\^{?\s*2\s*}?/g, "²");
  result = result.replace(/\^{?\s*3\s*}?/g, "³");
  result = result.replace(/\^{?\s*n\s*}?/g, "ⁿ");

  // Handle subscripts: _{text}
  result = result.replace(/_{([^}]+)}/g, "($1)");

  // Remove remaining $ delimiters
  result = result.replace(/\$([^$]+)\$/g, "$1");

  // Remove \text{...} wrapper
  result = result.replace(/\\text{([^}]+)}/g, "$1");

  // Remove \mathrm{...} wrapper
  result = result.replace(/\\mathrm{([^}]+)}/g, "$1");

  // Remove \mathit{...} wrapper  
  result = result.replace(/\\mathit{([^}]+)}/g, "$1");

  // Remove \textbf{...} wrapper
  result = result.replace(/\\textbf{([^}]+)}/g, "$1");

  // Remove any remaining backslash commands
  result = result.replace(/\\([a-zA-Z]+)/g, "$1");

  // Clean up double spaces
  result = result.replace(/  +/g, " ");

  return result;
}
