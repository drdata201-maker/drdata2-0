import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";

export function ClientManagementSection() {
  const { t } = useLanguage();

  const clients: Array<{
    name: string;
    email: string;
    projects: number;
    lastActivity: string;
  }> = [];

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("freelance.clientManagement")}</h2>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t("freelance.clientManagement.add")}
        </Button>
      </div>
      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{t("freelance.clientManagement.empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("freelance.clientManagement.name")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("freelance.clientManagement.email")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("freelance.clientManagement.projects")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("freelance.clientManagement.lastActivity")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.projects}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.lastActivity}</td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button size="sm" variant="ghost"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
