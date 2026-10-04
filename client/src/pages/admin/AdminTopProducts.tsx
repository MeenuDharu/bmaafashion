import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Search, TrendingUp, TrendingDown, Package, IndianRupee, Target, BarChart3, Eye, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AdminLayout } from "@/components/AdminLayout";

type DateRange = "7d" | "30d" | "90d" | "custom";
type SortField = "revenue" | "unitsSold" | "averagePricePerUnit" | "averageOrderValue" | "marketSharePercent" | "growthRate" | "name" | "category";
type SortDirection = "asc" | "desc";

interface TopProductsByRevenueItem {
  id: string;
  name: string;
  image: string | null;
  category: string;
  revenue: number;
  unitsSold: number;
  averagePricePerUnit: number;
  growthPercent: number;
  orderCount: number;
}

interface TopProductsByUnitsItem {
  id: string;
  name: string;
  image: string | null;
  category: string;
  unitsSold: number;
  revenue: number;
  averagePricePerUnit: number;
  growthPercent: number;
  orderCount: number;
}

interface TopCategoryItem {
  category: string;
  revenue: number;
  unitsSold: number;
  averageOrderValue: number;
  marketSharePercent: number;
  growthPercent: number;
  productCount: number;
  orderCount: number;
}

interface TopProductsByRevenueResponse {
  products: TopProductsByRevenueItem[];
  totalProducts: number;
  totalRevenue: number;
  dateRange: {
    from: string;
    to: string;
  };
  previousPeriod?: {
    totalRevenue: number;
    growthPercent: number;
  };
}

interface TopProductsByUnitsResponse {
  products: TopProductsByUnitsItem[];
  totalProducts: number;
  totalUnitsSold: number;
  dateRange: {
    from: string;
    to: string;
  };
  previousPeriod?: {
    totalUnitsSold: number;
    growthPercent: number;
  };
}

interface TopCategoriesResponse {
  categories: TopCategoryItem[];
  totalCategories: number;
  totalRevenue: number;
  totalUnitsSold: number;
  dateRange: {
    from: string;
    to: string;
  };
  previousPeriod?: {
    totalRevenue: number;
    totalUnitsSold: number;
    growthPercent: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminTopProducts() {
  const [activeTab, setActiveTab] = useState<"revenue" | "units" | "categories">("revenue");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch top products by revenue
  const { data: revenueData, isLoading: revenueLoading, error: revenueError } = useQuery<TopProductsByRevenueResponse>({
    queryKey: ['/api/admin/metrics/top-products-revenue', { period: dateRange, sortBy: activeTab === "revenue" ? sortField : "revenue", sortOrder: sortDirection }],
    enabled: activeTab === "revenue"
  });

  // Fetch top products by units sold
  const { data: unitsData, isLoading: unitsLoading, error: unitsError } = useQuery<TopProductsByUnitsResponse>({
    queryKey: ['/api/admin/metrics/top-products-units', { period: dateRange, sortBy: activeTab === "units" ? sortField : "unitsSold", sortOrder: sortDirection }],
    enabled: activeTab === "units"
  });

  // Fetch top categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery<TopCategoriesResponse>({
    queryKey: ['/api/admin/metrics/top-categories', { period: dateRange, sortBy: activeTab === "categories" ? sortField : "revenue", sortOrder: sortDirection }],
    enabled: activeTab === "categories"
  });

