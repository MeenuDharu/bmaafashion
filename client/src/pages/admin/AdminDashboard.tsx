import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  PackageX,
  Clock,
  UserPlus,
  ArrowUpDown,
  BarChart3,
  Target,
  Calendar,
  Timer,
  MessageCircle,
  Send,
  CheckCircle,
  UserCheck,
  Bell,
} from "lucide-react";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import { KPICard, type MetricsSummary } from "@/components/admin/KPICard";
import {
  DashboardGrid,
  DashboardSection,
  WideGrid,
  FullWidthGrid,
} from "@/components/admin/DashboardGrid";
import { MetricsRefreshButton } from "@/components/admin/MetricsRefreshButton";

// Types matching the backend AdminOverviewMetrics schema
interface AdminOverviewMetrics {
  // Revenue metrics
  grossMerchandiseValue: MetricsSummary;
  totalRevenue: MetricsSummary;
  averageOrderValue: MetricsSummary;

  // Order metrics
  totalOrders: MetricsSummary;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;

  // Customer metrics
  totalCustomers: MetricsSummary;
  newCustomers: MetricsSummary;
  returningCustomers: MetricsSummary;
  customerRetentionRate: number;

  // Product & Inventory metrics
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingCategory: string;

  // Performance indicators
  conversionRate?: number;
  refundRate: number;
  averageFulfillmentTime: number; // in hours

  // Metadata
  dateRange: {
    from: string;
    to: string;
  };
  lastUpdated: string;
}

interface StockAlert {
  id: string;
  productId: string;
  alertType: "low_stock" | "out_of_stock" | "reorder_point";
  currentStock: number;
  threshold: number;
  status: string;
  notifiedAt: string;
}

// WhatsApp Analytics Metrics
interface WhatsAppMetrics {
  totalMessages: MetricsSummary;
  deliveryRate: number;
  readRate: number;
  optInRate: number;
  optOutRate: number;
  responseRate: number;
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
  userEngagement: {
    totalOptedInUsers: number;
    activeUsers: number;
    averageResponseTime: number; // in minutes
  };
  messageStatusBreakdown: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  lastUpdated: string;
}

