import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Search,
  UserCheck,
  Users as UsersIcon,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Eye,
  Download,
  Filter,
  ChevronDown,
  AlertTriangle,
  Star,
  Activity,
  IndianRupee,
  ShoppingCart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AdminRoute from "@/components/AdminRoute";
import type {
  CustomerDetail,
  CustomersListResponse,
  CustomersListQuery,
} from "@shared/schema";

// Customer segment configuration
const CUSTOMER_SEGMENTS = {
  all: { label: "All Customers", color: "default" },
  high_value: { label: "High Value", color: "green" },
  new: { label: "New", color: "blue" },
  returning: { label: "Returning", color: "purple" },
  at_risk: { label: "At Risk", color: "orange" },
  inactive: { label: "Inactive", color: "red" },
  vip: { label: "VIP", color: "yellow" },
} as const;

// LTV ranges for filtering
const LTV_RANGES = [
  { label: "All", min: undefined, max: undefined },
  { label: "$0 - $100", min: 0, max: 100 },
  { label: "$100 - $500", min: 100, max: 500 },
  { label: "$500 - $1,000", min: 500, max: 1000 },
  { label: "$1,000 - $5,000", min: 1000, max: 5000 },
  { label: "$5,000+", min: 5000, max: undefined },
];

interface CustomerFilters {
  search: string;
  segment: "all" | "new" | "returning" | "vip" | "at_risk" | "inactive";
  sortBy:
    | "name"
    | "email"
    | "registrationDate"
    | "totalOrders"
    | "lifetimeValue"
    | "lastOrderDate";
  sortOrder: "asc" | "desc";
  ltvMin?: number;
  ltvMax?: number;
  registrationFrom?: string;
  registrationTo?: string;
  lastActivityDays?: number;
}

