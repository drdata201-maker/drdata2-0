import { BarChart3 } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };
  const iconSizes = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8" };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center rounded-lg bg-primary p-1.5">
        <BarChart3 className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      <span className={`font-bold tracking-tight ${sizes[size]}`}>
        Dr Data <span className="text-primary">2.0</span>
      </span>
    </div>
  );
}
