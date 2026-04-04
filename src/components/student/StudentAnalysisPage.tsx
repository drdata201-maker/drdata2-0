import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, Upload, FileSpreadsheet, ArrowRight, Info } from "lucide-react";

const quickLabels: Record<string, Record<string, string>> = {
  fr: {
    title: "Analyse Rapide",
    desc: "Uploadez un fichier et lancez une analyse immédiatement, sans créer de projet.",
    uploadTitle: "Importer vos données",
    uploadDesc: "Glissez un fichier ou cliquez pour sélectionner",
    formats: "Formats acceptés : CSV, Excel (.xlsx, .xls)",
    maxSize: "Taille maximale : 10 Mo",
    start: "Lancer l'analyse",
    noFile: "Aucun fichier sélectionné",
    tip: "Astuce",
    tipText: "L'analyse rapide est idéale pour des explorations ponctuelles. Pour un suivi complet, créez un projet.",
    or: "ou",
    browseFiles: "Parcourir les fichiers",
    fileReady: "Fichier prêt",
  },
  en: {
    title: "Quick Analysis",
    desc: "Upload a file and start analyzing immediately, without creating a project.",
    uploadTitle: "Import your data",
    uploadDesc: "Drag a file or click to select",
    formats: "Accepted formats: CSV, Excel (.xlsx, .xls)",
    maxSize: "Maximum size: 10 MB",
    start: "Start Analysis",
    noFile: "No file selected",
    tip: "Tip",
    tipText: "Quick analysis is ideal for one-off explorations. For full tracking, create a project.",
    or: "or",
    browseFiles: "Browse files",
    fileReady: "File ready",
  },
  es: {
    title: "Análisis Rápido",
    desc: "Sube un archivo y comienza a analizar inmediatamente, sin crear un proyecto.",
    uploadTitle: "Importar sus datos",
    uploadDesc: "Arrastre un archivo o haga clic para seleccionar",
    formats: "Formatos aceptados: CSV, Excel (.xlsx, .xls)",
    maxSize: "Tamaño máximo: 10 MB",
    start: "Iniciar análisis",
    noFile: "Ningún archivo seleccionado",
    tip: "Consejo",
    tipText: "El análisis rápido es ideal para exploraciones puntuales. Para un seguimiento completo, cree un proyecto.",
    or: "o",
    browseFiles: "Buscar archivos",
    fileReady: "Archivo listo",
  },
  de: {
    title: "Schnellanalyse",
    desc: "Laden Sie eine Datei hoch und starten Sie sofort die Analyse, ohne ein Projekt zu erstellen.",
    uploadTitle: "Daten importieren",
    uploadDesc: "Datei ziehen oder klicken zum Auswählen",
    formats: "Akzeptierte Formate: CSV, Excel (.xlsx, .xls)",
    maxSize: "Maximale Größe: 10 MB",
    start: "Analyse starten",
    noFile: "Keine Datei ausgewählt",
    tip: "Tipp",
    tipText: "Die Schnellanalyse ist ideal für einmalige Untersuchungen. Erstellen Sie ein Projekt für vollständige Nachverfolgung.",
    or: "oder",
    browseFiles: "Dateien durchsuchen",
    fileReady: "Datei bereit",
  },
  pt: {
    title: "Análise Rápida",
    desc: "Carregue um arquivo e comece a analisar imediatamente, sem criar um projeto.",
    uploadTitle: "Importar seus dados",
    uploadDesc: "Arraste um arquivo ou clique para selecionar",
    formats: "Formatos aceitos: CSV, Excel (.xlsx, .xls)",
    maxSize: "Tamanho máximo: 10 MB",
    start: "Iniciar análise",
    noFile: "Nenhum arquivo selecionado",
    tip: "Dica",
    tipText: "A análise rápida é ideal para explorações pontuais. Para acompanhamento completo, crie um projeto.",
    or: "ou",
    browseFiles: "Procurar arquivos",
    fileReady: "Arquivo pronto",
  },
};

export function StudentAnalysisPage({ userType, baseRoute }: { userType: string; baseRoute?: string }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const l = quickLabels[lang] || quickLabels.en;

  const handleFile = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) return;
    if (f.size > 10 * 1024 * 1024) return;
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleStart = () => {
    // Store file in sessionStorage as base64 for the workspace to pick up
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("quickAnalysisFile", JSON.stringify({
        name: file.name,
        type: file.type,
        data: reader.result,
      }));
      navigate(`/analysis/workspace?level=${encodeURIComponent(userType)}&mode=quick`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          {l.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{l.desc}</p>
      </div>

      {/* Upload zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{l.uploadTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : file
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <>
                <FileSpreadsheet className="h-10 w-10 text-primary mb-3" />
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / 1024).toFixed(0)} Ko
                </p>
                <Badge variant="secondary" className="mt-2">
                  {l.fileReady}
                </Badge>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{l.uploadDesc}</p>
                <p className="text-xs text-muted-foreground mt-1">{l.or}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  {l.browseFiles}
                </Button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>{l.formats}</span>
            <span>{l.maxSize}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!file}
            onClick={handleStart}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            {l.start}
          </Button>
        </CardContent>
      </Card>

      {/* Tip */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{l.tip}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l.tipText}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
