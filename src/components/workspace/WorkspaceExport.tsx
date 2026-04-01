import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function WorkspaceExport() {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader><CardTitle>{t("workspace.exportResults")}</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="outline">PDF</Button>
        <Button variant="outline">Word (.docx)</Button>
        <Button variant="outline">Excel (.xlsx)</Button>
      </CardContent>
    </Card>
  );
}
