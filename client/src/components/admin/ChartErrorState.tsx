import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  Server, 
  Database,
  BarChart3 
} from "lucide-react";

interface ChartErrorStateProps {
  error: string;
  onRetry?: () => void;
  height?: number;
  showDetails?: boolean;
  errorType?: 'network' | 'server' | 'data' | 'unknown';
  className?: string;
  "data-testid"?: string;
}

export function ChartErrorState({
  error,
  onRetry,
  height = 300,
  showDetails = false,
  errorType = 'unknown',
  className,
  "data-testid": testId
}: ChartErrorStateProps) {
  
  // Get appropriate icon based on error type
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <Wifi className="h-8 w-8 text-destructive" />;
      case 'server':
        return <Server className="h-8 w-8 text-destructive" />;
      case 'data':
        return <Database className="h-8 w-8 text-destructive" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-destructive" />;
    }
  };

  // Get error title based on error type
  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Network Connection Error';
      case 'server':
        return 'Server Error';
      case 'data':
        return 'Data Loading Error';
      default:
        return 'Chart Loading Failed';
    }
  };

  // Get error description based on error type
  const getErrorDescription = () => {
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'server':
        return 'The server encountered an error while processing your request.';
      case 'data':
        return 'There was a problem loading the chart data.';
      default:
        return 'An unexpected error occurred while loading the chart.';
    }
  };

  // Get suggested actions based on error type
  const getSuggestedActions = () => {
    switch (errorType) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ];
      case 'server':
        return [
          'Try again in a few moments',
          'The issue might be temporary',
          'Contact support if it continues'
        ];
      case 'data':
        return [
          'Try selecting a different date range',
          'Refresh the data',
          'Check if the data source is available'
        ];
      default:
        return [
          'Try refreshing the chart',
          'Check your connection',
          'Contact support if needed'
        ];
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center space-y-6 p-6 ${className}`}
      style={{ height: `${height}px` }}
      data-testid={testId}
    >
      {/* Error Icon */}
      <div className="relative">
        {getErrorIcon()}
        <BarChart3 className="h-6 w-6 text-muted-foreground absolute -bottom-1 -right-1" />
      </div>

      {/* Error Alert */}
      <Alert className="w-full max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{getErrorTitle()}</AlertTitle>
        <AlertDescription className="mt-2">
          {getErrorDescription()}
        </AlertDescription>
      </Alert>

      {/* Error Details */}
      {showDetails && (
        <div className="w-full max-w-md space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-1">Error Details:</div>
            <div className="p-2 bg-muted rounded text-xs font-mono">
              {error}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-2">Suggested Actions:</div>
            <ul className="space-y-1">
              {getSuggestedActions().map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-xs mt-1">•</span>
                  <span className="text-xs">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="flex items-center gap-2"
            data-testid={`${testId}-retry`}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          data-testid={`${testId}-refresh-page`}
        >
          Refresh Page
        </Button>
      </div>

      {/* Additional Help */}
      <div className="text-center text-xs text-muted-foreground max-w-md">
        If this problem continues, please contact support with the error details above.
      </div>
    </div>
  );
}