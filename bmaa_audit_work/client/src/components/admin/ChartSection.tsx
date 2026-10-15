import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Download, RefreshCw } from "lucide-react";

interface ChartSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  fullHeight?: boolean;
  onExport?: (type: 'csv' | 'png') => void;
  onRefresh?: () => void;
  onMaximize?: () => void;
  isLoading?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function ChartSection({
  title,
  description,
  icon,
  children,
  fullHeight = false,
  onExport,
  onRefresh,
  onMaximize,
  isLoading = false,
  className,
  "data-testid": testId
}: ChartSectionProps) {
  return (
    <Card className={`${fullHeight ? 'h-full' : ''} ${className}`} data-testid={testId}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-2 bg-muted rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                data-testid={`${testId}-refresh`}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}

            {onExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport('csv')}
                data-testid={`${testId}-export`}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            {onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMaximize}
                data-testid={`${testId}-maximize`}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={fullHeight ? 'flex-1 pb-6' : 'pb-6'}>
        <div className={fullHeight ? 'h-full' : ''}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}