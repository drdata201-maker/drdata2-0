import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  FolderPlus,
  FolderOpen,
  BarChart3,
  FileText,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";

interface PmeSidebarProps {
  activeItem: string;
  onItemClick: (key: string) => void;
  onLogout: () => void;
}

const sidebarItems = [
  { key: "dashboard", icon: LayoutDashboard, label: "pme.sidebar.dashboard" },
  { key: "newAnalysis", icon: FolderPlus, label: "pme.sidebar.newAnalysis" },
  { key: "projects", icon: FolderOpen, label: "pme.sidebar.projects" },
  { key: "charts", icon: BarChart3, label: "pme.sidebar.charts" },
  { key: "reports", icon: FileText, label: "pme.sidebar.reports" },
  { key: "history", icon: Clock, label: "pme.sidebar.history" },
  { key: "settings", icon: Settings, label: "dashboard.settings" },
];

export function PmeSidebar({ activeItem, onItemClick, onLogout }: PmeSidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onItemClick(item.key)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeItem === item.key
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {t(item.label)}
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("dashboard.logout")}
        </button>
      </div>
    </aside>
  );
}
