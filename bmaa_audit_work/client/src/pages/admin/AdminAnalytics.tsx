import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  Download,
  RefreshCw,
  Settings,
  Maximize2,
  Filter,
  Calendar
} from "lucide-react";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";
import { DateRangeSelector } from "@/components/admin/DateRangeSelector";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { ChartSection } from "@/components/admin/ChartSection";
import { ChartLoadingState } from "@/components/admin/ChartLoadingState";
import { ChartErrorState } from "@/components/admin/ChartErrorState";

// Types for analytics data
interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

interface RevenueAnalytics {
  timeSeries: TimeSeriesPoint[];
  revenueByCategory: Array<{
    id: string;
    name: string;
    value: number;
    percentage?: number;
    trend?: number;
  }>;
  revenueBreakdown: {
    totalRevenue: number;
    productRevenue: number;
    shippingRevenue: number;
    taxRevenue: number;
  };
  trends: {
    dailyGrowth: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
  previousPeriod?: {
    timeSeries: TimeSeriesPoint[];
    revenueBreakdown: {
      totalRevenue: number;
      productRevenue: number;
      shippingRevenue: number;
      taxRevenue: number;
    };
    trends: {
      dailyGrowth: number;
      weeklyGrowth: number;
      monthlyGrowth: number;
    };
  };
  dateRange: {
    from: string;
    to: string;
  };
}

interface OrderAnalytics {
  timeSeries: TimeSeriesPoint[];
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  orderValueDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
  trends: {
    orderGrowth: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  previousPeriod?: {
    timeSeries: TimeSeriesPoint[];
    ordersByStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    trends: {
      orderGrowth: number;
      averageOrderValue: number;
      conversionRate: number;
    };
  };
  dateRange: {
    from: string;
    to: string;
  };
}

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "custom", label: "Custom range" }
] as const;

const CHART_TYPE_OPTIONS = [
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "area", label: "Area Chart", icon: BarChart3 },
  { value: "bar", label: "Bar Chart", icon: BarChart3 }
] as const;

