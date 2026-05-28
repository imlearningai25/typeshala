import { cn } from "@/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className, noPadding = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        "dark:border-gray-800 dark:bg-gray-900",
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
