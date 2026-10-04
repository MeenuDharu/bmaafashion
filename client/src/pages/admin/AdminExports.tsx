import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileText, 
  Users, 
  ShoppingCart,
  Package,
  BarChart3,
  TrendingUp,
  Calendar,
  Settings,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  History,
  Filter
} from "lucide-react";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AdminRoute from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";
import { DashboardGrid, DashboardSection } from "@/components/admin/DashboardGrid";
import { ExportConfigModal } from "@/components/admin/ExportConfigModal";
import { format } from "date-fns";

// Types for export functionality
interface ExportJob {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  fileName: string;
  downloadUrl?: string;
  progress?: number;
  totalRecords?: number;
  fileSize?: number;
  adminUserId: string;
  config: any;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

interface ExportHistory {
  exports: ExportJob[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  type: string;
  fields: string[];
  filters: any;
  estimatedSize: string;
  color: string;
}

const exportOptions: ExportOption[] = [
  {
    id: "orders",
    title: "Orders Export",
    description: "Export comprehensive order data with customer details, payment info, and order items",
    icon: ShoppingCart,
    type: "orders",
    fields: ["orderId", "customerName", "customerEmail", "orderDate", "status", "total", "items", "paymentMethod"],
    filters: { dateRange: true, status: true, customer: true, payment: true },
    estimatedSize: "~50-100 MB for 10K orders",
    color: "bg-blue-500"
  },
  {
    id: "customers",
    title: "Customers Export", 
    description: "Export customer data with LTV analytics, segmentation, and purchase history",
    icon: Users,
    type: "customers",
    fields: ["customerId", "name", "email", "phone", "registrationDate", "totalOrders", "lifetimeValue", "segment"],
    filters: { segment: true, ltv: true, activity: true, registration: true },
    estimatedSize: "~10-20 MB for 10K customers",
    color: "bg-green-500"
  },
  {
    id: "inventory",
    title: "Inventory Export",
    description: "Export product inventory with stock levels, performance metrics, and reorder suggestions",
    icon: Package,
    type: "inventory", 
    fields: ["productId", "name", "sku", "category", "currentStock", "lowStockThreshold", "supplier", "costPrice", "retailPrice"],
    filters: { category: true, stockLevel: true, supplier: true, performance: true },
    estimatedSize: "~5-10 MB for 1K products",
    color: "bg-orange-500"
  },
  {
    id: "revenue",
    title: "Revenue Analytics",
    description: "Export revenue data with breakdowns by period, payment methods, and product categories",
    icon: TrendingUp,
    type: "revenue",
    fields: ["date", "totalRevenue", "ordersCount", "averageOrderValue", "paymentMethods", "categories"],
    filters: { period: true, payment: true, categories: true },
    estimatedSize: "~1-5 MB per month",
    color: "bg-purple-500"
  },
  {
    id: "analytics",
    title: "Business Analytics",
    description: "Export comprehensive business KPIs, conversion metrics, and performance indicators",
    icon: BarChart3,
    type: "analytics",
    fields: ["date", "revenue", "orders", "customers", "conversionRate", "retentionRate", "trafficSources"],
    filters: { metrics: true, period: true, aggregation: true },
    estimatedSize: "~2-10 MB per quarter",
    color: "bg-indigo-500"
  }
];

function AdminExportsContent() {
  const [selectedExport, setSelectedExport] = useState<ExportOption | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const authenticatedFetch = useAuthenticatedFetch();
  const { toast } = useToast();

  // Fetch export history
  const { 
    data: exportHistory, 
    isLoading: historyLoading, 
    refetch: refetchHistory 
  } = useQuery({
    queryKey: ['/api/admin/exports/history'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/exports/history?page=1&limit=20');
      if (!response.ok) throw new Error('Failed to fetch export history');
      return response.json() as Promise<ExportHistory>;
    },
    refetchInterval: 10000, // Refresh every 10 seconds for status updates
  });

  // Export generation mutation
  const exportMutation = useMutation({
    mutationFn: async ({ type, config }: { type: string; config: any }) => {
      const response = await authenticatedFetch(`/api/admin/exports/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Export failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export Started",
        description: `Your ${selectedExport?.title} has been queued for processing. Check the History tab for progress.`,
        duration: 5000,
      });
      setIsConfigModalOpen(false);
      setSelectedExport(null);
      refetchHistory();
    },
    onError: (error: Error) => {
      toast({
        title: "Export Failed", 
        description: error.message || "Failed to start export. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Test export mutation
  const testExportMutation = useMutation({
    mutationFn: async ({ type, sampleSize }: { type: string; sampleSize: number }) => {
      const response = await authenticatedFetch('/api/admin/exports/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, sampleSize })
      });
      if (!response.ok) throw new Error('Test export failed');
      return response.blob();
    },
    onSuccess: (blob, variables) => {
      // Create download link for test export
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-${variables.type}-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Test Export Downloaded",
        description: `Sample ${variables.type} export has been generated and downloaded.`,
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Export Failed",
        description: error.message || "Failed to generate test export.",
        variant: "destructive",
      });
    }
  });

  const handleExportStart = (exportOption: ExportOption) => {
    setSelectedExport(exportOption);
    setIsConfigModalOpen(true);
  };

  const handleExportSubmit = (config: any) => {
    if (selectedExport) {
      exportMutation.mutate({ type: selectedExport.type, config });
    }
  };

  const handleTestExport = (type: string) => {
    testExportMutation.mutate({ type, sampleSize: 10 });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary", 
      pending: "outline",
      failed: "destructive",
      cancelled: "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const recentExports = exportHistory?.exports.slice(0, 5) || [];
  const completedExports = exportHistory?.exports.filter(e => e.status === 'completed') || [];
  const processingExports = exportHistory?.exports.filter(e => ['pending', 'processing'].includes(e.status)) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-admin-exports">
            Data Exports
          </h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive business data exports for analysis and reporting
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetchHistory()}
          disabled={historyLoading}
          data-testid="button-refresh-exports"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" data-testid="tab-export-dashboard">
            <Download className="h-4 w-4 mr-2" />
            Export Dashboard
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-export-history">
            <History className="h-4 w-4 mr-2" />
            Export History ({exportHistory?.totalCount || 0})
          </TabsTrigger>
        </TabsList>

        {/* Export Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Export Status Summary */}
          <DashboardSection 
            title="Export Status Summary" 
            description="Current export activity and recent jobs"
          >
            <DashboardGrid>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Processing Exports</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-processing-exports">
                    {processingExports.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently being generated
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-completed-exports">
                    {completedExports.filter(e => 
                      new Date(e.createdAt).toDateString() === new Date().toDateString()
                    ).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exports ready for download
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-downloads">
                    {completedExports.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time export downloads
                  </p>
                </CardContent>
              </Card>
            </DashboardGrid>
          </DashboardSection>

          {/* Export Options */}
          <DashboardSection 
            title="Available Exports" 
            description="Choose the type of data you want to export"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exportOptions.map((option) => (
                <Card key={option.id} className="hover-elevate cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${option.color} bg-opacity-10`}>
                        <option.icon className={`h-6 w-6 ${option.color.replace('bg-', 'text-')}`} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestExport(option.type)}
                        disabled={testExportMutation.isPending}
                        data-testid={`button-test-${option.type}`}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <strong>Est. Size:</strong> {option.estimatedSize}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Available Fields:</div>
                      <div className="flex flex-wrap gap-1">
                        {option.fields.slice(0, 4).map((field) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                        {option.fields.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{option.fields.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => handleExportStart(option)}
                      disabled={exportMutation.isPending}
                      data-testid={`button-export-${option.type}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Configure Export
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DashboardSection>

          {/* Recent Exports */}
          {recentExports.length > 0 && (
            <DashboardSection 
              title="Recent Exports" 
              description="Your latest export jobs and their status"
            >
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {recentExports.map((exportJob, index) => (
                      <div 
                        key={exportJob.id} 
                        className={`flex items-center justify-between p-4 hover-elevate ${
                          index !== recentExports.length - 1 ? 'border-b' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(exportJob.status)}
                          <div>
                            <div className="font-medium text-sm">
                              {exportJob.fileName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {exportJob.type.charAt(0).toUpperCase() + exportJob.type.slice(1)} Export • 
                              {format(new Date(exportJob.createdAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(exportJob.status)}
                          {exportJob.status === 'completed' && exportJob.downloadUrl && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(exportJob.downloadUrl, '_blank')}
                              data-testid={`button-download-${exportJob.id}`}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </DashboardSection>
          )}
        </TabsContent>

        {/* Export History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Export History
              </CardTitle>
              <CardDescription>
                Complete history of all export jobs with download links and status information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading export history...
                </div>
              ) : exportHistory?.exports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exports found. Start by creating your first export above.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {exportHistory?.exports.map((exportJob, index) => (
                    <div 
                      key={exportJob.id}
                      className={`flex items-center justify-between p-4 hover-elevate ${
                        index !== exportHistory.exports.length - 1 ? 'border-b' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {getStatusIcon(exportJob.status)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {exportJob.fileName}
                          </div>
                          <div className="text-xs text-muted-foreground space-x-2">
                            <span>{exportJob.type.charAt(0).toUpperCase() + exportJob.type.slice(1)} Export</span>
                            <span>•</span>
                            <span>{format(new Date(exportJob.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                            {exportJob.fileSize && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(exportJob.fileSize)}</span>
                              </>
                            )}
                            {exportJob.totalRecords && (
                              <>
                                <span>•</span>
                                <span>{exportJob.totalRecords.toLocaleString()} records</span>
                              </>
                            )}
                          </div>
                          {exportJob.error && (
                            <div className="text-xs text-red-500 mt-1">
                              Error: {exportJob.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(exportJob.status)}
                        {exportJob.status === 'completed' && exportJob.downloadUrl && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(exportJob.downloadUrl, '_blank')}
                            data-testid={`button-download-${exportJob.id}`}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Configuration Modal */}
      <ExportConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedExport(null);
        }}
        exportOption={selectedExport}
        onSubmit={handleExportSubmit}
        isLoading={exportMutation.isPending}
      />
    </div>
  );
}

export default function AdminExports() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminExportsContent />
      </AdminLayout>
    </AdminRoute>
  );
}