  // Filter and sort data based on search term and sort criteria
  const filteredData = useMemo(() => {
    let data: any[] = [];
    
    if (activeTab === "revenue" && revenueData) {
      data = revenueData.products;
    } else if (activeTab === "units" && unitsData) {
      data = unitsData.products;
    } else if (activeTab === "categories" && categoriesData) {
      data = categoriesData.categories;
    }

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => {
        const searchableFields = activeTab === "categories" 
          ? [item.category]
          : [item.name, item.category];
        return searchableFields.some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply sorting (backend already sorts, but we may need to re-sort after filtering)
    data.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "revenue":
          aValue = a.revenue;
          bValue = b.revenue;
          break;
        case "unitsSold":
          aValue = a.unitsSold;
          bValue = b.unitsSold;
          break;
        case "averagePricePerUnit":
          aValue = a.averagePricePerUnit;
          bValue = b.averagePricePerUnit;
          break;
        case "averageOrderValue":
          aValue = a.averageOrderValue;
          bValue = b.averageOrderValue;
          break;
        case "growthRate":
          aValue = a.growthPercent;
          bValue = b.growthPercent;
          break;
        case "name":
          aValue = activeTab === "categories" ? (a as TopCategoryItem).category : (a as TopProductsByRevenueItem | TopProductsByUnitsItem).name;
          bValue = activeTab === "categories" ? (b as TopCategoryItem).category : (b as TopProductsByRevenueItem | TopProductsByUnitsItem).name;
          break;
        case "category":
          aValue = activeTab === "categories" ? (a as TopCategoryItem).category : (a as TopProductsByRevenueItem | TopProductsByUnitsItem).category;
          bValue = activeTab === "categories" ? (b as TopCategoryItem).category : (b as TopProductsByRevenueItem | TopProductsByUnitsItem).category;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return data;
  }, [activeTab, revenueData, unitsData, categoriesData, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const exportToCSV = () => {
    try {
      let csvContent = "";
      let headers: string[] = [];
      let rows: any[] = [];

      if (activeTab === "revenue" || activeTab === "units") {
        headers = ["Product Name", "Category", "Revenue", "Units Sold", "AOV", "Growth %"];
        rows = filteredData.map(item => [
          (item as TopProductsByRevenueItem | TopProductsByUnitsItem).name,
          (item as TopProductsByRevenueItem | TopProductsByUnitsItem).category,
          item.revenue,
          item.unitsSold,
          item.averagePricePerUnit,
          item.growthPercent
        ]);
      } else {
        headers = ["Category", "Revenue", "Units Sold", "AOV", "Market Share %", "Growth %", "Products"];
        rows = filteredData.map(item => [
          (item as TopCategoryItem).category,
          item.revenue,
          item.unitsSold,
          item.averageOrderValue,
          (item as TopCategoryItem).marketSharePercent,
          item.growthPercent,
          (item as TopCategoryItem).productCount
        ]);
      }

      csvContent = headers.join(",") + "\n";
      csvContent += rows.map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `top-${activeTab}-${dateRange}days.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${activeTab === "categories" ? "Categories" : "Products"} data exported to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderGrowthBadge = (growthPercent: number | undefined | null) => {
    if (growthPercent === undefined || growthPercent === null || isNaN(growthPercent)) {
      return (
        <Badge variant="secondary" data-testid="badge-growth-na">
          N/A
        </Badge>
      );
    }
    const isPositive = growthPercent >= 0;
    return (
      <Badge 
        variant={isPositive ? "default" : "destructive"}
        className="flex items-center gap-1"
        data-testid={`badge-growth-${isPositive ? 'positive' : 'negative'}`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? "+" : ""}{growthPercent.toFixed(1)}%
      </Badge>
    );
  };

  const renderProductImage = (image: string | null, name: string) => {
    if (image) {
      return (
        <img
          src={`/api/images/${image}`}
          alt={name}
          className="w-10 h-10 rounded-md object-cover"
          data-testid={`img-product-${name.toLowerCase().replace(/\s+/g, '-')}`}
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
        <Package className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  };

  const renderCategoriesChart = () => {
    if (!categoriesData || categoriesData.categories.length === 0) return null;

    const chartData = categoriesData.categories.slice(0, 6).map(category => ({
      name: category.category,
      value: category.revenue,
      percentage: category.marketSharePercent
    }));

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), "Revenue"]}
              labelFormatter={(label) => `Category: ${label}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const isLoading = revenueLoading || unitsLoading || categoriesLoading;
  const hasError = revenueError || unitsError || categoriesError;

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-top-products">Top Products & Categories</h1>
            <p className="text-muted-foreground mt-1">
              Analyze best-performing products and categories by revenue and units sold
            </p>
          </div>
          <Button 
            onClick={exportToCSV} 
            variant="outline"
            className="flex items-center gap-2"
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="input-search"
              />
            </div>
            
            <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
              <SelectTrigger className="w-40" data-testid="select-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
              <SelectTrigger className="w-32" data-testid="select-page-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue" data-testid="tab-revenue">
            <IndianRupee className="w-4 h-4 mr-2" />
            By Revenue
          </TabsTrigger>
          <TabsTrigger value="units" data-testid="tab-units">
            <Package className="w-4 h-4 mr-2" />
            By Units Sold
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <BarChart3 className="w-4 h-4 mr-2" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          {revenueData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-products">
                        {formatNumber(revenueData.totalProducts)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-revenue">
                        {formatCurrency(revenueData.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Revenue/Product</p>
                      <p className="text-2xl font-bold" data-testid="stat-avg-revenue">
                        {formatCurrency(revenueData.totalRevenue / Math.max(revenueData.totalProducts, 1))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>
                Products ranked by total revenue generated in the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : hasError ? (
                <div className="text-center py-8">
                  <p className="text-destructive">Failed to load data. Please try again.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("name")}
                          data-testid="header-product-name"
                        >
                          <div className="flex items-center gap-2">
                            Product Name {getSortIcon("name")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("category")}
                          data-testid="header-category"
                        >
                          <div className="flex items-center gap-2">
                            Category {getSortIcon("category")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("revenue")}
                          data-testid="header-revenue"
                        >
                          <div className="flex items-center gap-2">
                            Revenue {getSortIcon("revenue")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("unitsSold")}
                          data-testid="header-units-sold"
                        >
                          <div className="flex items-center gap-2">
                            Units Sold {getSortIcon("unitsSold")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("averagePricePerUnit")}
                          data-testid="header-aov"
                        >
                          <div className="flex items-center gap-2">
                            AOV {getSortIcon("averagePricePerUnit")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("growthRate")}
                          data-testid="header-growth"
                        >
                          <div className="flex items-center gap-2">
                            Growth {getSortIcon("growthRate")}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((product: TopProductsByRevenueItem, index) => (
                        <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                          <TableCell>
                            {renderProductImage(product.image, product.name)}
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-product-name-${product.id}`}>
                            {product.name}
                          </TableCell>
                          <TableCell data-testid={`text-category-${product.id}`}>
                            <Badge variant="secondary">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="font-bold text-green-600" data-testid={`text-revenue-${product.id}`}>
                            {formatCurrency(product.revenue)}
                          </TableCell>
                          <TableCell data-testid={`text-units-${product.id}`}>
                            {formatNumber(product.unitsSold)}
                          </TableCell>
                          <TableCell data-testid={`text-aov-${product.id}`}>
                            {formatCurrency(product.averagePricePerUnit)}
                          </TableCell>
                          <TableCell data-testid={`text-growth-${product.id}`}>
                            {renderGrowthBadge(product.growthPercent)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-view-${product.id}`}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} products
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <span className="text-sm" data-testid="text-current-page">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          {unitsData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-products-units">
                        {formatNumber(unitsData.totalProducts)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Units Sold</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-units">
                        {formatNumber(unitsData.totalUnitsSold)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Units/Product</p>
                      <p className="text-2xl font-bold" data-testid="stat-avg-units">
                        {formatNumber(unitsData.totalUnitsSold / Math.max(unitsData.totalProducts, 1))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Top Products by Units Sold</CardTitle>
              <CardDescription>
                Products ranked by total units sold in the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unitsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : hasError ? (
                <div className="text-center py-8">
                  <p className="text-destructive">Failed to load data. Please try again.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("name")}
                          data-testid="header-product-name-units"
                        >
                          <div className="flex items-center gap-2">
                            Product Name {getSortIcon("name")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("category")}
                          data-testid="header-category-units"
                        >
                          <div className="flex items-center gap-2">
                            Category {getSortIcon("category")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("unitsSold")}
                          data-testid="header-units-sold-units"
                        >
                          <div className="flex items-center gap-2">
                            Units Sold {getSortIcon("unitsSold")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("revenue")}
                          data-testid="header-revenue-units"
                        >
                          <div className="flex items-center gap-2">
                            Revenue {getSortIcon("revenue")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("averagePricePerUnit")}
                          data-testid="header-aov-units"
                        >
                          <div className="flex items-center gap-2">
                            AOV {getSortIcon("averagePricePerUnit")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("growthRate")}
                          data-testid="header-growth-units"
                        >
                          <div className="flex items-center gap-2">
                            Growth {getSortIcon("growthRate")}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((product: TopProductsByUnitsItem, index) => (
                        <TableRow key={product.id} data-testid={`row-product-units-${product.id}`}>
                          <TableCell>
                            {renderProductImage(product.image, product.name)}
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-product-name-units-${product.id}`}>
                            {product.name}
                          </TableCell>
                          <TableCell data-testid={`text-category-units-${product.id}`}>
                            <Badge variant="secondary">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="font-bold text-blue-600" data-testid={`text-units-units-${product.id}`}>
                            {formatNumber(product.unitsSold)}
                          </TableCell>
                          <TableCell data-testid={`text-revenue-units-${product.id}`}>
                            {formatCurrency(product.revenue)}
                          </TableCell>
                          <TableCell data-testid={`text-aov-units-${product.id}`}>
                            {formatCurrency(product.averagePricePerUnit)}
                          </TableCell>
                          <TableCell data-testid={`text-growth-units-${product.id}`}>
                            {renderGrowthBadge(product.growthPercent)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-view-units-${product.id}`}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-edit-units-${product.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground" data-testid="text-pagination-info-units">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} products
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          data-testid="button-prev-page-units"
                        >
                          Previous
                        </Button>
                        <span className="text-sm" data-testid="text-current-page-units">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          data-testid="button-next-page-units"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          {categoriesData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Categories</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-categories">
                        {formatNumber(categoriesData.totalCategories)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-revenue-categories">
                        {formatCurrency(categoriesData.totalRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Units Sold</p>
                      <p className="text-2xl font-bold" data-testid="stat-total-units-categories">
                        {formatNumber(categoriesData.totalUnitsSold)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Category Revenue Distribution</CardTitle>
                <CardDescription>
                  Market share by revenue across top categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  renderCategoriesChart()
                )}
              </CardContent>
            </Card>

            {/* Categories Table */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Detailed metrics for each product category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : hasError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive">Failed to load data. Please try again.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("category")}
                          data-testid="header-category-name"
                        >
                          <div className="flex items-center gap-2">
                            Category {getSortIcon("category")}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("revenue")}
                          data-testid="header-revenue-categories"
                        >
                          <div className="flex items-center gap-2">
                            Revenue {getSortIcon("revenue")}
                          </div>
                        </TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSort("growthRate")}
                          data-testid="header-growth-categories"
                        >
                          <div className="flex items-center gap-2">
                            Growth {getSortIcon("growthRate")}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.slice(0, 6).map((category: TopCategoryItem, index) => (
                        <TableRow key={category.category} data-testid={`row-category-${category.category.toLowerCase().replace(/\s+/g, '-')}`}>
                          <TableCell className="font-medium" data-testid={`text-category-name-${category.category.toLowerCase().replace(/\s+/g, '-')}`}>
                            {category.category}
                          </TableCell>
                          <TableCell className="font-bold text-green-600" data-testid={`text-revenue-categories-${category.category.toLowerCase().replace(/\s+/g, '-')}`}>
                            {formatCurrency(category.revenue)}
                          </TableCell>
                          <TableCell data-testid={`text-market-share-${category.category.toLowerCase().replace(/\s+/g, '-')}`}>
                            <Badge variant="outline">
                              {category.marketSharePercent !== undefined && category.marketSharePercent !== null && !isNaN(category.marketSharePercent)
                                ? `${category.marketSharePercent.toFixed(1)}%`
                                : 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-growth-categories-${category.category.toLowerCase().replace(/\s+/g, '-')}`}>
                            {renderGrowthBadge(category.growthPercent)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}