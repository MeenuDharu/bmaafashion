import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  IndianRupee,
  Eye,
  UserCheck,
  UserX
} from "lucide-react";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";
import { KPICard, type MetricsSummary } from "@/components/admin/KPICard";
import { DashboardGrid, DashboardSection, WideGrid } from "@/components/admin/DashboardGrid";
import { DateRangeSelector } from "@/components/admin/DateRangeSelector";
import { TimeSeriesChart } from "@/components/admin/TimeSeriesChart";
import { ChartSection } from "@/components/admin/ChartSection";
import { ChartLoadingState } from "@/components/admin/ChartLoadingState";
import { ChartErrorState } from "@/components/admin/ChartErrorState";

// Types for WhatsApp analytics
interface WhatsAppAnalytics {
  totalMessages: MetricsSummary;
  deliveryRate: number;
  readRate: number;
  optInRate: number;
  optOutRate: number;
  responseRate: number;
  averageResponseTime: number; // in minutes
  totalOptedInUsers: number;
  activeUsers: number;
  
  messagesByType: {
    orderConfirmations: number;
    orderUpdates: number;
    paymentConfirmations: number;
    shippingNotifications: number;
    deliveryNotifications: number;
    stockAlerts: number;
    promotional: number;
    accountNotifications: number;
  };
  
  messageStatusBreakdown: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  
  costAnalysis: {
    totalCost: number;
    costPerMessage: number;
    costPerDeliveredMessage: number;
    monthlyCostTrend: Array<{
      month: string;
      cost: number;
    }>;
  };
  
  timeSeries: Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  }>;
  
  dateRange: {
    from: string;
    to: string;
  };
  lastUpdated: string;
}

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "custom", label: "Custom range" }
] as const;

