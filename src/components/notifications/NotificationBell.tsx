import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  analysis_complete: "bg-green-500",
  project_reminder: "bg-yellow-500",
  system_update: "bg-blue-500",
  collaboration: "bg-purple-500",
};

const typeIcons: Record<string, string> = {
  analysis_complete: "📊",
  project_reminder: "📋",
  system_update: "🔔",
  collaboration: "👥",
};

export function NotificationBell() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("notifications.justNow");
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent outline-none">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">{t("notifications.title")}</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{t("notifications.loading")}</div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{t("notifications.empty")}</div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                    !notif.is_read && "bg-accent/30"
                  )}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm", typeColors[notif.type] || "bg-muted")}>
                      {typeIcons[notif.type] || "🔔"}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm leading-tight", !notif.is_read && "font-semibold text-foreground")}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 block">{formatTime(notif.created_at)}</span>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!notif.is_read && (
                      <button onClick={() => markAsRead(notif.id)} className="p-1 rounded hover:bg-accent" title={t("notifications.markRead")}>
                        <Check className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    {notif.link && (
                      <button onClick={() => { navigate(notif.link!); setOpen(false); }} className="p-1 rounded hover:bg-accent">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(notif.id)} className="p-1 rounded hover:bg-destructive/20">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
