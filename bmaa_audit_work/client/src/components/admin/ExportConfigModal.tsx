import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { CalendarIcon, Filter, Settings, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportOption: ExportOption | null;
  onSubmit: (config: any) => void;
  isLoading: boolean;
}

const datePresets = [
  { label: "Last 7 days", value: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", value: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "Last 90 days", value: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { label: "This month", value: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "This year", value: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
];

const fieldLabels: Record<string, string> = {
  // Orders fields
  orderId: "Order ID",
  orderNumber: "Order Number", 
  customerName: "Customer Name",
  customerEmail: "Customer Email",
  customerPhone: "Customer Phone",
  orderDate: "Order Date",
  status: "Order Status",
  paymentStatus: "Payment Status",
  paymentMethod: "Payment Method",
  total: "Total Amount",
  tax: "Tax Amount",
  shippingCost: "Shipping Cost",
  items: "Order Items",
  quantities: "Item Quantities",
  itemPrices: "Item Prices",
  shippingAddress: "Shipping Address",
  billingAddress: "Billing Address",
  notes: "Order Notes",
  razorpayOrderId: "Razorpay Order ID",
  razorpayPaymentId: "Razorpay Payment ID",
  updatedAt: "Last Updated",

  // Customers fields
  customerId: "Customer ID",
  id: "Customer ID",
  email: "Email Address",
  firstName: "First Name",
  lastName: "Last Name",
  name: "Full Name",
  phone: "Phone Number",
  phoneNumber: "Phone Number",
  registrationDate: "Registration Date",
  totalOrders: "Total Orders",
  lifetimeValue: "Lifetime Value",
  averageOrderValue: "Average Order Value",
  lastOrderDate: "Last Order Date",
  segment: "Customer Segment",
  customerSegment: "Customer Segment",

  // Inventory fields
  productId: "Product ID",
  sku: "SKU",
  category: "Category",
  currentStock: "Current Stock",
  lowStockThreshold: "Low Stock Threshold",
  reorderPoint: "Reorder Point",
  maxStock: "Max Stock",
  supplier: "Supplier",
  costPrice: "Cost Price",
  retailPrice: "Retail Price",
  stockValue: "Stock Value",
  profitMargin: "Profit Margin",
  daysOfStock: "Days of Stock",
  reorderSuggestion: "Reorder Suggestion",
  lastStockUpdate: "Last Stock Update",

  // Revenue fields
  date: "Date",
  period: "Period",
  totalRevenue: "Total Revenue",
  ordersCount: "Orders Count",
  paymentMethods: "Payment Methods",
  categories: "Product Categories",

  // Analytics fields
  revenue: "Revenue",
  orders: "Orders",
  customers: "Customers",
  conversionRate: "Conversion Rate",
  retentionRate: "Retention Rate",
  trafficSources: "Traffic Sources"
};

export function ExportConfigModal({ isOpen, onClose, exportOption, onSubmit, isLoading }: ExportConfigModalProps) {
  const [activeTab, setActiveTab] = useState("fields");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [filters, setFilters] = useState<any>({});

  // Reset form when modal opens/closes or export option changes
  useEffect(() => {
    if (isOpen && exportOption) {
      setSelectedFields(exportOption.fields);
      setDateRange({ from: subDays(new Date(), 30), to: new Date() });
      setFilters({});
      setActiveTab("fields");
    }
  }, [isOpen, exportOption]);

  const handleFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, field]);
    } else {
      setSelectedFields(prev => prev.filter(f => f !== field));
    }
  };

  const handleSelectAllFields = () => {
    if (exportOption) {
      setSelectedFields(exportOption.fields);
    }
  };

  const handleDeselectAllFields = () => {
    setSelectedFields([]);
  };

  const handleDatePreset = (preset: any) => {
    setDateRange(preset.value());
  };

  const handleSubmit = () => {
    if (!exportOption) return;

    const config: any = {
      fields: selectedFields,
      dateFrom: dateRange.from.toISOString(),
      dateTo: dateRange.to.toISOString(),
      ...filters
    };

    // Add export-specific configurations
    switch (exportOption.type) {
      case 'orders':
        config.includeItems = selectedFields.includes('items');
        config.includeShippingDetails = selectedFields.includes('shippingAddress') || selectedFields.includes('billingAddress');
        config.includePaymentDetails = selectedFields.includes('razorpayOrderId') || selectedFields.includes('razorpayPaymentId');
        break;
      case 'customers':
        config.includeLTV = selectedFields.includes('lifetimeValue');
        config.includeSegmentation = selectedFields.includes('customerSegment');
        break;
      case 'inventory':
        config.includePerformanceMetrics = selectedFields.includes('stockValue') || selectedFields.includes('profitMargin');
        config.includeReorderSuggestions = selectedFields.includes('reorderSuggestion');
        break;
      case 'revenue':
        config.period = filters.period || 'daily';
        config.includePaymentMethodBreakdown = selectedFields.includes('paymentMethods');
        config.includeCategoryBreakdown = selectedFields.includes('categories');
        break;
      case 'analytics':
        config.aggregation = filters.aggregation || 'daily';
        config.metrics = selectedFields;
        break;
    }

    onSubmit(config);
  };

  if (!exportOption) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <exportOption.icon className="h-5 w-5" />
            Configure {exportOption.title}
          </DialogTitle>
          <DialogDescription>
            Customize your export settings, select fields, and apply filters before generating the export.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fields" data-testid="tab-export-fields">
              <FileText className="h-4 w-4 mr-2" />
              Fields & Columns
            </TabsTrigger>
            <TabsTrigger value="filters" data-testid="tab-export-filters">
              <Filter className="h-4 w-4 mr-2" />
              Filters & Date Range
            </TabsTrigger>
            <TabsTrigger value="preview" data-testid="tab-export-preview">
              <Settings className="h-4 w-4 mr-2" />
              Preview & Generate
            </TabsTrigger>
          </TabsList>

          {/* Fields Selection Tab */}
          <TabsContent value="fields" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Export Fields</CardTitle>
                <CardDescription>
                  Choose which data fields to include in your export. Selected: {selectedFields.length} of {exportOption.fields.length}
                </CardDescription>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAllFields}
                    data-testid="button-select-all-fields"
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeselectAllFields}
                    data-testid="button-deselect-all-fields"
                  >
                    Deselect All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exportOption.fields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field}`}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                        data-testid={`checkbox-field-${field}`}
                      />
                      <Label htmlFor={`field-${field}`} className="text-sm font-normal cursor-pointer">
                        {fieldLabels[field] || field}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Date Range</CardTitle>
                  <CardDescription>Select the date range for your export</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    {datePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDatePreset(preset)}
                        className="justify-start"
                        data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custom Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                            data-testid="button-date-from"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "From date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal",
                              !dateRange.to && "text-muted-foreground"
                            )}
                            data-testid="button-date-to"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "To date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export-Specific Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Filters</CardTitle>
                  <CardDescription>Configure export-specific filtering options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exportOption.type === 'orders' && (
                    <>
                      <div className="space-y-2">
                        <Label>Order Status</Label>
                        <Select onValueChange={(value) => setFilters((prev: any) => ({ ...prev, status: value !== 'all' ? [value] : undefined }))}>
                          <SelectTrigger data-testid="select-order-status">
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Customer Email (Optional)</Label>
                        <Input 
                          placeholder="Filter by customer email"
                          onChange={(e) => setFilters((prev: any) => ({ ...prev, customerEmail: e.target.value || undefined }))}
                          data-testid="input-customer-email"
                        />
                      </div>
                    </>
                  )}

                  {exportOption.type === 'customers' && (
                    <>
                      <div className="space-y-2">
                        <Label>Customer Segment</Label>
                        <Select onValueChange={(value) => setFilters((prev: any) => ({ ...prev, segment: value !== 'all' ? value : undefined }))}>
                          <SelectTrigger data-testid="select-customer-segment">
                            <SelectValue placeholder="All segments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Segments</SelectItem>
                            <SelectItem value="new">New Customers</SelectItem>
                            <SelectItem value="returning">Returning Customers</SelectItem>
                            <SelectItem value="vip">VIP Customers</SelectItem>
                            <SelectItem value="inactive">Inactive Customers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {exportOption.type === 'inventory' && (
                    <>
                      <div className="space-y-2">
                        <Label>Stock Level</Label>
                        <Select onValueChange={(value) => setFilters((prev: any) => ({ ...prev, stockLevel: value }))}>
                          <SelectTrigger data-testid="select-stock-level">
                            <SelectValue placeholder="All stock levels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Stock Levels</SelectItem>
                            <SelectItem value="in_stock">In Stock</SelectItem>
                            <SelectItem value="low_stock">Low Stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                            <SelectItem value="reorder_point">At Reorder Point</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {exportOption.type === 'revenue' && (
                    <>
                      <div className="space-y-2">
                        <Label>Period Breakdown</Label>
                        <Select onValueChange={(value) => setFilters((prev: any) => ({ ...prev, period: value }))}>
                          <SelectTrigger data-testid="select-revenue-period">
                            <SelectValue placeholder="Daily" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {exportOption.type === 'analytics' && (
                    <>
                      <div className="space-y-2">
                        <Label>Data Aggregation</Label>
                        <Select onValueChange={(value) => setFilters((prev: any) => ({ ...prev, aggregation: value }))}>
                          <SelectTrigger data-testid="select-analytics-aggregation">
                            <SelectValue placeholder="Daily" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Summary</CardTitle>
                <CardDescription>Review your export configuration before generating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Export Type</Label>
                    <p className="text-sm text-muted-foreground">{exportOption.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date Range</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Selected Fields</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedFields.slice(0, 5).map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {fieldLabels[field] || field}
                        </Badge>
                      ))}
                      {selectedFields.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedFields.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Estimated Size</Label>
                    <p className="text-sm text-muted-foreground">{exportOption.estimatedSize}</p>
                  </div>
                </div>

                {Object.keys(filters).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Applied Filters</Label>
                    <div className="space-y-1 mt-1">
                      {Object.entries(filters).map(([key, value]) => 
                        value ? (
                          <p key={key} className="text-sm text-muted-foreground">
                            {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                          </p>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || selectedFields.length === 0}
            data-testid="button-generate-export"
          >
            {isLoading ? (
              <>Generating Export...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}