function AdminWhatsappAnalyticsContent() {
  const authenticatedFetch = useAuthenticatedFetch();
  const [dateRange, setDateRange] = useState("30d");
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
    
    return params.toString();
  };

  // Fetch WhatsApp analytics
  const { 
    data: analytics, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/admin/whatsapp/analytics', dateRange, customDateRange],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await authenticatedFetch(`/api/admin/whatsapp/analytics?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch WhatsApp analytics');
      return response.json() as Promise<WhatsAppAnalytics>;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });

  // Export functionality
  const handleExport = (format: 'csv' | 'pdf') => {
    if (!analytics) return;
    
    if (format === 'csv') {
      import('@/components/admin/ChartExportUtils').then(({ exportToCSV }) => {
        const exportData = {
          revenue: analytics.timeSeries?.map(point => ({
            date: point.date,
            value: point.sent,
            label: 'WhatsApp Messages Sent'
          })),
          dateRange: analytics.dateRange
        };
        
        const success = exportToCSV(exportData, 'whatsapp-analytics-export.csv');
        
        if (success) {
          console.log('✅ WhatsApp analytics CSV export completed');
        } else {
          console.error('❌ WhatsApp analytics CSV export failed');
        }
      });
    }
  };

  const getUrgency = (rate: number, thresholds: { high: number, medium: number }): 'low' | 'medium' | 'high' | 'critical' => {
    if (rate < thresholds.high) return 'critical';
    if (rate < thresholds.medium) return 'high';
    return 'low';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-whatsapp-analytics">
            WhatsApp Analytics
          </h1>
          <p className="text-muted-foreground">
            {analytics ? (
              <>WhatsApp communication metrics and engagement insights • Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}</>
            ) : (
              'Monitor WhatsApp messaging performance and user engagement'
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={!analytics}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeSelector
            value={dateRange}
            onChange={setDateRange}
            customRange={customDateRange}
            onCustomRangeChange={setCustomDateRange}
            options={DATE_RANGE_OPTIONS}
            data-testid="date-range-selector"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
          <TabsTrigger value="costs" data-testid="tab-costs">Costs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <DashboardSection 
            title="Key Performance Indicators" 
            description="Primary WhatsApp messaging metrics"
          >
            <DashboardGrid>
              <KPICard
                title="Total Messages"
                description="All messages sent"
                value={analytics?.totalMessages || { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }}
                format="number"
                icon={<MessageCircle className="h-4 w-4" />}
                loading={isLoading}
                error={error ? 'Failed to load message data' : undefined}
                onRetry={refetch}
                data-testid="kpi-total-messages"
              />

              <KPICard
                title="Delivery Rate"
                description="Messages successfully delivered"
                value={analytics?.deliveryRate || 0}
                format="percentage"
                icon={<CheckCircle className="h-4 w-4" />}
                loading={isLoading}
                urgency={analytics ? getUrgency(analytics.deliveryRate, { high: 90, medium: 95 }) : 'low'}
                error={error ? 'Failed to load delivery rate' : undefined}
                onRetry={refetch}
                data-testid="kpi-delivery-rate"
              />

              <KPICard
                title="Read Rate"
                description="Delivered messages that were read"
                value={analytics?.readRate || 0}
                format="percentage"
                icon={<Eye className="h-4 w-4" />}
                loading={isLoading}
                urgency={analytics ? getUrgency(analytics.readRate, { high: 70, medium: 85 }) : 'low'}
                error={error ? 'Failed to load read rate' : undefined}
                onRetry={refetch}
                data-testid="kpi-read-rate"
              />

              <KPICard
                title="Opt-in Rate"
                description="Users subscribed to WhatsApp"
                value={analytics?.optInRate || 0}
                format="percentage"
                icon={<UserCheck className="h-4 w-4" />}
                loading={isLoading}
                error={error ? 'Failed to load opt-in rate' : undefined}
                onRetry={refetch}
                data-testid="kpi-opt-in-rate"
              />

              <KPICard
                title="Response Rate"
                description="Users who respond to messages"
                value={analytics?.responseRate || 0}
                format="percentage"
                icon={<Send className="h-4 w-4" />}
                loading={isLoading}
                error={error ? 'Failed to load response rate' : undefined}
                onRetry={refetch}
                data-testid="kpi-response-rate"
              />

              <KPICard
                title="Avg Response Time"
                description="Average time to respond (minutes)"
                value={analytics?.averageResponseTime || 0}
                format="number"
                icon={<TrendingUp className="h-4 w-4" />}
                loading={isLoading}
                error={error ? 'Failed to load response time' : undefined}
                onRetry={refetch}
                data-testid="kpi-response-time"
              />
            </DashboardGrid>
          </DashboardSection>

          {/* Message Status Breakdown */}
          {analytics && (
            <DashboardSection 
              title="Message Status Overview" 
              description="Real-time message delivery status"
            >
              <WideGrid>
                <Card>
                  <CardHeader>
                    <CardTitle>Message Status Distribution</CardTitle>
                    <CardDescription>Current status of all messages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.messageStatusBreakdown.sent.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.messageStatusBreakdown.delivered.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Delivered</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {analytics.messageStatusBreakdown.read.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Read</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {analytics.messageStatusBreakdown.failed.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </WideGrid>
            </DashboardSection>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <DashboardSection 
            title="User Engagement Metrics" 
            description="WhatsApp subscriber and engagement analytics"
          >
            <WideGrid>
              {analytics && (
                <Card>
                  <CardHeader>
                    <CardTitle>User Statistics</CardTitle>
                    <CardDescription>Current subscriber base and engagement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Opted-in Users</div>
                        <div className="text-sm text-muted-foreground">Total WhatsApp subscribers</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {analytics.totalOptedInUsers.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Active Users</div>
                        <div className="text-sm text-muted-foreground">Users engaged this period</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {analytics.activeUsers.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Opt-out Rate</div>
                        <div className="text-sm text-muted-foreground">Users who unsubscribed</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${analytics.optOutRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                          {analytics.optOutRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </WideGrid>
          </DashboardSection>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <DashboardSection 
            title="Message Type Breakdown" 
            description="Distribution of messages by category"
          >
            <WideGrid>
              {analytics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Message Categories</CardTitle>
                    <CardDescription>Breakdown by notification type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-primary">
                          {analytics.messagesByType.orderConfirmations.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Order Confirmations</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {analytics.messagesByType.orderUpdates.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Order Updates</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {analytics.messagesByType.shippingNotifications.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Shipping Updates</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                          {analytics.messagesByType.paymentConfirmations.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Payment Confirmations</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                          {analytics.messagesByType.deliveryNotifications.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Delivery Alerts</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-yellow-600">
                          {analytics.messagesByType.stockAlerts.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Stock Alerts</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-pink-600">
                          {analytics.messagesByType.promotional.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Promotional</div>
                      </div>
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-red-600">
                          {analytics.messagesByType.accountNotifications.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Account Alerts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </WideGrid>
          </DashboardSection>

          {/* Time Series Chart */}
          <ChartSection
            title="Message Volume Over Time"
            description="Daily message sending trends"
            icon={<MessageCircle className="h-5 w-5" />}
            data-testid="chart-section-message-trends"
          >
            {isLoading ? (
              <ChartLoadingState />
            ) : error ? (
              <ChartErrorState 
                error="Failed to load message trends" 
                onRetry={refetch}
              />
            ) : analytics ? (
              <TimeSeriesChart
                data={analytics.timeSeries.map(point => ({ 
                  date: point.date, 
                  value: point.sent 
                }))}
                type="area"
                color="hsl(var(--primary))"
                name="Messages Sent"
                formatValue={(value: number) => value.toLocaleString()}
                data-testid="chart-message-trends"
              />
            ) : null}
          </ChartSection>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <DashboardSection 
            title="Cost Analysis" 
            description="WhatsApp messaging costs and efficiency metrics"
          >
            <DashboardGrid>
              {analytics && (
                <>
                  <KPICard
                    title="Total Cost"
                    description="WhatsApp messaging costs this period"
                    value={analytics.costAnalysis.totalCost}
                    format="currency"
                    icon={<IndianRupee className="h-4 w-4" />}
                    data-testid="kpi-total-cost"
                  />

                  <KPICard
                    title="Cost per Message"
                    description="Average cost per message sent"
                    value={analytics.costAnalysis.costPerMessage}
                    format="currency"
                    icon={<MessageCircle className="h-4 w-4" />}
                    data-testid="kpi-cost-per-message"
                  />

                  <KPICard
                    title="Cost per Delivered"
                    description="Average cost per delivered message"
                    value={analytics.costAnalysis.costPerDeliveredMessage}
                    format="currency"
                    icon={<CheckCircle className="h-4 w-4" />}
                    data-testid="kpi-cost-per-delivered"
                  />
                </>
              )}
            </DashboardGrid>
          </DashboardSection>

          {analytics && analytics.costAnalysis.monthlyCostTrend.length > 0 && (
            <ChartSection
              title="Monthly Cost Trends"
              description="WhatsApp messaging costs over time"
              icon={<IndianRupee className="h-5 w-5" />}
              data-testid="chart-section-cost-trends"
            >
              <TimeSeriesChart
                data={analytics.costAnalysis.monthlyCostTrend.map(point => ({ 
                  date: point.month, 
                  value: point.cost 
                }))}
                type="line"
                color="hsl(var(--chart-2))"
                name="Monthly Cost"
                formatValue={(value: number) => `₹${value.toFixed(2)}`}
                data-testid="chart-cost-trends"
              />
            </ChartSection>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminWhatsappAnalytics() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminWhatsappAnalyticsContent />
      </AdminLayout>
    </AdminRoute>
  );
}