function AdminAnalyticsContent() {
  const authenticatedFetch = useAuthenticatedFetch();
  
  // State management
  const [dateRange, setDateRange] = useState("30d");
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("area");
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  const [showComparison, setShowComparison] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{from: Date; to: Date} | undefined>();

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (dateRange === "custom" && customDateRange) {
      params.append("startDate", customDateRange.from.toISOString());
      params.append("endDate", customDateRange.to.toISOString());
    } else {
      params.append("period", dateRange);
    }
    
    // Map frontend granularity values to backend expected values
    const granularityMap = {
      "day": "daily",
      "week": "weekly", 
      "month": "monthly"
    } as const;
    params.append("granularity", granularityMap[granularity]);
    if (showComparison) {
      params.append("comparison", "true");
      params.append("includePreviousPeriod", "true");
    }
    
    return params.toString();
  };

  // Build stable query key for React Query
  const buildStableQueryKey = (type: 'revenue' | 'orders') => {
    const baseKey = [`/api/admin/metrics/${type}`, dateRange, granularity, showComparison];
    
    if (customDateRange) {
      // Serialize date range object to avoid unstable references
      baseKey.push(`${customDateRange.from.toISOString()}-${customDateRange.to.toISOString()}`);
    } else {
      baseKey.push('default-range');
    }
    
    return baseKey;
  };

  // Fetch revenue analytics
  const { 
    data: revenueData, 
    isLoading: revenueLoading, 
    error: revenueError, 
    refetch: refetchRevenue 
  } = useQuery({
    queryKey: buildStableQueryKey('revenue'),
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await authenticatedFetch(`/api/admin/metrics/revenue?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch revenue analytics');
      return response.json() as Promise<RevenueAnalytics>;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });

  // Fetch order analytics
  const { 
    data: orderData, 
    isLoading: orderLoading, 
    error: orderError, 
    refetch: refetchOrders 
  } = useQuery({
    queryKey: buildStableQueryKey('orders'),
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await authenticatedFetch(`/api/admin/metrics/orders?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch order analytics');
      return response.json() as Promise<OrderAnalytics>;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = revenueLoading || orderLoading;
  const hasError = revenueError || orderError;

  // Handle data refresh
  const handleRefresh = () => {
    refetchRevenue();
    refetchOrders();
  };

  // Export functionality
  const handleExport = (type: 'csv' | 'png') => {
    if (type === 'csv') {
      // Dynamic import to avoid build issues
      import('@/components/admin/ChartExportUtils').then(({ exportComprehensiveReport }) => {
        const success = exportComprehensiveReport({
          revenue: revenueData,
          orders: orderData,
        });
        
        if (success) {
          console.log('✅ CSV export completed successfully');
        } else {
          console.error('❌ CSV export failed');
        }
      }).catch(error => {
        console.error('❌ Error importing export utilities:', error);
      });
    } else {
      // Export PNG - find chart elements and export
      import('@/components/admin/ChartExportUtils').then(({ exportToPNG, getChartElement }) => {
        const chartElement = getChartElement('chart-revenue-overview') || 
                            getChartElement('chart-orders-overview') ||
                            document.querySelector('[data-testid*="chart"]') as HTMLElement;
        
        if (chartElement) {
          const success = exportToPNG(chartElement, 'analytics-chart.png');
          if (success) {
            console.log('✅ PNG export completed successfully');
          } else {
            console.error('❌ PNG export failed');
          }
        } else {
          console.error('❌ No chart element found for PNG export');
        }
      }).catch(error => {
        console.error('❌ Error importing export utilities:', error);
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-admin-analytics">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business analytics and performance insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('png')}
            data-testid="button-export-png"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Chart Controls
          </CardTitle>
          <CardDescription>
            Customize your analytics view and date ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <DateRangeSelector
              value={dateRange}
              onChange={setDateRange}
              customRange={customDateRange}
              onCustomRangeChange={setCustomDateRange}
              options={DATE_RANGE_OPTIONS}
              data-testid="date-range-selector"
            />

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Chart Type:</label>
              <Select value={chartType} onValueChange={(value) => setChartType(value as typeof chartType)}>
                <SelectTrigger className="w-32" data-testid="select-chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Granularity:</label>
              <Select value={granularity} onValueChange={(value) => setGranularity(value as typeof granularity)}>
                <SelectTrigger className="w-24" data-testid="select-granularity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={showComparison ? "default" : "outline"}
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
              data-testid="button-toggle-comparison"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Period Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
          <TabsTrigger value="comparative" data-testid="tab-comparative">Comparative</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSection
              title="Revenue Over Time"
              description="Revenue trends for the selected period"
              icon={<TrendingUp className="h-5 w-5" />}
              data-testid="chart-section-revenue-overview"
            >
              {revenueLoading ? (
                <ChartLoadingState />
              ) : revenueError ? (
                <ChartErrorState 
                  error="Failed to load revenue data" 
                  onRetry={refetchRevenue}
                />
              ) : revenueData ? (
                <TimeSeriesChart
                  data={revenueData.timeSeries}
                  type={chartType}
                  color="hsl(var(--primary))"
                  name="Revenue"
                  formatValue={(value: number) => `₹${value.toLocaleString()}`}
                  data-testid="chart-revenue-overview"
                />
              ) : null}
            </ChartSection>

            <ChartSection
              title="Orders Over Time"
              description="Order count trends for the selected period"
              icon={<BarChart3 className="h-5 w-5" />}
              data-testid="chart-section-orders-overview"
            >
              {orderLoading ? (
                <ChartLoadingState />
              ) : orderError ? (
                <ChartErrorState 
                  error="Failed to load order data" 
                  onRetry={refetchOrders}
                />
              ) : orderData ? (
                <TimeSeriesChart
                  data={orderData.timeSeries}
                  type={chartType}
                  color="hsl(var(--chart-2))"
                  name="Orders"
                  formatValue={(value: number) => value.toString()}
                  data-testid="chart-orders-overview"
                />
              ) : null}
            </ChartSection>
          </div>

          {/* Key Metrics Summary */}
          {(revenueData || orderData) && (
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>
                  Summary metrics for the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {revenueData && (
                    <>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">₹{revenueData.revenueBreakdown.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                        <Badge variant={(revenueData.trends?.monthlyGrowth || 0) >= 0 ? "default" : "destructive"} className="mt-2">
                          {(revenueData.trends?.monthlyGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(revenueData.trends?.monthlyGrowth || 0).toFixed(1)}%
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  {orderData && (
                    <>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{(orderData.timeSeries || []).reduce((sum, point) => sum + point.value, 0)}</div>
                        <div className="text-sm text-muted-foreground">Total Orders</div>
                        <Badge variant={(orderData.trends?.orderGrowth || 0) >= 0 ? "default" : "destructive"} className="mt-2">
                          {(orderData.trends?.orderGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {Math.abs(orderData.trends?.orderGrowth || 0).toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">₹{(orderData.trends?.averageOrderValue || 0).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Avg Order Value</div>
                      </div>
                      
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{(orderData.trends?.conversionRate || 0).toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ChartSection
                title="Revenue Trends"
                description="Detailed revenue analysis over time"
                icon={<TrendingUp className="h-5 w-5" />}
                fullHeight
                data-testid="chart-section-revenue-trends"
              >
                {revenueLoading ? (
                  <ChartLoadingState />
                ) : revenueError ? (
                  <ChartErrorState 
                    error="Failed to load revenue data" 
                    onRetry={refetchRevenue}
                  />
                ) : revenueData ? (
                  <TimeSeriesChart
                    data={revenueData.timeSeries}
                    type={chartType}
                    color="hsl(var(--primary))"
                    name="Revenue"
                    formatValue={(value: number) => `₹${value.toLocaleString()}`}
                    showGrid
                    showTooltip
                    data-testid="chart-revenue-trends"
                  />
                ) : null}
              </ChartSection>
            </div>

            <div className="space-y-6">
              {revenueData && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Product Revenue</span>
                        <span className="font-medium">₹{revenueData.revenueBreakdown.productRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Shipping Revenue</span>
                        <span className="font-medium">₹{revenueData.revenueBreakdown.shippingRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tax Revenue</span>
                        <span className="font-medium">₹{revenueData.revenueBreakdown.taxRevenue.toLocaleString()}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between items-center font-bold">
                        <span>Total Revenue</span>
                        <span>₹{revenueData.revenueBreakdown.totalRevenue.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Growth Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Daily Growth</span>
                        <Badge variant={(revenueData.trends?.dailyGrowth || 0) >= 0 ? "default" : "destructive"}>
                          {(revenueData.trends?.dailyGrowth || 0) >= 0 ? "+" : ""}{(revenueData.trends?.dailyGrowth || 0).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Weekly Growth</span>
                        <Badge variant={(revenueData.trends?.weeklyGrowth || 0) >= 0 ? "default" : "destructive"}>
                          {(revenueData.trends?.weeklyGrowth || 0) >= 0 ? "+" : ""}{(revenueData.trends?.weeklyGrowth || 0).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Monthly Growth</span>
                        <Badge variant={(revenueData.trends?.monthlyGrowth || 0) >= 0 ? "default" : "destructive"}>
                          {(revenueData.trends?.monthlyGrowth || 0) >= 0 ? "+" : ""}{(revenueData.trends?.monthlyGrowth || 0).toFixed(1)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ChartSection
                title="Order Trends"
                description="Order volume and patterns over time"
                icon={<BarChart3 className="h-5 w-5" />}
                fullHeight
                data-testid="chart-section-order-trends"
              >
                {orderLoading ? (
                  <ChartLoadingState />
                ) : orderError ? (
                  <ChartErrorState 
                    error="Failed to load order data" 
                    onRetry={refetchOrders}
                  />
                ) : orderData ? (
                  <TimeSeriesChart
                    data={orderData.timeSeries}
                    type={chartType}
                    color="hsl(var(--chart-2))"
                    name="Orders"
                    formatValue={(value: number) => value.toString()}
                    showGrid
                    showTooltip
                    data-testid="chart-order-trends"
                  />
                ) : null}
              </ChartSection>
            </div>

            <div className="space-y-6">
              {orderData && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {orderData.ordersByStatus.map((status) => (
                        <div key={status.status} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{status.status.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{status.count}</span>
                            <Badge variant="outline">{(status.percentage || 0).toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Value Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {orderData.orderValueDistribution.map((range) => (
                        <div key={range.range} className="flex justify-between items-center">
                          <span className="text-sm">{range.range}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{range.count}</span>
                            <Badge variant="outline">{(range.percentage || 0).toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Comparative Tab */}
        <TabsContent value="comparative" className="space-y-6">
          {showComparison ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Period Comparison */}
              <ChartSection
                title="Revenue: Current vs Previous Period"
                description="Period-over-period revenue comparison"
                icon={<TrendingUp className="h-5 w-5" />}
                data-testid="chart-section-revenue-comparison"
              >
                {revenueLoading ? (
                  <ChartLoadingState />
                ) : revenueError ? (
                  <ChartErrorState 
                    error="Failed to load revenue comparison data" 
                    onRetry={refetchRevenue}
                  />
                ) : revenueData ? (
                  <TimeSeriesChart
                    data={revenueData.timeSeries}
                    secondaryData={revenueData.previousPeriod?.timeSeries || []}
                    type={chartType}
                    color="hsl(var(--primary))"
                    secondaryColor="hsl(var(--muted-foreground))"
                    name="Current Period"
                    secondaryName="Previous Period"
                    formatValue={(value: number) => `₹${value.toLocaleString()}`}
                    formatSecondaryValue={(value: number) => `₹${value.toLocaleString()}`}
                    showGrid
                    showTooltip
                    showLegend
                    data-testid="chart-revenue-comparison"
                  />
                ) : null}
              </ChartSection>

              {/* Orders Period Comparison */}
              <ChartSection
                title="Orders: Current vs Previous Period"
                description="Period-over-period orders comparison"
                icon={<BarChart3 className="h-5 w-5" />}
                data-testid="chart-section-orders-comparison"
              >
                {orderLoading ? (
                  <ChartLoadingState />
                ) : orderError ? (
                  <ChartErrorState 
                    error="Failed to load orders comparison data" 
                    onRetry={refetchOrders}
                  />
                ) : orderData ? (
                  <TimeSeriesChart
                    data={orderData.timeSeries}
                    secondaryData={orderData.previousPeriod?.timeSeries || []}
                    type={chartType}
                    color="hsl(var(--chart-2))"
                    secondaryColor="hsl(var(--muted-foreground))"
                    name="Current Period"
                    secondaryName="Previous Period"
                    formatValue={(value: number) => value.toString()}
                    formatSecondaryValue={(value: number) => value.toString()}
                    showGrid
                    showTooltip
                    showLegend
                    data-testid="chart-orders-comparison"
                  />
                ) : null}
              </ChartSection>
            </div>
          ) : (
            <ChartSection
              title="Enable Period Comparison"
              description="Turn on the comparison toggle to see period-over-period analysis"
              icon={<TrendingUp className="h-5 w-5" />}
              data-testid="chart-section-comparison-disabled"
            >
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-lg font-medium">Period Comparison Disabled</div>
                  <div className="text-sm max-w-md">
                    Enable the "Period Comparison" toggle in the chart controls to see current vs previous period analysis.
                  </div>
                </div>
                <Button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-2"
                  data-testid="button-enable-comparison"
                >
                  <TrendingUp className="h-4 w-4" />
                  Enable Comparison
                </Button>
              </div>
            </ChartSection>
          )}
          
          {/* Period Deltas Summary */}
          {showComparison && revenueData && orderData && (
            <Card>
              <CardHeader>
                <CardTitle>Period-over-Period Summary</CardTitle>
                <CardDescription>
                  Performance comparison between current and previous periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Revenue Change */}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Revenue Change</div>
                    <div className="text-2xl font-bold">
                      {(revenueData.trends.monthlyGrowth || 0) >= 0 ? "+" : ""}{(revenueData.trends.monthlyGrowth || 0).toFixed(1)}%
                    </div>
                    <Badge variant={(revenueData.trends?.monthlyGrowth || 0) >= 0 ? "default" : "destructive"} className="mt-1">
                      {(revenueData.trends?.monthlyGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      vs Previous Period
                    </Badge>
                  </div>

                  {/* Orders Change */}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Orders Change</div>
                    <div className="text-2xl font-bold">
                      {(orderData.trends.orderGrowth || 0) >= 0 ? "+" : ""}{(orderData.trends.orderGrowth || 0).toFixed(1)}%
                    </div>
                    <Badge variant={(orderData.trends?.orderGrowth || 0) >= 0 ? "default" : "destructive"} className="mt-1">
                      {(orderData.trends?.orderGrowth || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      vs Previous Period
                    </Badge>
                  </div>

                  {/* Average Order Value Change */}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">AOV Change</div>
                    <div className="text-2xl font-bold">
                      {/* Calculate AOV change based on revenue/order trends */}
                      {((revenueData.trends?.monthlyGrowth || 0) - (orderData.trends?.orderGrowth || 0) >= 0 ? "+" : "")}
                      {((revenueData.trends?.monthlyGrowth || 0) - (orderData.trends?.orderGrowth || 0)).toFixed(1)}%
                    </div>
                    <Badge variant={((revenueData.trends?.monthlyGrowth || 0) - (orderData.trends?.orderGrowth || 0)) >= 0 ? "default" : "destructive"} className="mt-1">
                      {((revenueData.trends?.monthlyGrowth || 0) - (orderData.trends?.orderGrowth || 0)) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      AOV Trend
                    </Badge>
                  </div>

                  {/* Performance Summary */}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Overall Performance</div>
                    <div className="text-2xl font-bold">
                      {(((revenueData.trends?.monthlyGrowth || 0) + (orderData.trends?.orderGrowth || 0)) / 2) >= 0 ? "📈" : "📉"}
                    </div>
                    <Badge variant={(((revenueData.trends?.monthlyGrowth || 0) + (orderData.trends?.orderGrowth || 0)) / 2) >= 0 ? "default" : "destructive"} className="mt-1">
                      {(((revenueData.trends?.monthlyGrowth || 0) + (orderData.trends?.orderGrowth || 0)) / 2) >= 0 ? "Growing" : "Declining"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Date Range Info */}
      <div className="flex items-center justify-center text-xs text-muted-foreground pt-4 border-t">
        <Calendar className="h-3 w-3 mr-1" />
        {revenueData && `Analytics for period: ${new Date(revenueData.dateRange.from).toLocaleDateString()} - ${new Date(revenueData.dateRange.to).toLocaleDateString()}`}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminAnalyticsContent />
      </AdminLayout>
    </AdminRoute>
  );
}