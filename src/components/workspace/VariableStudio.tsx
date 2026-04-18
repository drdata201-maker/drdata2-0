// Variable Studio — Preparation V2
// Per-variable collapsible card showing diagnostics, suggestions and reversible actions.
// All labels go through i18n; nothing is auto-applied silently.

import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDataset, type VariableInfo } from "@/contexts/DatasetContext";
import { buildVarMeta, suggestGroupingMode, type Transformation } from "@/lib/varDiagnostics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown, ChevronRight, AlertTriangle, Info, ShieldOff, Sparkles, RotateCcw,
  Eye, EyeOff, Layers, Tags, BarChart3,
} from "lucide-react";

const SEV_ICON = {
  info: <Info className="h-3.5 w-3.5 text-primary" />,
  warn: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  critical: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
};

interface Props {
  variable: VariableInfo;
}

export function VariableStudio({ variable }: Props) {
  const { t } = useLanguage();
  const {
    dataset, variableTransforms, excludedVariables,
    setVariableTransform, clearVariableTransform, setVariableExcluded,
  } = useDataset();
  const [open, setOpen] = useState(false);
  const [actionMode, setActionMode] = useState<null | "group" | "score" | "recode" | "merge">(null);

  // Build diagnostics on demand
  const meta = useMemo(
    () => dataset ? buildVarMeta(variable.name, variable.type === "text" ? "categorical" : variable.type, dataset.rawData) : null,
    [dataset, variable.name, variable.type],
  );

  const isExcluded = excludedVariables.includes(variable.name);
  const currentTransform = variableTransforms[variable.name];

  if (!meta) return null;

  const subTypeLabel = t(`varDiag.sub.${meta.subType}`);

  return (
    <Card className={isExcluded ? "opacity-60 border-destructive/30" : ""}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-foreground">{variable.name}</span>
          <Badge variant="outline" className="text-xs">{subTypeLabel}</Badge>
          {meta.diagnostics.length > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              {meta.diagnostics.length} {t("varStudio.suggestions")}
            </Badge>
          )}
          {currentTransform && (
            <Badge className="text-xs bg-primary/10 text-primary border-primary/30 hover:bg-primary/10">
              {t(`varStudio.transform.${currentTransform.transformation.kind}`)}
            </Badge>
          )}
          {isExcluded && (
            <Badge variant="destructive" className="text-xs gap-1">
              <ShieldOff className="h-3 w-3" />
              {t("varStudio.excluded")}
            </Badge>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {meta.uniqueCount} {t("varStudio.unique")} · {meta.missingPct}% {t("dataPrep.missing")}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent className="border-t border-border/50">
          <div className="space-y-4 p-4">
            {/* Diagnostics */}
            {meta.diagnostics.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("varStudio.diagnostics")}
                </p>
                {meta.diagnostics.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    {SEV_ICON[d.severity]}
                    <span>{t(d.key)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Top modalities preview */}
            {meta.topModalities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  {t("varStudio.topModalities")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {meta.topModalities.slice(0, 6).map(m => (
                    <Badge key={m.value} variant="outline" className="text-xs">
                      {m.value} <span className="ml-1 text-muted-foreground">({m.pct}%)</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Numeric range preview */}
            {meta.baseType === "numeric" && meta.min !== undefined && (
              <div className="text-xs text-muted-foreground">
                {t("varStudio.range")}: <span className="text-foreground font-medium">{meta.min} → {meta.max}</span>
              </div>
            )}

            {/* Action panel */}
            <div className="flex flex-wrap gap-2">
              {currentTransform ? (
                <Button size="sm" variant="outline" onClick={() => clearVariableTransform(variable.name)} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("varStudio.action.reset")}
                </Button>
              ) : null}

              {meta.baseType === "numeric" && !currentTransform && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setActionMode("group")} className="gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {t("varStudio.action.group")}
                  </Button>
                  {meta.isLikelyScore && (
                    <Button size="sm" variant="outline" onClick={() => setActionMode("score")} className="gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      {t("varStudio.action.categorize")}
                    </Button>
                  )}
                </>
              )}
              {meta.baseType !== "numeric" && !currentTransform && meta.hasRareCategories && (
                <Button size="sm" variant="outline" onClick={() => setActionMode("merge")} className="gap-1.5">
                  <Tags className="h-3.5 w-3.5" />
                  {t("varStudio.action.mergeRare")}
                </Button>
              )}
              {!isExcluded ? (
                <Button size="sm" variant="ghost" onClick={() => setVariableExcluded(variable.name, true)} className="gap-1.5 text-destructive hover:text-destructive">
                  <EyeOff className="h-3.5 w-3.5" />
                  {t("varStudio.action.exclude")}
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setVariableExcluded(variable.name, false)} className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {t("varStudio.action.include")}
                </Button>
              )}
            </div>

            {/* Inline action panels */}
            {actionMode === "group" && (
              <GroupPanel
                variableName={variable.name}
                values={(dataset?.rawData || []).map(r => Number(r[variable.name])).filter(n => !isNaN(n))}
                min={meta.min}
                max={meta.max}
                onApply={(transformation, newName) => {
                  setVariableTransform(variable.name, transformation, newName);
                  setVariableExcluded(variable.name, true); // auto-exclude original per UX choice
                  setActionMode(null);
                }}
                onCancel={() => setActionMode(null)}
              />
            )}
            {actionMode === "score" && meta.min !== undefined && meta.max !== undefined && (
              <ScorePanel
                variableName={variable.name}
                min={meta.min}
                max={meta.max}
                onApply={(transformation, newName) => {
                  setVariableTransform(variable.name, transformation, newName);
                  setVariableExcluded(variable.name, true);
                  setActionMode(null);
                }}
                onCancel={() => setActionMode(null)}
              />
            )}
            {actionMode === "merge" && (
              <MergeRarePanel
                onApply={(transformation, newName) => {
                  setVariableTransform(variable.name, transformation, newName);
                  setVariableExcluded(variable.name, true);
                  setActionMode(null);
                }}
                onCancel={() => setActionMode(null)}
                variableName={variable.name}
              />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ---------- Sub-panels ----------

function GroupPanel({
  variableName, values, min, max, onApply, onCancel,
}: {
  variableName: string;
  values: number[];
  min?: number;
  max?: number;
  onApply: (t: Transformation, newName: string) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  // BLOCK — auto-suggest grouping mode based on distribution skewness
  const suggestion = useMemo(() => suggestGroupingMode(values), [values]);
  const [mode, setMode] = useState<"equal_width" | "quantile" | "manual">(suggestion.mode);
  const [bins, setBins] = useState(5);
  const [thresholdsText, setThresholdsText] = useState(() => {
    if (min !== undefined && max !== undefined) {
      const step = (max - min) / 3;
      return `${Number((min + step).toFixed(1))}, ${Number((min + 2 * step).toFixed(1))}`;
    }
    return "";
  });
  const newName = `${variableName}_grouped`;

  // Re-sync mode if values change (rare, but safe for live updates)
  useEffect(() => { setMode(suggestion.mode); }, [suggestion.mode]);

  const parsedThresholds = thresholdsText
    .split(/[,;\s]+/)
    .map(s => Number(s.trim()))
    .filter(n => !isNaN(n));

  const buildTransformation = (): Transformation => ({
    kind: "group_intervals",
    mode,
    bins,
    thresholds: mode === "manual" ? parsedThresholds : undefined,
  });

  const canApply = mode !== "manual" || parsedThresholds.length >= 1;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <p className="text-sm font-medium text-foreground">{t("varStudio.group.title")}</p>

      {/* Auto suggestion banner */}
      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-background/50 px-2.5 py-2 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-foreground">
            <span className="font-medium">{t("varStudio.group.suggested")}: </span>
            {t(suggestion.mode === "equal_width" ? "varStudio.group.equalWidth" : "varStudio.group.quantile")}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {t(suggestion.reasonKey)} ({t("varStudio.group.skewness")}: {suggestion.skewness})
          </p>
        </div>
        {mode !== suggestion.mode && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setMode(suggestion.mode)}>
            {t("varStudio.group.useSuggestion")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("varStudio.group.mode")}</label>
          <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="equal_width">{t("varStudio.group.equalWidth")}</SelectItem>
              <SelectItem value="quantile">{t("varStudio.group.quantile")}</SelectItem>
              <SelectItem value="manual">{t("varStudio.group.manual")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode !== "manual" ? (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("varStudio.group.bins")}</label>
            <Input type="number" min={2} max={20} value={bins} onChange={e => setBins(Math.max(2, Math.min(20, Number(e.target.value) || 5)))} className="h-8" />
          </div>
        ) : (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("varStudio.group.thresholds")}</label>
            <Input
              type="text"
              value={thresholdsText}
              onChange={e => setThresholdsText(e.target.value)}
              placeholder="e.g. 18, 35, 60"
              className="h-8"
            />
          </div>
        )}
      </div>

      {mode === "manual" && (
        <p className="text-xs text-muted-foreground">
          {t("varStudio.group.thresholdsHint")} — {parsedThresholds.length} {t("varStudio.group.cuts")} → {parsedThresholds.length + 1} {t("varStudio.group.classes")}
        </p>
      )}

      <p className="text-xs text-muted-foreground">{t("varStudio.group.preview")}: <span className="font-mono text-foreground">{newName}</span></p>
      <div className="flex gap-2">
        <Button size="sm" disabled={!canApply} onClick={() => onApply(buildTransformation(), newName)}>
          {t("varStudio.apply")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t("varStudio.cancel")}</Button>
      </div>
    </div>
  );
}

function ScorePanel({
  variableName, min, max, onApply, onCancel,
}: {
  variableName: string;
  min: number;
  max: number;
  onApply: (t: Transformation, newName: string) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const third = (max - min) / 3;
  const [t1, setT1] = useState(Number((min + third).toFixed(1)));
  const [t2, setT2] = useState(Number((min + 2 * third).toFixed(1)));
  const labels = [t("varStudio.score.low"), t("varStudio.score.medium"), t("varStudio.score.high")];
  const newName = `${variableName}_level`;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <p className="text-sm font-medium text-foreground">{t("varStudio.score.title")}</p>
      <p className="text-xs text-muted-foreground">{t("varStudio.score.desc", )} ({min} → {max})</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("varStudio.score.threshold1")}</label>
          <Input type="number" value={t1} onChange={e => setT1(Number(e.target.value))} className="h-8" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{t("varStudio.score.threshold2")}</label>
          <Input type="number" value={t2} onChange={e => setT2(Number(e.target.value))} className="h-8" />
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        ≤ {t1}: <span className="text-foreground font-medium">{labels[0]}</span> · ≤ {t2}: <span className="text-foreground font-medium">{labels[1]}</span> · {">"} {t2}: <span className="text-foreground font-medium">{labels[2]}</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApply({ kind: "categorize_score", thresholds: [t1, t2], labels }, newName)}>
          {t("varStudio.apply")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t("varStudio.cancel")}</Button>
      </div>
    </div>
  );
}

function MergeRarePanel({
  variableName, onApply, onCancel,
}: {
  variableName: string;
  onApply: (t: Transformation, newName: string) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [minPct, setMinPct] = useState(2);
  const newName = `${variableName}_merged`;
  const mergedLabel = t("varStudio.merge.otherLabel");

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <p className="text-sm font-medium text-foreground">{t("varStudio.merge.title")}</p>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{t("varStudio.merge.threshold")} (%)</label>
        <Input type="number" min={0.5} max={50} step={0.5} value={minPct} onChange={e => setMinPct(Number(e.target.value) || 2)} className="h-8 w-32" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApply({ kind: "merge_rare", minPct: minPct / 100, mergedLabel }, newName)}>
          {t("varStudio.apply")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>{t("varStudio.cancel")}</Button>
      </div>
    </div>
  );
}
