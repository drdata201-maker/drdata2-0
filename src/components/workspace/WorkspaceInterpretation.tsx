import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Target, Lightbulb } from "lucide-react";

interface WorkspaceInterpretationProps {
  level: string;
}

export function WorkspaceInterpretation({ level }: WorkspaceInterpretationProps) {
  const { t } = useLanguage();

  const getLevelKey = () => {
    if (level.includes("master")) return "master";
    if (level.includes("doctor") || level.includes("doctorat")) return "doctorate";
    return "bachelor";
  };

  const levelKey = getLevelKey();

  return (
    <div className="space-y-4">
      {/* Level indicator */}
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-foreground">{t("interpretation.levelLabel")}</span>
        <Badge variant="secondary">{t(`interpretation.level.${levelKey}`)}</Badge>
      </div>

      {/* Academic Interpretation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" />
            {t("interpretation.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            {t(`interpretation.sample.${levelKey}`)}
          </p>
        </CardContent>
      </Card>

      {/* Conclusion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            {t("interpretation.conclusionTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            {t("interpretation.conclusionSample")}
          </p>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" />
            {t("interpretation.recommendationsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            {t("interpretation.recommendationsSample")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
