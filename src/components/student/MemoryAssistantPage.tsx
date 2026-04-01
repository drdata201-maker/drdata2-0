import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Lightbulb, ListChecks } from "lucide-react";

export function MemoryAssistantPage() {
  const { t } = useLanguage();

  const features = [
    { icon: BookOpen, title: t("memoryAssistant.writing"), desc: t("memoryAssistant.writingDesc") },
    { icon: Lightbulb, title: t("memoryAssistant.methodology"), desc: t("memoryAssistant.methodologyDesc") },
    { icon: ListChecks, title: t("memoryAssistant.structure"), desc: t("memoryAssistant.structureDesc") },
    { icon: FileText, title: t("memoryAssistant.bibliography"), desc: t("memoryAssistant.bibliographyDesc") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("memoryAssistant.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("memoryAssistant.desc")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((f, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex items-center justify-center p-12 text-center">
          <div>
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">{t("memoryAssistant.comingSoon")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("memoryAssistant.comingSoonDesc")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
