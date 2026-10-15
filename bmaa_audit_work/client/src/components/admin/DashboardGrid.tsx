import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

interface DashboardSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}

export function DashboardSection({ 
  title, 
  description, 
  children, 
  className 
}: DashboardSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

interface WideGridProps {
  children: ReactNode;
  className?: string;
}

export function WideGrid({ children, className }: WideGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {children}
    </div>
  );
}

interface FullWidthGridProps {
  children: ReactNode;
  className?: string;
}

export function FullWidthGrid({ children, className }: FullWidthGridProps) {
  return (
    <div className={cn(
      "grid gap-4 grid-cols-1",
      className
    )}>
      {children}
    </div>
  );
}