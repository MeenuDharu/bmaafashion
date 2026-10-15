import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp } from "lucide-react";

interface ChartLoadingStateProps {
  height?: number;
  showTitle?: boolean;
  title?: string;
  className?: string;
  "data-testid"?: string;
}

export function ChartLoadingState({
  height = 300,
  showTitle = false,
  title = "Loading chart data...",
  className,
  "data-testid": testId
}: ChartLoadingStateProps) {
  return (
    <div 
      className={`flex flex-col space-y-4 ${className}`} 
      style={{ height: `${height}px` }}
      data-testid={testId}
    >
      {/* Title Skeleton */}
      {showTitle && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* Animated Chart Icon */}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground animate-pulse" />
            </div>
            <div className="absolute top-0 right-0">
              <TrendingUp className="h-6 w-6 text-primary animate-bounce" />
            </div>
          </div>

          {/* Loading Text */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Loading analytics data...
            </div>
            <div className="text-xs text-muted-foreground">
              Preparing charts and visualizations
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-2 w-48 mx-auto">
            <Skeleton className="h-2 w-full animate-pulse" />
            <Skeleton className="h-2 w-3/4 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <Skeleton className="h-2 w-1/2 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>

      {/* Chart Skeleton Elements */}
      <div className="flex-1 space-y-3">
        {/* X-Axis Labels Skeleton */}
        <div className="flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" />
          ))}
        </div>

        {/* Chart Bars/Lines Skeleton */}
        <div className="flex items-end justify-between space-x-2 h-48">
          {Array.from({ length: 12 }).map((_, i) => {
            const height = Math.random() * 80 + 20;
            return (
              <Skeleton
                key={i}
                className="w-full animate-pulse"
                style={{ 
                  height: `${height}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            );
          })}
        </div>

        {/* Legend Skeleton */}
        <div className="flex justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}