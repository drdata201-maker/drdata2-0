import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  FolderPlus,
  FolderOpen,
  Users,
  Zap,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";

interface FreelanceSidebarProps {
  activeItem: string;
  onItemClick: (key: string) => void;
  onLogout: () => void;
}

const sidebarItems = [
  { key: "dashboard", icon: LayoutDashboard, label: "dashboard.dashboard" },
  { key: "newClientProject", icon: FolderPlus, label: "freelance.newClientProject" },
  { key: "myClientProjects", icon: FolderOpen, label: "freelance.myClientProjects" },
  { key: "clients", icon: Users, label: "freelance.clients" },
  { key: "quickAnalysis", icon: Zap, label: "dashboard.quickAnalysis" },
  { key: "history", icon: Clock, label: "dashboard.history" },
  { key: "settings", icon: Settings, label: "dashboard.settings" },
];

export function FreelanceSidebar({ activeItem, onItemClick, onLogout }: FreelanceSidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {sidebarItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onItemClick(item.key)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeItem === item.key
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {t(item.label)}
          </button>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {t("dashboard.logout")}
        </button>
      </div>
    </aside>
  );
}
