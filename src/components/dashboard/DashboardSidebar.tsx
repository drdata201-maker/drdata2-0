import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  FolderPlus,
  FolderOpen,
  Zap,
  Clock,
  Settings,
} from "lucide-react";

interface DashboardSidebarProps {
  baseRoute: string;
  onLogout: () => void;
}

const sidebarItems = [
  { key: "", icon: LayoutDashboard, label: "dashboard.dashboard" },
  { key: "new-project", icon: FolderPlus, label: "dashboard.newProject" },
  { key: "projects", icon: FolderOpen, label: "dashboard.myProjects" },
  { key: "quick-analysis", icon: Zap, label: "dashboard.quickAnalysis" },
  { key: "history", icon: Clock, label: "dashboard.history" },
  { key: "settings", icon: Settings, label: "dashboard.settings" },
];

export function DashboardSidebar({ baseRoute }: DashboardSidebarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveKey = () => {
    const path = location.pathname;
    const sub = path.replace(baseRoute, "").replace(/^\//, "");
    return sub || "";
  };

  const activeKey = getActiveKey();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {sidebarItems.map((item) => {
          const isActive = activeKey === item.key;
          const targetPath = item.key ? `${baseRoute}/${item.key}` : baseRoute;
          return (
            <button
              key={item.key}
              onClick={() => navigate(targetPath)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {t(item.label)}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