function AdminDashboardContent() {
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch comprehensive metrics from the overview endpoint
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["/api/admin/metrics/overview"],
    queryFn: async () => {
      const response = await authenticatedFetch(
        "/api/admin/metrics/overview?period=30d",
      );
      if (!response.ok) throw new Error("Failed to fetch admin metrics");
      return response.json() as Promise<AdminOverviewMetrics>;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });

  // Fetch stock alerts for critical inventory warnings
  const {
    data: stockAlerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ["/api/inventory/alerts"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/inventory/alerts");
      if (!response.ok) throw new Error("Failed to fetch stock alerts");
      return response.json() as Promise<StockAlert[]>;
    },
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes for alerts
  });

  // Fetch WhatsApp analytics and metrics
  const {
    data: whatsappMetrics,
    isLoading: whatsappLoading,
    error: whatsappError,
    refetch: refetchWhatsapp,
  } = useQuery({
    queryKey: ["/api/admin/whatsapp/analytics"],
    queryFn: async () => {
      const response = await authenticatedFetch(
        "/api/admin/whatsapp/analytics?period=30d",
      );
      if (!response.ok) throw new Error("Failed to fetch WhatsApp analytics");
      return response.json() as Promise<WhatsAppMetrics>;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  });

  const isLoading = metricsLoading || alertsLoading || whatsappLoading;

  // Helper function to determine urgency for stock alerts
  const getStockUrgency = (
    alertType: string,
    currentStock: number,
  ): "low" | "medium" | "high" | "critical" => {
    if (alertType === "out_of_stock" || currentStock === 0) return "critical";
    if (alertType === "reorder_point") return "high";
    if (currentStock <= 5) return "high";
    if (currentStock <= 10) return "medium";
    return "low";
  };

  const activeAlerts =
    stockAlerts?.filter((alert: StockAlert) => alert.status === "active") || [];
  const criticalAlerts = activeAlerts.filter(
    (alert: StockAlert) =>
      getStockUrgency(alert.alertType, alert.currentStock) === "critical",
  );

  // Show loading state until all statistics are loaded
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              data-testid="heading-admin-dashboard"
            >
              Admin Overview Dashboard
            </h1>
            <p className="text-muted-foreground">
              Loading dashboard metrics...
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg text-muted-foreground">
              Loading statistics and analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold"
            data-testid="heading-admin-dashboard"
          >
            Admin Overview Dashboard
          </h1>
          <p className="text-muted-foreground">
            {metrics ? (
              <>
                Real-time business metrics and KPIs • Last updated:{" "}
                {new Date(metrics.lastUpdated).toLocaleTimeString()}
              </>
            ) : (
              "Monitor your store performance and key metrics"
            )}
          </p>
        </div>
        <MetricsRefreshButton
          data-testid="button-refresh-metrics"
          className="shrink-0"
        />
      </div>

      {/* Primary Revenue & Order KPIs */}
      <DashboardSection
        title="Revenue & Orders"
        description="Core business performance indicators"
      >
        <DashboardGrid>
          <KPICard
            title="Gross Merchandise Value"
            description="Total transaction value"
            value={
              metrics?.grossMerchandiseValue || {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                trend: "stable",
              }
            }
            format="currency"
            icon={<IndianRupee className="h-4 w-4" />}
            loading={isLoading}
            error={metricsError ? "Failed to load GMV data" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-gmv"
          />

          <KPICard
            title="Total Revenue"
            description="Revenue from completed orders"
            value={
              metrics?.totalRevenue || {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                trend: "stable",
              }
            }
            format="currency"
            icon={<BarChart3 className="h-4 w-4" />}
            loading={isLoading}
            error={metricsError ? "Failed to load revenue data" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-revenue"
          />

          <KPICard
            title="Total Orders"
            description="All orders received"
            value={
              metrics?.totalOrders || {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                trend: "stable",
              }
            }
            format="number"
            icon={<ShoppingCart className="h-4 w-4" />}
            loading={isLoading}
            error={metricsError ? "Failed to load orders data" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-orders"
          />

          <KPICard
            title="Average Order Value"
            description="Revenue per order"
            value={
              metrics?.averageOrderValue || {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                trend: "stable",
              }
            }
            format="currency"
            icon={<Target className="h-4 w-4" />}
            loading={isLoading}
            error={metricsError ? "Failed to load AOV data" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-aov"
          />

          <KPICard
            title="Conversion Rate"
            description="Visitors who become customers"
            value={metrics?.conversionRate || 0}
            format="percentage"
            icon={<Target className="h-4 w-4" />}
            loading={isLoading}
            error={metricsError ? "Failed to load conversion rate" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-conversion-rate"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* Customer Analytics KPIs */}
      <DashboardSection
        title="Customer Analytics"
        description="Customer acquisition and retention metrics"
      >
        <DashboardGrid>
          <KPICard
            title="Total Customers"
            description="All registered customers"
            value={
              metrics?.totalCustomers || {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                trend: "stable",
              }
            }
            format="number"
            icon={<Users className="h-4 w-4" />}
            loading={isLoading}
            error={metricsError ? "Failed to load customer data" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-total-customers"
          />

          <KPICard
            title="New Customers"
            description="Customers acquired this period"
            value={
              metrics?.newCustomers || {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                trend: "stable",
              }
            }
            format="number"
            icon={<UserPlus className="h-4 w-4" />}
            loading={isLoading}
            error={
              metricsError ? "Failed to load new customers data" : undefined
            }
            onRetry={() => refetchMetrics()}
            data-testid="kpi-new-customers"
          />

          <KPICard
            title="Returning Customers"
            description="Customers who made repeat purchases"
            value={
              metrics?.returningCustomers || {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                trend: "stable",
              }
            }
            format="number"
            icon={<ArrowUpDown className="h-4 w-4" />}
            loading={isLoading}
            error={
              metricsError
                ? "Failed to load returning customers data"
                : undefined
            }
            onRetry={() => refetchMetrics()}
            data-testid="kpi-returning-customers"
          />

          <KPICard
            title="Customer Retention Rate"
            description="Percentage of customers retained"
            value={metrics?.customerRetentionRate || 0}
            format="percentage"
            icon={<TrendingUp className="h-4 w-4" />}
            loading={isLoading}
            error={metricsError ? "Failed to load retention data" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-retention-rate"
          />
        </DashboardGrid>
      </DashboardSection>

      {/* WhatsApp Communication Analytics */}
      {/* <DashboardSection 
        title="WhatsApp Analytics" 
        description="Communication performance and user engagement metrics"
      >
        <DashboardGrid>
          <KPICard
            title="Total Messages Sent"
            description="All WhatsApp messages sent"
            value={whatsappMetrics?.totalMessages || { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }}
            format="number"
            icon={<MessageCircle className="h-4 w-4" />}
            loading={whatsappLoading}
            error={whatsappError ? 'Failed to load message data' : undefined}
            onRetry={() => refetchWhatsapp()}
            data-testid="kpi-whatsapp-total-messages"
          />

          <KPICard
            title="Delivery Rate"
            description="Percentage of messages delivered"
            value={whatsappMetrics?.deliveryRate || 0}
            format="percentage"
            icon={<CheckCircle className="h-4 w-4" />}
            loading={whatsappLoading}
            urgency={(whatsappMetrics?.deliveryRate || 0) < 85 ? 'high' : (whatsappMetrics?.deliveryRate || 0) < 95 ? 'medium' : 'low'}
            error={whatsappError ? 'Failed to load delivery rate' : undefined}
            onRetry={() => refetchWhatsapp()}
            data-testid="kpi-whatsapp-delivery-rate"
          />

          <KPICard
            title="Read Rate"
            description="Percentage of delivered messages read"
            value={whatsappMetrics?.readRate || 0}
            format="percentage"
            icon={<Send className="h-4 w-4" />}
            loading={whatsappLoading}
            urgency={(whatsappMetrics?.readRate || 0) < 70 ? 'medium' : 'low'}
            error={whatsappError ? 'Failed to load read rate' : undefined}
            onRetry={() => refetchWhatsapp()}
            data-testid="kpi-whatsapp-read-rate"
          />

          <KPICard
            title="Opt-in Rate"
            description="Users who opted in for WhatsApp"
            value={whatsappMetrics?.optInRate || 0}
            format="percentage"
            icon={<UserCheck className="h-4 w-4" />}
            loading={whatsappLoading}
            error={whatsappError ? 'Failed to load opt-in rate' : undefined}
            onRetry={() => refetchWhatsapp()}
            data-testid="kpi-whatsapp-opt-in-rate"
          />

          <KPICard
            title="Response Rate"
            description="Users who respond to messages"
            value={whatsappMetrics?.responseRate || 0}
            format="percentage"
            icon={<Bell className="h-4 w-4" />}
            loading={whatsappLoading}
            error={whatsappError ? 'Failed to load response rate' : undefined}
            onRetry={() => refetchWhatsapp()}
            data-testid="kpi-whatsapp-response-rate"
          />
        </DashboardGrid>
      </DashboardSection> */}

      {/* WhatsApp Message Types Breakdown */}
      {/* {whatsappMetrics && (
        <DashboardSection
          title="WhatsApp Message Types"
          description="Breakdown by notification category"
        >
          <WideGrid>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  Message Categories (Last 30 Days)
                </CardTitle>
                <CardDescription>
                  Distribution of WhatsApp messages by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {whatsappMetrics?.messagesByType?.orderConfirmations?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order Confirmations
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {whatsappMetrics?.messagesByType?.orderUpdates?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order Updates
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {whatsappMetrics?.messagesByType?.shippingNotifications?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Shipping Updates
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {whatsappMetrics?.messagesByType?.paymentConfirmations?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Payment Confirmations
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {whatsappMetrics?.messagesByType?.deliveryNotifications?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Delivery Alerts
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {whatsappMetrics?.messagesByType?.stockAlerts?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Stock Alerts
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">
                      {whatsappMetrics?.messagesByType?.promotional?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Promotional
                    </div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {whatsappMetrics?.messagesByType?.accountNotifications?.toLocaleString() ||
                        "0"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Account Alerts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Engagement
                </CardTitle>
                <CardDescription>
                  WhatsApp user interaction metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Opted-in Users</div>
                    <div className="text-sm text-muted-foreground">
                      Active WhatsApp subscribers
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {whatsappMetrics?.userEngagement?.totalOptedInUsers?.toLocaleString() ||
                        "0"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Active Users</div>
                    <div className="text-sm text-muted-foreground">
                      Users who received messages this period
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {whatsappMetrics?.userEngagement?.activeUsers?.toLocaleString() ||
                        "0"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Avg Response Time</div>
                    <div className="text-sm text-muted-foreground">
                      Average time to respond to messages
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {whatsappMetrics?.userEngagement?.averageResponseTime ||
                        "0"}
                      m
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Opt-out Rate</div>
                    <div className="text-sm text-muted-foreground">
                      Users who unsubscribed
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${(whatsappMetrics?.optOutRate || 0) > 5 ? "text-red-600" : "text-green-600"}`}
                    >
                      {(whatsappMetrics?.optOutRate || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </WideGrid>
        </DashboardSection>
      )} */}

      {/* WhatsApp Message Status Overview */}
      {/* {whatsappMetrics && (
        <DashboardSection
          title="Message Delivery Status"
          description="Real-time WhatsApp message status breakdown"
        >
          <WideGrid>
            <KPICard
              title="Messages Sent"
              description="Total messages sent to WhatsApp API"
              value={whatsappMetrics?.messageStatusBreakdown?.sent || 0}
              format="number"
              icon={<Send className="h-4 w-4" />}
              data-testid="kpi-whatsapp-sent"
            />

            <KPICard
              title="Messages Delivered"
              description="Confirmed delivery to recipients"
              value={whatsappMetrics?.messageStatusBreakdown?.delivered || 0}
              format="number"
              icon={<CheckCircle className="h-4 w-4" />}
              urgency={
                (whatsappMetrics?.messageStatusBreakdown?.delivered || 0) <
                (whatsappMetrics?.messageStatusBreakdown?.sent || 0) * 0.9
                  ? "medium"
                  : "low"
              }
              data-testid="kpi-whatsapp-delivered"
            />

            <KPICard
              title="Messages Read"
              description="Messages opened by recipients"
              value={whatsappMetrics?.messageStatusBreakdown?.read || 0}
              format="number"
              icon={<Users className="h-4 w-4" />}
              data-testid="kpi-whatsapp-read"
            />

            <KPICard
              title="Failed Messages"
              description="Messages that failed to deliver"
              value={whatsappMetrics?.messageStatusBreakdown?.failed || 0}
              format="number"
              icon={<AlertTriangle className="h-4 w-4" />}
              urgency={
                (whatsappMetrics?.messageStatusBreakdown?.failed || 0) > 0
                  ? "high"
                  : "low"
              }
              data-testid="kpi-whatsapp-failed"
            />
          </WideGrid>
        </DashboardSection>
      )} */}

      {/* Operational Metrics */}
      <DashboardSection
        title="Operations & Performance"
        description="Operational efficiency and fulfillment metrics"
      >
        <WideGrid>
          <KPICard
            title="Pending Orders"
            description="Orders awaiting processing"
            value={metrics?.pendingOrders || 0}
            format="number"
            icon={<Clock className="h-4 w-4" />}
            loading={isLoading}
            urgency={
              metrics && metrics.pendingOrders > 10
                ? "high"
                : metrics && metrics.pendingOrders > 5
                  ? "medium"
                  : "low"
            }
            error={metricsError ? "Failed to load pending orders" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-pending-orders"
          />

          <KPICard
            title="Avg Fulfillment Time"
            description="Time to fulfill orders"
            value={metrics?.averageFulfillmentTime || 0}
            format="hours"
            icon={<Timer className="h-4 w-4" />}
            loading={isLoading}
            urgency={
              metrics && metrics.averageFulfillmentTime > 48
                ? "high"
                : metrics && metrics.averageFulfillmentTime > 24
                  ? "medium"
                  : "low"
            }
            error={metricsError ? "Failed to load fulfillment time" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-fulfillment-time"
          />

          <KPICard
            title="Refund Rate"
            description="Percentage of orders refunded"
            value={metrics?.refundRate || 0}
            format="percentage"
            icon={<ArrowUpDown className="h-4 w-4" />}
            loading={isLoading}
            urgency={
              metrics && metrics.refundRate > 5
                ? "high"
                : metrics && metrics.refundRate > 2
                  ? "medium"
                  : "low"
            }
            error={metricsError ? "Failed to load refund rate" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-refund-rate"
          />
        </WideGrid>
      </DashboardSection>

      {/* Critical Inventory Alerts */}
      <DashboardSection
        title="Inventory Status"
        description="Stock levels and critical alerts"
      >
        <WideGrid>
          <KPICard
            title="Low Stock Products"
            description="Products below threshold"
            value={metrics?.lowStockProducts || 0}
            format="number"
            icon={<PackageX className="h-4 w-4" />}
            loading={isLoading}
            urgency={
              metrics && metrics.lowStockProducts > 10
                ? "high"
                : metrics && metrics.lowStockProducts > 5
                  ? "medium"
                  : "low"
            }
            error={metricsError ? "Failed to load low stock data" : undefined}
            onRetry={() => refetchMetrics()}
            data-testid="kpi-low-stock"
          />

          <KPICard
            title="Out of Stock Products"
            description="Products completely out of stock"
            value={metrics?.outOfStockProducts || 0}
            format="number"
            icon={<AlertTriangle className="h-4 w-4" />}
            loading={isLoading}
            urgency={
              metrics && metrics.outOfStockProducts > 0 ? "critical" : "low"
            }
            error={
              metricsError ? "Failed to load out of stock data" : undefined
            }
            onRetry={() => refetchMetrics()}
            data-testid="kpi-out-of-stock"
          />

          <KPICard
            title="Critical Stock Alerts"
            description="Urgent inventory warnings"
            value={criticalAlerts.length}
            format="number"
            icon={<AlertTriangle className="h-4 w-4" />}
            loading={alertsLoading}
            error={alertsError ? "Failed to load stock alerts" : undefined}
            onRetry={() => refetchAlerts()}
            urgency={criticalAlerts.length > 0 ? "critical" : "low"}
            clickable={criticalAlerts.length > 0}
            onClick={() => {
              /* Navigate to inventory alerts */
            }}
            data-testid="kpi-critical-alerts"
          />
        </WideGrid>
      </DashboardSection>

      {/* Order Status Breakdown */}
      {metrics && (
        <DashboardSection
          title="Order Status Overview"
          description="Current order pipeline status"
        >
          <WideGrid>
            <KPICard
              title="Completed Orders"
              description="Successfully fulfilled orders"
              value={metrics.completedOrders}
              format="number"
              icon={<Package className="h-4 w-4" />}
              data-testid="kpi-completed-orders"
            />

            <KPICard
              title="Cancelled Orders"
              description="Orders that were cancelled"
              value={metrics.cancelledOrders}
              format="number"
              icon={<AlertTriangle className="h-4 w-4" />}
              urgency={
                metrics.cancelledOrders > metrics.completedOrders * 0.1
                  ? "medium"
                  : "low"
              }
              data-testid="kpi-cancelled-orders"
            />

            <Card data-testid="kpi-top-category">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Top Selling Category</div>
                    <div className="text-sm text-muted-foreground">
                      Best performing product category
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <div className="text-2xl font-bold text-primary">
                        {metrics.topSellingCategory || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </WideGrid>
        </DashboardSection>
      )}

      {/* Recent Stock Alerts Detail */}
      {activeAlerts.length > 0 && (
        <DashboardSection
          title="Recent Stock Alerts"
          description="Items requiring immediate attention"
        >
          <FullWidthGrid>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Active Stock Alerts ({activeAlerts.length})
                </CardTitle>
                <CardDescription>
                  Critical inventory items requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeAlerts.slice(0, 8).map((alert: StockAlert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            alert.alertType === "out_of_stock"
                              ? "bg-red-500"
                              : alert.alertType === "reorder_point"
                                ? "bg-orange-500"
                                : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium text-sm">
                            Product ID: {alert.productId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alert.alertType
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                            Alert
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Stock: {alert.currentStock} / {alert.threshold}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(alert.notifiedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeAlerts.length > 8 && (
                    <div className="text-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="button-view-all-alerts"
                      >
                        View All {activeAlerts.length} Alerts
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </FullWidthGrid>
        </DashboardSection>
      )}

      {/* Date Range Info */}
      {metrics && (
        <div className="flex items-center justify-center text-xs text-muted-foreground pt-4 border-t">
          <Calendar className="h-3 w-3 mr-1" />
          Metrics for period:{" "}
          {new Date(metrics.dateRange.from).toLocaleDateString()} -{" "}
          {new Date(metrics.dateRange.to).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
