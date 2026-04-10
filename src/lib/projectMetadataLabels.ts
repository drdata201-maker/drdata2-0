type MetadataKind = "studyType" | "studyDesign" | "projectType" | "domain" | "analysis";
type TranslateFn = (key: string) => string;

const STRIP_PREFIXES: Partial<Record<MetadataKind, RegExp[]>> = {
  studyType: [/^student\.studyType\./i, /^studyType\./i],
  studyDesign: [/^student\.studyDesign\./i, /^studyDesign\./i],
  projectType: [/^student\.type\./i],
  domain: [/^domain\./i],
  analysis: [/^student\.analysis\./i],
};

const TRANSLATION_KEYS: Record<MetadataKind, (token: string) => string[]> = {
  studyType: (t) => [`student.studyType.${t}`, `studyType.${t}`],
  studyDesign: (t) => [`student.studyDesign.${t}`, `studyDesign.${t}`],
  projectType: (t) => [`student.type.${t}`],
  domain: (t) => [`domain.${t}`],
  analysis: (t) => [`student.analysis.${t}`],
};

function normalizeToken(value: string, kind: MetadataKind): string {
  const trimmed = value.trim();
  const prefixes = STRIP_PREFIXES[kind] || [];
  return prefixes.reduce((token, pattern) => token.replace(pattern, ""), trimmed);
}

/**
 * Translate a raw metadata value (possibly comma-separated) into
 * human-readable labels using the i18n function `t`.
 * Returns the original token if no translation is found.
 */
export function formatMetadataLabel(
  value: string | null | undefined,
  kind: MetadataKind,
  t: TranslateFn,
): string {
  if (!value) return "";

  return value
    .split(",")
    .map((item) => normalizeToken(item, kind))
    .filter(Boolean)
    .map((item) => {
      for (const key of TRANSLATION_KEYS[kind](item)) {
        const translated = t(key);
        if (translated && translated !== key) return translated;
      }
      return item;
    })
    .join(", ");
}

/** @deprecated Use formatMetadataLabel directly — kept for backward compat */
export const formatProjectMetadataValue = (
  value: string | null | undefined,
  kind: "studyType" | "studyDesign",
  t: TranslateFn,
) => formatMetadataLabel(value, kind, t);

/**
 * Return a copy of projectContext with studyType, studyDesign,
 * type, and domain translated to human-readable labels.
 */
export function getLocalizedProjectContext<
  T extends { studyType?: string; studyDesign?: string; type?: string; domain?: string },
>(projectContext: T | undefined, t: TranslateFn): T | undefined {
  if (!projectContext) return projectContext;

  return {
    ...projectContext,
    studyType: formatMetadataLabel(projectContext.studyType, "studyType", t),
    studyDesign: formatMetadataLabel(projectContext.studyDesign, "studyDesign", t),
    type: formatMetadataLabel(projectContext.type, "projectType", t),
    domain: formatMetadataLabel(projectContext.domain, "domain", t),
  } as T;
}
