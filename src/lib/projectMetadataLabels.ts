type MetadataKind = "studyType" | "studyDesign";
type TranslateFn = (key: string) => string;

const METADATA_PREFIXES: Record<MetadataKind, RegExp[]> = {
  studyType: [/^student\.studyType\./i, /^studyType\./i],
  studyDesign: [/^student\.studyDesign\./i, /^studyDesign\./i],
};

function normalizeMetadataToken(value: string, kind: MetadataKind) {
  const trimmed = value.trim();
  return METADATA_PREFIXES[kind].reduce((token, pattern) => token.replace(pattern, ""), trimmed);
}

export function formatProjectMetadataValue(
  value: string | null | undefined,
  kind: MetadataKind,
  t: TranslateFn,
) {
  if (!value) return "";

  return value
    .split(",")
    .map((item) => normalizeMetadataToken(item, kind))
    .filter(Boolean)
    .map((item) => {
      const translationKeys = kind === "studyType"
        ? [`student.studyType.${item}`, `studyType.${item}`]
        : [`student.studyDesign.${item}`, `studyDesign.${item}`];

      for (const key of translationKeys) {
        const translated = t(key);
        if (translated && translated !== key) return translated;
      }

      return item;
    })
    .join(", ");
}

export function getLocalizedProjectContext<T extends { studyType?: string; studyDesign?: string }>(
  projectContext: T | undefined,
  t: TranslateFn,
): T | undefined {
  if (!projectContext) return projectContext;

  return {
    ...projectContext,
    studyType: formatProjectMetadataValue(projectContext.studyType, "studyType", t),
    studyDesign: formatProjectMetadataValue(projectContext.studyDesign, "studyDesign", t),
  } as T;
}
