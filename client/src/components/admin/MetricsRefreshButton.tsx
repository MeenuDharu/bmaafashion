import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MetricsRefreshButtonProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  'data-testid'?: string;
}

export function MetricsRefreshButton({ 
  className, 
  size = 'default',
  variant = 'outline',
  'data-testid': testId 
}: MetricsRefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Invalidate all admin metrics queries
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/metrics'] 
      });
      
      toast({
        title: 'Metrics Refreshed',
        description: 'Dashboard data has been updated with the latest information.',
      });
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh metrics data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn("gap-2", className)}
      data-testid={testId}
    >
      <RefreshCw className={cn(
        "transition-transform",
        size === 'icon' ? 'h-4 w-4' : 'h-3 w-3',
        isRefreshing && 'animate-spin'
      )} />
      {size !== 'icon' && (isRefreshing ? 'Refreshing...' : 'Refresh')}
    </Button>
  );
}