function AdminCustomersContent() {
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    segment: "all",
    sortBy: "lifetimeValue",
    sortOrder: "desc",
  });
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetail | null>(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const authenticatedFetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams: CustomersListQuery = {
    page: currentPage,
    limit: 20,
    search: filters.search || undefined,
    segment: filters.segment,
    sortBy: filters.sortBy as
      | "name"
      | "email"
      | "registrationDate"
      | "totalOrders"
      | "lifetimeValue"
      | "lastOrderDate",
    sortOrder: filters.sortOrder,
    ltvMin: filters.ltvMin,
    ltvMax: filters.ltvMax,
    registrationFrom: filters.registrationFrom,
    registrationTo: filters.registrationTo,
    lastActivityDays: filters.lastActivityDays,
    includeAnalytics: true,
    includeOrderSummary: true,
  };

  // Fetch customers list
  const {
    data: customersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/customers", queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await authenticatedFetch(
        `/api/admin/customers?${params}`,
      );
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json() as Promise<CustomersListResponse>;
    },
  });

  // Fetch customer segmentation overview
  const { data: segmentationData } = useQuery({
    queryKey: ["/api/admin/customers/segments"],
    queryFn: async () => {
      const response = await authenticatedFetch(
        "/api/admin/customers/segments",
      );
      if (!response.ok) throw new Error("Failed to fetch segmentation");
      return response.json();
    },
  });

  // Export customers mutation
  const exportCustomersMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const response = await authenticatedFetch(
        `/api/admin/customers/export?${params}`,
      );
      if (!response.ok) throw new Error("Failed to export customers");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Complete",
        description: "Customer data has been exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export customer data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const viewCustomerDetails = async (customerId: string) => {
    try {
      const response = await authenticatedFetch(
        `/api/admin/customers/${customerId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch customer details");
      const customer = (await response.json()) as CustomerDetail;
      setSelectedCustomer(customer);
      setIsCustomerDetailOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customer details.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSort = (
    column:
      | "name"
      | "email"
      | "registrationDate"
      | "totalOrders"
      | "lifetimeValue"
      | "lastOrderDate",
  ) => {
    const newOrder =
      filters.sortBy === column && filters.sortOrder === "desc"
        ? "asc"
        : "desc";
    setFilters((prev) => ({ ...prev, sortBy: column, sortOrder: newOrder }));
    setCurrentPage(1);
  };

  const getCustomerSegmentBadge = (segment: string) => {
    const segmentConfig = CUSTOMER_SEGMENTS[
      segment as keyof typeof CUSTOMER_SEGMENTS
    ] || { label: segment, color: "default" };
    return (
      <Badge variant={segmentConfig.color as any} className="text-xs">
        {segmentConfig.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">
              Manage customer relationships and analytics
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Error Loading Customers
            </h3>
            <p className="text-muted-foreground">
              Failed to load customer data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customers = customersData?.customers || [];
  const pagination = customersData?.pagination;

  // Calculate stats from data
  const totalCustomers = segmentationData?.totalCustomers || 0;
  const highValueCount =
    segmentationData?.segments?.find((s: any) => s.segment === "high_value")
      ?.count || 0;
  const newCustomersCount =
    segmentationData?.segments?.find((s: any) => s.segment === "new")?.count ||
    0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-3xl font-bold"
            data-testid="heading-admin-customers"
          >
            Customers
          </h1>
          <p className="text-muted-foreground">
            Manage customer relationships, LTV analysis, and communication
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => exportCustomersMutation.mutate()}
            disabled={exportCustomersMutation.isPending}
            data-testid="button-export-customers"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      {/* Customer Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="stat-total-customers"
            >
              {totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Value</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-high-value-customers">
              {highValueCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Top 20% by LTV
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-blue-600"
              data-testid="stat-new-customers"
            >
              {newCustomersCount}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-customers"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.segment}
                onValueChange={(value) => handleFilterChange("segment", value)}
              >
                <SelectTrigger
                  className="w-[150px]"
                  data-testid="select-customer-segment"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CUSTOMER_SEGMENTS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-testid="button-advanced-filters"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">LTV Range</label>
                      <Select
                        value={`${filters.ltvMin || "all"}-${filters.ltvMax || "all"}`}
                        onValueChange={(value) => {
                          const range = LTV_RANGES.find(
                            (r) =>
                              `${r.min || "all"}-${r.max || "all"}` === value,
                          );
                          if (range) {
                            handleFilterChange("ltvMin", range.min);
                            handleFilterChange("ltvMax", range.max);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LTV_RANGES.map((range, index) => (
                            <SelectItem
                              key={index}
                              value={`${range.min || "all"}-${range.max || "all"}`}
                            >
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">
                        Last Activity
                      </label>
                      <Select
                        value={filters.lastActivityDays?.toString() || "all"}
                        onValueChange={(value) =>
                          handleFilterChange(
                            "lastActivityDays",
                            value === "all" ? undefined : parseInt(value),
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any time</SelectItem>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                          <SelectItem value="180">Last 6 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer List</CardTitle>
            <div className="text-sm text-muted-foreground">
              {pagination && (
                <>
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} customers
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("registrationDate")}
                  >
                    Joined
                    {filters.sortBy === "registrationDate" && (
                      <span className="ml-1">
                        {filters.sortOrder === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("totalOrders")}
                  >
                    Orders
                    {filters.sortBy === "totalOrders" && (
                      <span className="ml-1">
                        {filters.sortOrder === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("lastOrderDate")}
                  >
                    Last Order
                    {filters.sortBy === "lastOrderDate" && (
                      <span className="ml-1">
                        {filters.sortOrder === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    data-testid={`row-customer-${customer.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={customer.profileImageUrl || undefined}
                          />
                          <AvatarFallback>
                            {customer.firstName?.[0]}
                            {customer.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                          {customer.phoneNumber && (
                            <div className="text-sm text-muted-foreground">
                              {customer.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(customer.createdAt), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCustomerSegmentBadge(
                        customer.analytics.customerSegment || "new",
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-1 text-muted-foreground" />
                        {customer.analytics.totalOrders}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.analytics.lastOrderDate ? (
                        <div className="text-sm">
                          {format(
                            new Date(customer.analytics.lastOrderDate),
                            "MMM d, yyyy",
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Never
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            data-testid={`button-customer-actions-${customer.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => viewCustomerDetails(customer.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.segment !== "all"
                  ? "No customers match your current filters."
                  : "No customers have been registered yet."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      <Dialog
        open={isCustomerDetailOpen}
        onOpenChange={setIsCustomerDetailOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
            <DialogDescription>
              Comprehensive customer information and analytics
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerProfilePanel customer={selectedCustomer} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Customer Profile Panel Component
function CustomerProfilePanel({ customer }: { customer: CustomerDetail }) {
  const [activeTab, setActiveTab] = useState("overview");
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch customer order history
  const { data: orderHistory } = useQuery({
    queryKey: ["/api/admin/customers", customer.id, "orders"],
    queryFn: async () => {
      const response = await authenticatedFetch(
        `/api/admin/customers/${customer.id}/orders`,
      );
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={customer.profileImageUrl || undefined} />
          <AvatarFallback className="text-lg">
            {customer.firstName?.[0]}
            {customer.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">
            {customer.firstName} {customer.lastName}
          </h3>
          <p className="text-muted-foreground">{customer.email}</p>
          {customer.phoneNumber && (
            <p className="text-sm text-muted-foreground">
              {customer.phoneNumber}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline">
              Customer since {format(new Date(customer.createdAt), "MMM yyyy")}
            </Badge>
            <Badge
              variant={
                customer.analytics.customerSegment === "high_value"
                  ? "default"
                  : "secondary"
              }
            >
              {(customer.analytics.customerSegment || "new")
                .replace("_", " ")
                .toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(customer.analytics.lifetimeValue)}
          </div>
          <p className="text-sm text-muted-foreground">Lifetime Value</p>
        </div>
      </div>

      {/* Customer Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customer.analytics.totalOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(customer.analytics.averageOrderValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Last Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {customer.analytics.lastOrderDate
                    ? format(
                        new Date(customer.analytics.lastOrderDate),
                        "MMM d, yyyy",
                      )
                    : "Never"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {customer.analytics.daysSinceLastOrder !== undefined
                    ? `${customer.analytics.daysSinceLastOrder} days ago`
                    : "No orders yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.emailVerified ? (
                    <Badge variant="default" className="text-xs">
                      Email Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      Email Unverified
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Address */}
          {customer.addresses && customer.addresses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {customer.addresses.map((address, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{address.title}</div>
                      <div className="text-muted-foreground">
                        {address.street}
                      </div>
                      <div className="text-muted-foreground">
                        {address.city}, {address.state} {address.postalCode}
                      </div>
                      {address.isDefault && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {orderHistory ? (
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  {orderHistory.pagination.total} total orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderHistory.orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="font-medium">
                              Order #{order.id.slice(-8)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(
                                new Date(order.createdAt),
                                "MMM d, yyyy h:mm a",
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {order.itemCount} items
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.paymentStatus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Loading order history...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminCustomers() {
  return (
    <AdminRoute>
      <AdminCustomersContent />
    </AdminRoute>
  );
}
