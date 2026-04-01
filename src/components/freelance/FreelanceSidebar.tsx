import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import {
  LayoutDashboard,
  FolderPlus,
  FolderOpen,
  Users,
  FileText,
  Zap,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";

interface FreelanceSidebarProps {
  onLogout: () => void;
}

const BASE = "/dashboard/freelance";

const sidebarItems = [
  { key: "", icon: LayoutDashboard, label: "dashboard.dashboard" },
  { key: "new-project", icon: FolderPlus, label: "freelance.newClientProject" },
  { key: "projects", icon: FolderOpen, label: "freelance.myClientProjects" },
  { key: "clients", icon: Users, label: "freelance.clients" },
  { key: "reports", icon: FileText, label: "pme.sidebar.reports" },
  { key: "analysis", icon: Zap, label: "dashboard.quickAnalysis" },
  { key: "history", icon: Clock, label: "dashboard.history" },
  { key: "settings", icon: Settings, label: "dashboard.settings" },
];

export function FreelanceSidebar({ onLogout }: FreelanceSidebarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = location.pathname.replace(BASE, "").replace(/^\//, "") || "";

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="sm" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {sidebarItems.map((item) => {
          const isActive = activeKey === item.key;
          const targetPath = item.key ? `${BASE}/${item.key}` : BASE;
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
