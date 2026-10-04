import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricsSummary {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface KPICardProps {
  title: string;
  description?: string;
  value: number | MetricsSummary;
  format?: 'number' | 'currency' | 'percentage' | 'hours';
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  loading?: boolean;
  error?: string;
  clickable?: boolean;
  onClick?: () => void;
  onRetry?: () => void;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
  suffix?: string;
  prefix?: string;
  'data-testid'?: string;
}

const formatValue = (value: number, format: KPICardProps['format'], prefix?: string, suffix?: string): string => {
  let formatted: string;
  
  switch (format) {
    case 'currency':
      formatted = `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      break;
    case 'percentage':
      formatted = `${value.toFixed(1)}%`;
      break;
    case 'hours':
      if (value < 1) {
        formatted = `${(value * 60).toFixed(0)}m`;
      } else if (value < 24) {
        formatted = `${value.toFixed(1)}h`;
      } else {
        formatted = `${(value / 24).toFixed(1)}d`;
      }
      break;
    default:
      formatted = value.toLocaleString('en-IN');
      break;
  }
  
  return `${prefix || ''}${formatted}${suffix || ''}`;
};

const TrendIndicator = ({ 
  trend, 
  value, 
  format = 'percentage',
  size = 'sm' 
}: { 
  trend: 'up' | 'down' | 'stable'; 
  value: number; 
  format?: 'percentage' | 'number';
  size?: 'sm' | 'lg';
}) => {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  const isStable = trend === 'stable';
  
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-3 w-3';
  
  if (isStable) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className={iconSize} />
        <span className="text-xs font-medium">
          {format === 'percentage' ? '0%' : '0'}
        </span>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex items-center gap-1",
      isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
    )}>
      {isPositive ? (
        <TrendingUp className={iconSize} />
      ) : (
        <TrendingDown className={iconSize} />
      )}
      <span className="text-xs font-medium">
        {format === 'percentage' ? `${Math.abs(value).toFixed(1)}%` : Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
};

const UrgencyBadge = ({ urgency }: { urgency: 'low' | 'medium' | 'high' | 'critical' }) => {
  const variants = {
    low: 'secondary',
    medium: 'outline',
    high: 'destructive',
    critical: 'destructive'
  } as const;
  
  const colors = {
    low: 'text-blue-600 dark:text-blue-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    high: 'text-orange-600 dark:text-orange-400',
    critical: 'text-red-600 dark:text-red-400'
  };
  
  return (
    <Badge variant={variants[urgency]} className={cn("text-xs", colors[urgency])}>
      {urgency === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
      {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
    </Badge>
  );
};

export function KPICard({
  title,
  description,
  value,
  format = 'number',
  icon,
  trend,
  trendValue,
  loading = false,
  error,
  clickable = false,
  onClick,
  onRetry,
  urgency,
  className,
  suffix,
  prefix,
  'data-testid': testId
}: KPICardProps) {
  const isMetricsSummary = typeof value === 'object';
  const displayValue = isMetricsSummary ? value.current : value;
  const displayTrend = isMetricsSummary ? value.trend : trend;
  const displayTrendValue = isMetricsSummary ? value.changePercent : trendValue;

  if (loading) {
    return (
      <Card className={cn("transition-all duration-200", className)} data-testid={testId}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("transition-all duration-200 border-destructive/50", className)} data-testid={testId}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-destructive">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Failed to load</span>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2"
                data-testid={`${testId}-retry`}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {urgency && <UrgencyBadge urgency={urgency} />}
          {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold" data-testid={`${testId}-value`}>
            {formatValue(displayValue, format, prefix, suffix)}
          </div>
          
          {(displayTrend && displayTrendValue !== undefined) && (
            <div className="flex items-center gap-2">
              <TrendIndicator 
                trend={displayTrend} 
                value={displayTrendValue}
                format="percentage"
              />
              <span className="text-xs text-muted-foreground">
                vs previous period
              </span>
            </div>
          )}
          
          {isMetricsSummary && (
            <div className="text-xs text-muted-foreground">
              Previous: {formatValue(value.previous, format, prefix, suffix)}
            </div>
          )}
        </div>
      </CardContent>
    </>
  );

  if (clickable && onClick) {
    return (
      <Card 
        className={cn(
          "transition-all duration-200 cursor-pointer hover-elevate active-elevate-2",
          className
        )}
        onClick={onClick}
        data-testid={testId}
      >
        {cardContent}
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-200", className)} data-testid={testId}>
      {cardContent}
    </Card>
  );
}