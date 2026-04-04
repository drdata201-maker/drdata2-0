import { useLanguage } from "@/contexts/LanguageContext";
import { useChartStyle, CHART_PALETTES, type ChartStyle } from "@/contexts/ChartStyleContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette } from "lucide-react";

const styleLabels: Record<string, Record<ChartStyle, string>> = {
  fr: { rounded: "Arrondi", sharp: "Angulaire", flat: "Plat" },
  en: { rounded: "Rounded", sharp: "Sharp", flat: "Flat" },
  es: { rounded: "Redondeado", sharp: "Angular", flat: "Plano" },
  de: { rounded: "Abgerundet", sharp: "Eckig", flat: "Flach" },
  pt: { rounded: "Arredondado", sharp: "Angular", flat: "Plano" },
};

const titleLabels: Record<string, string> = {
  fr: "Style des graphiques",
  en: "Chart Style",
  es: "Estilo de gráficos",
  de: "Diagrammstil",
  pt: "Estilo dos gráficos",
};

const paletteLabel: Record<string, string> = {
  fr: "Palette de couleurs", en: "Color palette", es: "Paleta de colores", de: "Farbpalette", pt: "Paleta de cores",
};
const styleLabel: Record<string, string> = {
  fr: "Style des barres", en: "Bar style", es: "Estilo de barras", de: "Balkenstil", pt: "Estilo das barras",
};
const gridLabel: Record<string, string> = {
  fr: "Grille", en: "Grid", es: "Cuadrícula", de: "Gitter", pt: "Grade",
};
const labelsLabel: Record<string, string> = {
  fr: "Étiquettes", en: "Labels", es: "Etiquetas", de: "Beschriftungen", pt: "Rótulos",
};

export function ChartStyleSettingsPanel() {
  const { lang } = useLanguage();
  const { settings, setPalette, setStyle, setShowGrid, setShowLabels } = useChartStyle();

  const sLabels = styleLabels[lang] || styleLabels.en;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Palette className="h-4 w-4 text-primary" />
          {titleLabels[lang] || titleLabels.en}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Palette selector */}
        <div className="space-y-1.5">
          <Label className="text-xs">{paletteLabel[lang] || paletteLabel.en}</Label>
          <Select value={settings.palette.id} onValueChange={setPalette}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_PALETTES.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {p.colors.slice(0, 5).map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-sm">{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style selector */}
        <div className="space-y-1.5">
          <Label className="text-xs">{styleLabel[lang] || styleLabel.en}</Label>
          <Select value={settings.style} onValueChange={v => setStyle(v as ChartStyle)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["rounded", "sharp", "flat"] as ChartStyle[]).map(s => (
                <SelectItem key={s} value={s}>{sLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">{gridLabel[lang] || gridLabel.en}</Label>
          <Switch checked={settings.showGrid} onCheckedChange={setShowGrid} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">{labelsLabel[lang] || labelsLabel.en}</Label>
          <Switch checked={settings.showLabels} onCheckedChange={setShowLabels} />
        </div>

        {/* Preview strip */}
        <div className="flex gap-1 pt-1">
          {settings.palette.colors.map((c, i) => (
            <div key={i} className="flex-1 h-4 first:rounded-l last:rounded-r" style={{ backgroundColor: c }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
