import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { 
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  MoreHorizontal,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  IndianRupee,
  User,
  Mail,
  Phone,
  MapPin,
  History,
  Edit3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileX,
  Loader2,
  Plus,
  Minus,
  CheckSquare,
  Square,
  Copy
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import type { AdminOrdersList, AdminOrderDetail, OrderStatusHistoryItem, AdminOrdersQuery } from "@shared/schema";

// Status configuration with icons and colors
const statusConfig = {
  pending: { 
    label: "Pending", 
    icon: Clock, 
    variant: "secondary" as const,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100"
  },
  processing: { 
    label: "Processing", 
    icon: Package, 
    variant: "default" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  shipped: { 
    label: "Shipped", 
    icon: Truck, 
    variant: "default" as const,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  },
  delivered: { 
    label: "Delivered", 
    icon: CheckCircle, 
    variant: "default" as const,
    color: "text-amber-600",
    bgColor: "bg-amber-100"
  },
  cancelled: { 
    label: "Cancelled", 
    icon: XCircle, 
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-100"
  }
};

// Date range presets
const dateRangePresets = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Custom", value: "custom" }
];

interface FilterState {
  status: string;
  paymentStatus: string;
  datePreset: string;
  dateFrom?: Date;
  dateTo?: Date;
  search: string;
  customerEmail: string;
  customerName: string;
  totalMin?: number;
  totalMax?: number;
  paymentMethod: string;
  hasTracking?: boolean;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

function AdminOrdersContent() {
  // State for filtering and pagination
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    paymentStatus: 'all',
    datePreset: '30d',
    search: '',
    customerEmail: '',
    customerName: '',
    paymentMethod: 'all',
  });

  const [sort, setSort] = useState<SortState>({
    field: 'createdAt',
    direction: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // State for modals and UI
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isStatusUpdateOpen, setIsStatusUpdateOpen] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    reason: '',
    notes: '',
    trackingNumber: '',
    estimatedDelivery: ''
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState('');
  const [bulkUpdateReason, setBulkUpdateReason] = useState('');

  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // Build query parameters for API
  const queryParams = useMemo(() => {
    const params: AdminOrdersQuery = {
      page: currentPage,
      limit: pageSize,
      sortBy: sort.field as any,
      sortOrder: sort.direction,
      status: filters.status !== 'all' ? filters.status as any : undefined,
      paymentStatus: filters.paymentStatus !== 'all' ? filters.paymentStatus as any : undefined,
      search: filters.search || undefined,
      customerEmail: filters.customerEmail || undefined,
      customerName: filters.customerName || undefined,
      totalMin: filters.totalMin,
      totalMax: filters.totalMax,
      paymentMethod: filters.paymentMethod !== 'all' ? filters.paymentMethod as any : undefined,
      hasTracking: filters.hasTracking,
      includeItems: false,
      includeHistory: false
    };

    // Handle date range
    if (filters.datePreset !== 'custom') {
      const now = new Date();
      switch (filters.datePreset) {
        case 'today':
          params.dateFrom = startOfDay(now).toISOString();
          params.dateTo = endOfDay(now).toISOString();
          break;
        case 'yesterday':
          const yesterday = subDays(now, 1);
          params.dateFrom = startOfDay(yesterday).toISOString();
          params.dateTo = endOfDay(yesterday).toISOString();
          break;
        case '7d':
          params.dateFrom = subDays(now, 7).toISOString();
          params.dateTo = now.toISOString();
          break;
        case '30d':
          params.dateFrom = subDays(now, 30).toISOString();
          params.dateTo = now.toISOString();
          break;
        case '90d':
          params.dateFrom = subDays(now, 90).toISOString();
          params.dateTo = now.toISOString();
          break;
      }
    } else {
      if (filters.dateFrom) {
        params.dateFrom = startOfDay(filters.dateFrom).toISOString();
      }
      if (filters.dateTo) {
        params.dateTo = endOfDay(filters.dateTo).toISOString();
      }
    }

    return params;
  }, [filters, sort, currentPage, pageSize]);

  // Fetch orders data
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/orders', queryParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      
      const response = await authenticatedFetch(`/api/admin/orders?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json() as Promise<AdminOrdersList>;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch order details
  const fetchOrderDetail = async (orderId: string) => {
    const response = await authenticatedFetch(`/api/admin/orders/${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order details');
    return response.json() as Promise<AdminOrderDetail>;
  };

  // Fetch order history  
  const fetchOrderHistory = async (orderId: string) => {
    const response = await authenticatedFetch(`/api/admin/orders/${orderId}/history`);
    if (!response.ok) throw new Error('Failed to fetch order history');
    return response.json() as Promise<OrderStatusHistoryItem[]>;
  };

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      reason,
      notes,
      trackingNumber,
      estimatedDelivery
    }: {
      orderId: string;
      status: string;
      reason?: string;
      notes?: string;
      trackingNumber?: string;
      estimatedDelivery?: string;
    }) => {
      const body: any = { status };
      if (reason) body.reason = reason;
      if (notes) body.notes = notes;
      if (trackingNumber) body.trackingNumber = trackingNumber;
      if (estimatedDelivery) body.estimatedDelivery = estimatedDelivery;

      const response = await authenticatedFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update order status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setIsStatusUpdateOpen(false);
      setStatusUpdateForm({
        status: '',
        reason: '',
        notes: '',
        trackingNumber: '',
        estimatedDelivery: ''
      });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update order status", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({
      orderIds,
      status,
      reason
    }: {
      orderIds: string[];
      status: string;
      reason?: string;
    }) => {
      const response = await authenticatedFetch('/api/admin/orders/bulk/status', {
        method: 'PATCH',
        body: JSON.stringify({ orderIds, status, reason }),
      });
      if (!response.ok) throw new Error('Failed to perform bulk update');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setIsBulkUpdateOpen(false);
      setBulkUpdateStatus('');
      setBulkUpdateReason('');
      setSelectedOrderIds([]);
      toast({ 
        title: "Bulk update completed", 
        description: `${result.updatedCount}/${result.totalRequested} orders updated`
      });
    },
    onError: () => {
      toast({ title: "Failed to perform bulk update", variant: "destructive" });
    }
  });

  // Export orders
  const exportOrders = async () => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && key !== 'page' && key !== 'limit') {
          searchParams.append(key, String(value));
        }
      });
      
      const response = await authenticatedFetch(`/api/admin/orders/export?${searchParams}`);
      if (!response.ok) throw new Error('Failed to export orders');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Orders exported successfully" });
    } catch (error) {
      toast({ title: "Failed to export orders", variant: "destructive" });
    }
  };

  // View order details
  const viewOrderDetails = async (orderId: string) => {
    try {
      const orderDetail = await fetchOrderDetail(orderId);
      setSelectedOrder(orderDetail);
      setIsOrderDetailOpen(true);
    } catch (error) {
      toast({ title: "Failed to load order details", variant: "destructive" });
    }
  };

  // Handle status update
  const handleStatusUpdate = (order: AdminOrderDetail) => {
    setSelectedOrder(order);
    setStatusUpdateForm({
      status: order.status,
      reason: '',
      notes: '',
      trackingNumber: order.trackingNumber || '',
      estimatedDelivery: order.estimatedDelivery || ''
    });
    setIsStatusUpdateOpen(true);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      paymentStatus: 'all',
      datePreset: '30d',
      search: '',
      customerEmail: '',
      customerName: '',
      paymentMethod: 'all',
    });
    setCurrentPage(1);
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Toggle all orders selection
  const toggleAllOrders = () => {
    if (selectedOrderIds.length === ordersData?.orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(ordersData?.orders.map(order => order.id) || []);
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sort.field !== field) return ArrowUpDown;
    return sort.direction === 'asc' ? ArrowUp : ArrowDown;
  };

  if (isLoading && !ordersData) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load orders</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading the orders data.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination;
  const summary = ordersData?.summary;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" data-testid="heading-admin-orders">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and track fulfillment</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={exportOrders}
            data-testid="button-export-orders"
            className="sm:size-default"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-orders"
            className="sm:size-default"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Total Orders: ${summary.totalOrders}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-orders">
                {summary.totalOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Pending Orders: ${summary.pendingOrders}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-orders">
                {summary.pendingOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Processing Orders: ${summary.processingOrders}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-processing-orders">
                {summary.processingOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Shipped Orders: ${summary.shippedOrders}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipped</CardTitle>
              <Truck className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="stat-shipped-orders">
                {summary.shippedOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Delivered Orders: ${summary.deliveredOrders}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-delivered-orders">
                {summary.deliveredOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Cancelled Orders: ${summary.cancelledOrders}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-cancelled-orders">
                {summary.cancelledOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Total Revenue: ₹${summary.totalRevenue.toLocaleString()}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-green-600" data-testid="stat-total-revenue">
                ₹{summary.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover-elevate active-elevate-2" title={`Average Order Value: ₹${parseFloat(String(summary.averageOrderValue || 0)).toFixed(0)}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold" data-testid="stat-avg-order-value">
                ₹{parseFloat(String(summary.averageOrderValue || 0)).toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders, customers..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                  data-testid="input-search-orders"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center">
                      <config.icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Preset */}
            <Select
              value={filters.datePreset}
              onValueChange={(value) => setFilters(prev => ({ ...prev, datePreset: value }))}
            >
              <SelectTrigger className="w-[150px]" data-testid="select-date-filter">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {dateRangePresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* More Filters */}
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" data-testid="button-more-filters">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Customer Email</label>
                    <Input
                      value={filters.customerEmail}
                      onChange={(e) => setFilters(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="Search by email"
                      data-testid="input-customer-email"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Customer Name</label>
                    <Input
                      value={filters.customerName}
                      onChange={(e) => setFilters(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Search by name"
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Min Amount</label>
                      <Input
                        type="number"
                        value={filters.totalMin || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          totalMin: e.target.value ? Number(e.target.value) : undefined 
                        }))}
                        placeholder="₹0"
                        data-testid="input-min-amount"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Max Amount</label>
                      <Input
                        type="number"
                        value={filters.totalMax || ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          totalMax: e.target.value ? Number(e.target.value) : undefined 
                        }))}
                        placeholder="₹10000"
                        data-testid="input-max-amount"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Status</label>
                    <Select
                      value={filters.paymentStatus}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                    >
                      <SelectTrigger data-testid="select-payment-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payment Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                      Clear All
                    </Button>
                    <Button onClick={() => setIsFiltersOpen(false)} data-testid="button-apply-filters">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Page Size */}
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]" data-testid="select-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrderIds.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrderIds([])}
                  data-testid="button-clear-selection"
                >
                  Clear Selection
                </Button>
              </div>
              <Button
                onClick={() => setIsBulkUpdateOpen(true)}
                data-testid="button-bulk-update"
              >
                Update Status
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                      onCheckedChange={toggleAllOrders}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('id')}
                      className="h-auto p-0 font-semibold"
                      data-testid="button-sort-id"
                    >
                      Order ID
                      {React.createElement(getSortIcon('id'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('customerName')}
                      className="h-auto p-0 font-semibold"
                      data-testid="button-sort-customer"
                    >
                      Customer
                      {React.createElement(getSortIcon('customerName'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('createdAt')}
                      className="h-auto p-0 font-semibold"
                      data-testid="button-sort-date"
                    >
                      Date
                      {React.createElement(getSortIcon('createdAt'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('total')}
                      className="h-auto p-0 font-semibold"
                      data-testid="button-sort-total"
                    >
                      Total
                      {React.createElement(getSortIcon('total'), { className: "ml-2 h-4 w-4" })}
                    </Button>
                  </TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                        <p>Try adjusting your filters to see more results.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock;
                    const statusConf = statusConfig[order.status as keyof typeof statusConfig];
                    
                    return (
                      <TableRow 
                        key={order.id} 
                        className="hover:bg-muted/50"
                        data-testid={`row-order-${order.id}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedOrderIds.includes(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                            data-testid={`checkbox-order-${order.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          Order #{order.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(order.createdAt), 'HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={statusConf?.variant || "secondary"} 
                            className="flex items-center w-fit"
                            data-testid={`badge-status-${order.status}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConf?.label || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{order.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={order.paymentStatus === 'completed' ? "default" : "secondary"}
                            data-testid={`badge-payment-${order.paymentStatus}`}
                          >
                            {order.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                data-testid={`button-actions-${order.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => viewOrderDetails(order.id)}
                                data-testid={`button-view-${order.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(order)}
                                data-testid={`button-update-status-${order.id}`}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={!pagination.hasPrev}
                  data-testid="button-first-page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={!pagination.hasNext}
                  data-testid="button-last-page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for Order #{selectedOrder?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3">
                <TabsTrigger value="details" className="text-xs sm:text-sm">Order Details</TabsTrigger>
                <TabsTrigger value="items" className="text-xs sm:text-sm">Items</TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="font-medium">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <div className="flex items-center">
                          <p className="font-medium">{selectedOrder.customerEmail}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => window.location.href = `mailto:${selectedOrder.customerEmail}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {selectedOrder.customerPhone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <div className="flex items-center">
                            <p className="font-medium">{selectedOrder.customerPhone}</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => window.location.href = `tel:${selectedOrder.customerPhone}`}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {selectedOrder.customerOrderCount && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Total Orders</label>
                          <p className="font-medium">{selectedOrder.customerOrderCount}</p>
                        </div>
                      )}
                      {selectedOrder.customerTotalSpent && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Total Spent</label>
                          <p className="font-medium">₹{selectedOrder.customerTotalSpent.toLocaleString()}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Order Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Order Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                        <p className="font-mono text-sm">#{selectedOrder.id.slice(-8)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="flex items-center">
                          {React.createElement(
                            statusConfig[selectedOrder.status as keyof typeof statusConfig]?.icon || Clock,
                            { className: "h-4 w-4 mr-2" }
                          )}
                          <Badge variant={statusConfig[selectedOrder.status as keyof typeof statusConfig]?.variant || "secondary"}>
                            {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label || selectedOrder.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                        <Badge variant={selectedOrder.paymentStatus === 'completed' ? "default" : "secondary"}>
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p>{format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Updated</label>
                        <p>{format(new Date(selectedOrder.updatedAt), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                      {selectedOrder.trackingNumber && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                          <p className="font-mono text-sm">{selectedOrder.trackingNumber}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <IndianRupee className="h-5 w-5 mr-2" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                      <p className="font-medium capitalize" data-testid="text-payment-method">{selectedOrder.paymentMethod || 'Not specified'}</p>
                    </div>
                    {selectedOrder.razorpayOrderId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Razorpay Order ID</label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm bg-muted px-2 py-1 rounded" data-testid="text-razorpay-order-id">{selectedOrder.razorpayOrderId}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.razorpayOrderId || '');
                              toast({ title: "Copied to clipboard" });
                            }}
                            data-testid="button-copy-razorpay-order-id"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedOrder.razorpayPaymentId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Razorpay Payment ID</label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm bg-muted px-2 py-1 rounded text-green-600 dark:text-green-400" data-testid="text-razorpay-payment-id">{selectedOrder.razorpayPaymentId}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.razorpayPaymentId || '');
                              toast({ title: "Copied to clipboard" });
                            }}
                            data-testid="button-copy-razorpay-payment-id"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {selectedOrder.paymentStatus === 'completed' && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center" data-testid="text-payment-verified">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Payment verified and completed
                          </p>
                        )}
                      </div>
                    )}
                    {!selectedOrder.razorpayPaymentId && selectedOrder.paymentStatus === 'completed' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center" data-testid="text-payment-completed-no-id">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Payment marked as completed, but transaction ID not recorded. This may be a manual or offline payment.
                        </p>
                      </div>
                    )}
                    {!selectedOrder.razorpayPaymentId && selectedOrder.paymentStatus === 'pending' && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center" data-testid="text-payment-pending">
                          <Clock className="h-4 w-4 mr-2" />
                          Payment is pending. Transaction ID will appear once payment is completed.
                        </p>
                      </div>
                    )}
                    {selectedOrder.paymentStatus === 'failed' && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200 flex items-center" data-testid="text-payment-failed">
                          <XCircle className="h-4 w-4 mr-2" />
                          Payment failed. Customer may retry from their order history.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm">{selectedOrder.shippingAddress}</pre>
                  </CardContent>
                </Card>

                {/* Order Totals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <IndianRupee className="h-5 w-5 mr-2" />
                      Order Totals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>₹{selectedOrder.shippingCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>₹{selectedOrder.taxAmount.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>₹{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedOrder)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="h-16 w-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.productName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} × ₹{item.productPrice.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{item.totalPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found for this order.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <OrderHistory orderId={selectedOrder.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={isStatusUpdateOpen} onOpenChange={setIsStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for Order #{selectedOrder?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusUpdateForm.status}
                onValueChange={(value) => setStatusUpdateForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center">
                        <config.icon className="h-4 w-4 mr-2" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {statusUpdateForm.status === 'shipped' && (
              <div>
                <label className="text-sm font-medium">Tracking Number</label>
                <Input
                  value={statusUpdateForm.trackingNumber}
                  onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                  placeholder="Enter tracking number"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input
                value={statusUpdateForm.reason}
                onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for status change"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={statusUpdateForm.notes}
                onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusUpdateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder && statusUpdateForm.status) {
                  updateOrderStatusMutation.mutate({
                    orderId: selectedOrder.id,
                    status: statusUpdateForm.status,
                    reason: statusUpdateForm.reason,
                    notes: statusUpdateForm.notes,
                    trackingNumber: statusUpdateForm.trackingNumber,
                    estimatedDelivery: statusUpdateForm.estimatedDelivery
                  });
                }
              }}
              disabled={!statusUpdateForm.status || updateOrderStatusMutation.isPending}
            >
              {updateOrderStatusMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Modal */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Order Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedOrderIds.length} selected orders
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select
                value={bulkUpdateStatus}
                onValueChange={setBulkUpdateStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center">
                        <config.icon className="h-4 w-4 mr-2" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input
                value={bulkUpdateReason}
                onChange={(e) => setBulkUpdateReason(e.target.value)}
                placeholder="Reason for bulk status change"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkUpdateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (bulkUpdateStatus) {
                  bulkUpdateMutation.mutate({
                    orderIds: selectedOrderIds,
                    status: bulkUpdateStatus,
                    reason: bulkUpdateReason
                  });
                }
              }}
              disabled={!bulkUpdateStatus || bulkUpdateMutation.isPending}
            >
              {bulkUpdateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update {selectedOrderIds.length} Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Order History Component
function OrderHistory({ orderId }: { orderId: string }) {
  const authenticatedFetch = useAuthenticatedFetch();
  
  const { data: history, isLoading } = useQuery({
    queryKey: ['/api/admin/orders', orderId, 'history'],
    queryFn: async () => {
      const response = await authenticatedFetch(`/api/admin/orders/${orderId}/history`);
      if (!response.ok) throw new Error('Failed to fetch order history');
      return response.json() as Promise<OrderStatusHistoryItem[]>;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No status history available for this order.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const StatusIcon = statusConfig[entry.newStatus as keyof typeof statusConfig]?.icon || Clock;
        const isLatest = index === 0;
        
        return (
          <Card key={entry.id} className={isLatest ? 'border-primary' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${statusConfig[entry.newStatus as keyof typeof statusConfig]?.bgColor || 'bg-gray-100'}`}>
                  <StatusIcon className={`h-4 w-4 ${statusConfig[entry.newStatus as keyof typeof statusConfig]?.color || 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">
                      Status changed to {statusConfig[entry.newStatus as keyof typeof statusConfig]?.label || entry.newStatus}
                    </h4>
                    {isLatest && <Badge variant="outline">Current</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Changed by {entry.changedByName || 'System'} • {format(new Date(entry.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                  {entry.reason && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Reason:</span> {entry.reason}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Notes:</span> {entry.notes}
                    </p>
                  )}
                  {entry.previousStatus && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Previous: {statusConfig[entry.previousStatus as keyof typeof statusConfig]?.label || entry.previousStatus}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminOrders() {
  return (
    <AdminRoute>
      <AdminOrdersContent />
    </AdminRoute>
  );
}