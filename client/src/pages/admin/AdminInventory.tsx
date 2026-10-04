import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Minus,
  RefreshCw,
  BarChart3,
  AlertCircle,
  PackageX,
  FileText,
  Download,
  Upload,
  Calendar,
  Filter,
  X,
  Eye,
  Edit,
  ArrowUpDown,
  Clock,
  User,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import type {
  InventoryOverviewQuery,
  InventoryOverviewResponse,
  LowStockAlertsQuery,
  LowStockAlertsResponse,
  InventoryAuditQuery,
  InventoryAuditResponse,
  AdminBulkAdjustment,
  BulkOperationStatus,
} from "@shared/schema";

// Form schemas
const quickAdjustmentSchema = z.object({
  quantity: z.string().min(1, "Quantity is required"),
  adjustmentType: z.enum([
    "restock",
    "adjustment",
    "damage",
    "return",
    "correction",
  ]),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

const bulkAdjustmentSchema = z.object({
  operationDescription: z.string().min(1, "Operation description is required"),
  bulkOperationType: z.enum(["manual_bulk", "csv_upload"]),
  adjustments: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number(),
        adjustmentType: z.enum([
          "restock",
          "adjustment",
          "damage",
          "return",
          "correction",
        ]),
        reason: z.string().min(1, "Reason is required"),
        notes: z.string().optional(),
        reference: z.string().optional(),
      }),
    )
    .min(1, "At least one adjustment is required"),
});

