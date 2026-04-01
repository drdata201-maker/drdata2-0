import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  FolderPlus,
  Building2,
  Users,
  FolderOpen,
  Zap,
  BarChart3,
  FileText,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";

interface EnterpriseSidebarProps {
  onLogout: () => void;
}

const BASE = "/dashboard/enterprise";

const sidebarItems = [
  { key: "", icon: LayoutDashboard, label: "enterprise.sidebar.dashboard" },
  { key: "new-analysis", icon: FolderPlus, label: "enterprise.sidebar.newAnalysis" },
  { key: "departments", icon: Building2, label: "enterprise.sidebar.departments" },
  { key: "teams", icon: Users, label: "enterprise.sidebar.teams" },
  { key: "projects", icon: FolderOpen, label: "enterprise.sidebar.projects" },
  { key: "advanced-analytics", icon: Zap, label: "enterprise.sidebar.advancedAnalysis" },
  { key: "charts", icon: BarChart3, label: "enterprise.sidebar.charts" },
  { key: "reports", icon: FileText, label: "enterprise.sidebar.reports" },
  { key: "history", icon: Clock, label: "enterprise.sidebar.history" },
  { key: "settings", icon: Settings, label: "dashboard.settings" },
];

export function EnterpriseSidebar({ onLogout }: EnterpriseSidebarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = location.pathname.replace(BASE, "").replace(/^\//, "") || "";

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {sidebarItems.map((item) => {
          const isActive = activeKey === item.key;
          const targetPath = item.key ? `${BASE}/${item.key}` : BASE;
          return (
            <button
              key={item.key}
              onClick={() => navigate(targetPath)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.label)}
            </button>
          );
        })}
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