const csvUploadSchema = z.object({
  operationDescription: z.string().min(1, "Operation description is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number(),
  csvData: z.string().min(1, "CSV data is required"),
});

type QuickAdjustmentValues = z.infer<typeof quickAdjustmentSchema>;
type BulkAdjustmentValues = z.infer<typeof bulkAdjustmentSchema>;
type CsvUploadValues = z.infer<typeof csvUploadSchema>;

function AdminInventoryContent() {
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [overviewFilters, setOverviewFilters] = useState<
    Partial<InventoryOverviewQuery>
  >({
    page: 1,
    limit: 20,
    search: "",
    category: "all",
    stockStatus: "all",
    sortBy: "name",
    sortOrder: "asc",
    includeValue: true,
  });
  const [lowStockFilters, setLowStockFilters] = useState<
    Partial<LowStockAlertsQuery>
  >({
    page: 1,
    limit: 20,
    urgency: "all",
    category: "all",
    alertType: "all",
    sortBy: "urgency",
    sortOrder: "desc",
    includeResolved: false,
  });
  const [auditFilters, setAuditFilters] = useState<
    Partial<InventoryAuditQuery>
  >({
    page: 1,
    limit: 20,
    productId: "all",
    adminUserId: "all",
    changeType: "all",
    adjustmentType: "all",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    includeSystemChanges: false,
  });

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isQuickAdjustOpen, setIsQuickAdjustOpen] = useState(false);
  const [isBulkAdjustOpen, setIsBulkAdjustOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // API queries using the new admin endpoints
  const { data: inventoryOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/admin/inventory/overview", overviewFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(overviewFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "all") {
          params.append(key, String(value));
        }
      });
      const response = await authenticatedFetch(
        `/api/admin/inventory/overview?${params}`,
      );
      if (!response.ok) throw new Error("Failed to fetch inventory overview");
      return response.json() as Promise<InventoryOverviewResponse>;
    },
  });

  const { data: lowStockAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/admin/inventory/low-stock", lowStockFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(lowStockFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "all") {
          params.append(key, String(value));
        }
      });
      const response = await authenticatedFetch(
        `/api/admin/inventory/low-stock?${params}`,
      );
      if (!response.ok) throw new Error("Failed to fetch low stock alerts");
      return response.json() as Promise<LowStockAlertsResponse>;
    },
  });

  const { data: auditTrail, isLoading: auditLoading } = useQuery({
    queryKey: ["/api/admin/inventory/audit", auditFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(auditFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "all") {
          params.append(key, String(value));
        }
      });
      const response = await authenticatedFetch(
        `/api/admin/inventory/audit?${params}`,
      );
      if (!response.ok) throw new Error("Failed to fetch audit trail");
      return response.json() as Promise<InventoryAuditResponse>;
    },
  });

  // Forms
  const quickAdjustForm = useForm<QuickAdjustmentValues>({
    resolver: zodResolver(quickAdjustmentSchema),
    defaultValues: {
      quantity: "",
      adjustmentType: "adjustment",
      reason: "",
      notes: "",
    },
  });

  const bulkAdjustForm = useForm<BulkAdjustmentValues>({
    resolver: zodResolver(bulkAdjustmentSchema),
    defaultValues: {
      operationDescription: "",
      bulkOperationType: "manual_bulk",
      adjustments: [
        {
          productId: "",
          quantity: 0,
          adjustmentType: "adjustment",
          reason: "",
          notes: "",
          reference: "",
        },
      ],
    },
  });

  const csvUploadForm = useForm<CsvUploadValues>({
    resolver: zodResolver(csvUploadSchema),
    defaultValues: {
      operationDescription: "",
      fileName: "",
      fileSize: 0,
      csvData: "",
    },
  });

  // Mutations
  const quickAdjustMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      adjustment: QuickAdjustmentValues;
    }) => {
      const response = await authenticatedFetch(
        "/api/admin/inventory/bulk-adjust",
        {
          method: "POST",
          body: JSON.stringify({
            operationDescription: `Quick adjustment: ${data.adjustment.adjustmentType}`,
            bulkOperationType: "manual_bulk",
            adjustments: [
              {
                productId: data.productId,
                quantity: parseInt(data.adjustment.quantity),
                adjustmentType: data.adjustment.adjustmentType,
                reason: data.adjustment.reason,
                notes: data.adjustment.notes,
                reference: `Quick adjust ${Date.now()}`,
              },
            ],
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to perform adjustment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/low-stock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/audit"],
      });
      setIsQuickAdjustOpen(false);
      setSelectedProduct(null);
      quickAdjustForm.reset();
      toast({ title: "Stock adjustment completed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to adjust stock", variant: "destructive" });
    },
  });

  const bulkAdjustMutation = useMutation({
    mutationFn: async (data: BulkAdjustmentValues) => {
      const response = await authenticatedFetch(
        "/api/admin/inventory/bulk-adjust",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) throw new Error("Failed to perform bulk adjustment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/low-stock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/audit"],
      });
      setIsBulkAdjustOpen(false);
      bulkAdjustForm.reset();
      toast({ title: "Bulk adjustment completed successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to perform bulk adjustment",
        variant: "destructive",
      });
    },
  });

  const csvUploadMutation = useMutation({
    mutationFn: async (data: CsvUploadValues) => {
      const response = await authenticatedFetch(
        "/api/admin/inventory/csv-upload",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) throw new Error("Failed to upload CSV");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/overview"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/low-stock"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/inventory/audit"],
      });
      setIsCsvUploadOpen(false);
      setCsvFile(null);
      csvUploadForm.reset();
      toast({ title: "CSV upload completed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to upload CSV", variant: "destructive" });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (config: {
      format: string;
      type: string;
      filters?: any;
    }) => {
      const response = await authenticatedFetch("/api/admin/inventory/export", {
        method: "POST",
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error("Failed to export data");
      return response.text();
    },
    onSuccess: (csvData, variables) => {
      // Create download link
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_${variables.type}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Export completed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to export data", variant: "destructive" });
    },
  });

  // Event handlers
  const handleQuickAdjust = (productId: string) => {
    setSelectedProduct(productId);
    setIsQuickAdjustOpen(true);
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      csvUploadForm.setValue("fileName", file.name);
      csvUploadForm.setValue("fileSize", file.size);

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target?.result as string;
        csvUploadForm.setValue("csvData", csvData);
      };
      reader.readAsText(file);
    }
  };

  const addBulkAdjustmentRow = () => {
    const currentAdjustments = bulkAdjustForm.getValues("adjustments");
    bulkAdjustForm.setValue("adjustments", [
      ...currentAdjustments,
      {
        productId: "",
        quantity: 0,
        adjustmentType: "adjustment",
        reason: "",
        notes: "",
        reference: "",
      },
    ]);
  };

  const removeBulkAdjustmentRow = (index: number) => {
    const currentAdjustments = bulkAdjustForm.getValues("adjustments");
    if (currentAdjustments.length > 1) {
      bulkAdjustForm.setValue(
        "adjustments",
        currentAdjustments.filter((_, i) => i !== index),
      );
    }
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            In Stock
          </Badge>
        );
      case "low-stock":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Low Stock
          </Badge>
        );
      case "out-of-stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleExport = (type: string) => {
    let filters = {};
    if (type === "overview") {
      filters = overviewFilters;
    } else if (type === "low_stock_alerts") {
      filters = lowStockFilters;
    } else if (type === "audit_trail") {
      filters = auditFilters;
    }

    exportMutation.mutate({
      format: "csv",
      type,
      filters,
    });
  };

  if (overviewLoading && activeTab === "overview") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory Oversight</h1>
            <p className="text-muted-foreground">
              Comprehensive inventory management and analytics
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1
            className="text-3xl font-bold"
            data-testid="heading-admin-inventory"
          >
            Inventory Oversight
          </h1>
          <p className="text-muted-foreground">
            Comprehensive inventory management and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              handleExport(
                activeTab === "overview"
                  ? "overview"
                  : activeTab === "alerts"
                    ? "low_stock_alerts"
                    : "audit_trail",
              )
            }
            disabled={exportMutation.isPending}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          {/* <TabsTrigger value="alerts" data-testid="tab-alerts">Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="bulk" data-testid="tab-bulk">Bulk Adjustments</TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">Audit Trail</TabsTrigger> */}
        </TabsList>

        {/* Inventory Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {inventoryOverview && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Products
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="stat-total-products"
                    >
                      {inventoryOverview.summary.totalProducts}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {inventoryOverview.summary.totalUnits} total units
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Out of Stock
                    </CardTitle>
                    <PackageX className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold text-destructive"
                      data-testid="stat-out-of-stock"
                    >
                      {inventoryOverview.summary.outOfStockCount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Need restocking
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Inventory Value
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="stat-inventory-value"
                    >
                      ₹
                      {inventoryOverview.summary.totalInventoryValue.toLocaleString(
                        "en-IN",
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Total value</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={overviewFilters.search || ""}
                    onChange={(e) =>
                      setOverviewFilters({
                        ...overviewFilters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    data-testid="input-search-overview"
                  />
                </div>
                <Select
                  value={overviewFilters.stockStatus || "all"}
                  onValueChange={(value) =>
                    setOverviewFilters({
                      ...overviewFilters,
                      stockStatus: value as any,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={overviewFilters.sortBy || "name"}
                  onValueChange={(value) =>
                    setOverviewFilters({
                      ...overviewFilters,
                      sortBy: value as any,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="inStock">Stock Level</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="updatedAt">Last Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Inventory</CardTitle>
                  <CardDescription>
                    Current stock levels and product information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryOverview.products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell>{product.sku || "N/A"}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>{product.inStock}</TableCell>
                            <TableCell>{product.available}</TableCell>
                            <TableCell>
                              {getStockStatusBadge(product.status)}
                            </TableCell>
                            <TableCell>
                              {product.totalValue
                                ? `₹${Number(product.totalValue).toLocaleString("en-IN")}`
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickAdjust(product.id)}
                                data-testid={`button-adjust-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Low Stock Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          {lowStockAlerts && (
            <>
              {/* Alert Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Alerts
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {lowStockAlerts.summary.totalAlerts}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Critical
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {lowStockAlerts.summary.criticalAlerts}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      High Priority
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {lowStockAlerts.summary.highAlerts}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Medium Priority
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {lowStockAlerts.summary.mediumAlerts}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Filters */}
              <div className="flex gap-4 items-center">
                <Select
                  value={lowStockFilters.urgency || "all"}
                  onValueChange={(value) =>
                    setLowStockFilters({
                      ...lowStockFilters,
                      urgency: value as any,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Urgency</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={lowStockFilters.alertType || "all"}
                  onValueChange={(value) =>
                    setLowStockFilters({
                      ...lowStockFilters,
                      alertType: value as any,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Alert Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Alerts Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Low Stock Alerts</CardTitle>
                  <CardDescription>
                    Products requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Current Stock</TableHead>
                          <TableHead>Threshold</TableHead>
                          <TableHead>Urgency</TableHead>
                          <TableHead>Days Until Stockout</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockAlerts.alerts.map((alert) => (
                          <TableRow key={alert.id}>
                            <TableCell className="font-medium">
                              {alert.productName}
                            </TableCell>
                            <TableCell>{alert.currentStock}</TableCell>
                            <TableCell>{alert.threshold}</TableCell>
                            <TableCell>
                              {getUrgencyBadge(alert.urgency)}
                            </TableCell>
                            <TableCell>
                              {alert.daysUntilStockout
                                ? `${alert.daysUntilStockout} days`
                                : "N/A"}
                            </TableCell>
                            <TableCell>{alert.supplier || "N/A"}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleQuickAdjust(alert.productId)
                                }
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Bulk Adjustments Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>CSV Upload</CardTitle>
                <CardDescription>
                  Upload a CSV file for bulk inventory adjustments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCsvUploadOpen(true)}
                  className="w-full"
                  data-testid="button-csv-upload"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV File
                </Button>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with columns: Product ID, Quantity,
                  Adjustment Type, Reason
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>
                  Manually create bulk inventory adjustments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setIsBulkAdjustOpen(true)}
                  className="w-full"
                  data-testid="button-manual-bulk"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Create Manual Adjustment
                </Button>
                <p className="text-sm text-muted-foreground">
                  Manually enter multiple product adjustments with full audit
                  trail
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          {auditTrail && (
            <>
              {/* Audit Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Changes
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {auditTrail.summary.totalChanges}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Adjustments
                    </CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {auditTrail.summary.totalAdjustments}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Bulk Operations
                    </CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {auditTrail.summary.totalBulkOperations}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Net Change
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {auditTrail.summary.netStockChange}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Audit Filters */}
              <div className="flex gap-4 items-center">
                <Input
                  placeholder="Search audit trail..."
                  value={auditFilters.search || ""}
                  onChange={(e) =>
                    setAuditFilters({
                      ...auditFilters,
                      search: e.target.value,
                      page: 1,
                    })
                  }
                  data-testid="input-search-audit"
                />
                <Select
                  value={auditFilters.changeType || "all"}
                  onValueChange={(value) =>
                    setAuditFilters({
                      ...auditFilters,
                      changeType: value as any,
                      page: 1,
                    })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Changes</SelectItem>
                    <SelectItem value="stock_in">Stock In</SelectItem>
                    <SelectItem value="stock_out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">
                      Manual Adjustment
                    </SelectItem>
                    <SelectItem value="bulk_adjustment">
                      Bulk Adjustment
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audit Trail Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Changes</CardTitle>
                  <CardDescription>
                    Complete audit trail of all inventory modifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Change Type</TableHead>
                          <TableHead>Before</TableHead>
                          <TableHead>Changed</TableHead>
                          <TableHead>After</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Admin User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditTrail.history.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.productName}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.changeType}</Badge>
                            </TableCell>
                            <TableCell>{item.quantityBefore}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  item.changeType === "stock_in"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {item.changeType === "stock_in" ? "+" : "-"}
                                {item.quantityChanged}
                              </span>
                            </TableCell>
                            <TableCell>{item.quantityAfter}</TableCell>
                            <TableCell>{item.reason}</TableCell>
                            <TableCell>
                              {item.adminUserName || "System"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Adjustment Dialog */}
      <Dialog open={isQuickAdjustOpen} onOpenChange={setIsQuickAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Stock Adjustment</DialogTitle>
            <DialogDescription>
              Make a quick adjustment to inventory levels
            </DialogDescription>
          </DialogHeader>
          <Form {...quickAdjustForm}>
            <form
              onSubmit={quickAdjustForm.handleSubmit((data) =>
                quickAdjustMutation.mutate({
                  productId: selectedProduct!,
                  adjustment: data,
                }),
              )}
              className="space-y-4"
            >
              <FormField
                control={quickAdjustForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (+/-)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., +10 or -5"
                        {...field}
                        data-testid="input-quick-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={quickAdjustForm.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select adjustment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restock">Restock</SelectItem>
                        <SelectItem value="adjustment">
                          Manual Adjustment
                        </SelectItem>
                        <SelectItem value="damage">Damage/Loss</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={quickAdjustForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Reason for adjustment..."
                        {...field}
                        data-testid="input-quick-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={quickAdjustMutation.isPending}
                  data-testid="button-save-quick-adjustment"
                >
                  {quickAdjustMutation.isPending
                    ? "Adjusting..."
                    : "Apply Adjustment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Adjustment Dialog */}
      <Dialog open={isBulkAdjustOpen} onOpenChange={setIsBulkAdjustOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Inventory Adjustment</DialogTitle>
            <DialogDescription>
              Create multiple inventory adjustments with full audit trail
            </DialogDescription>
          </DialogHeader>
          <Form {...bulkAdjustForm}>
            <form
              onSubmit={bulkAdjustForm.handleSubmit((data) =>
                bulkAdjustMutation.mutate(data),
              )}
              className="space-y-6"
            >
              <FormField
                control={bulkAdjustForm.control}
                name="operationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe this bulk operation..."
                        {...field}
                        data-testid="input-bulk-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Adjustments</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBulkAdjustmentRow}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {bulkAdjustForm.watch("adjustments").map((_, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg"
                  >
                    <div className="col-span-3">
                      <FormField
                        control={bulkAdjustForm.control}
                        name={`adjustments.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product</FormLabel>
                            <FormControl>
                              <Input placeholder="Product ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={bulkAdjustForm.control}
                        name={`adjustments.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={bulkAdjustForm.control}
                        name={`adjustments.${index}.adjustmentType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="restock">Restock</SelectItem>
                                <SelectItem value="adjustment">
                                  Adjustment
                                </SelectItem>
                                <SelectItem value="damage">Damage</SelectItem>
                                <SelectItem value="return">Return</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-4">
                      <FormField
                        control={bulkAdjustForm.control}
                        name={`adjustments.${index}.reason`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl>
                              <Input placeholder="Reason..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBulkAdjustmentRow(index)}
                        disabled={
                          bulkAdjustForm.watch("adjustments").length <= 1
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={bulkAdjustMutation.isPending}
                  data-testid="button-save-bulk-adjustment"
                >
                  {bulkAdjustMutation.isPending
                    ? "Processing..."
                    : "Apply Bulk Adjustment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={isCsvUploadOpen} onOpenChange={setIsCsvUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSV Upload</DialogTitle>
            <DialogDescription>
              Upload a CSV file for bulk inventory adjustments
            </DialogDescription>
          </DialogHeader>
          <Form {...csvUploadForm}>
            <form
              onSubmit={csvUploadForm.handleSubmit((data) =>
                csvUploadMutation.mutate(data),
              )}
              className="space-y-4"
            >
              <FormField
                control={csvUploadForm.control}
                name="operationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Describe this CSV upload operation..."
                        {...field}
                        data-testid="input-csv-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileSelect}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  data-testid="input-csv-file"
                />
                {csvFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)}{" "}
                    KB)
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  disabled={csvUploadMutation.isPending || !csvFile}
                  data-testid="button-upload-csv"
                >
                  {csvUploadMutation.isPending
                    ? "Uploading..."
                    : "Upload & Process"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminInventory() {
  return (
    <AdminRoute>
      <AdminInventoryContent />
    </AdminRoute>
  );
}
