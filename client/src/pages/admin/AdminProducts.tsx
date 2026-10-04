import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package,
  Filter,
  MoreHorizontal,
  Upload,
  X,
  Image as ImageIcon
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import type { Product, Category } from "@shared/schema";

// Preset unit options
const UNIT_OPTIONS = [
  "per piece",
  "per bunch",
  "per 50g",
  "per 100g",
  "per 250g",
  "per 500g",
  "per kg",
  "per tray",
  "per pack",
  "per bag",
  "per unit",
];

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  unit: z.string().min(1, "Unit is required"),
  size: z.string().optional(),
  mainCategory: z.string().min(1, "Main category is required"),
  category: z.string().min(1, "Category is required"),
  images: z.string().min(1, "At least one image URL is required"),
  specifications: z.string(),
  planterCount: z.string().optional(),
  dimensions: z.string().optional(),
  cultivableCrops: z.string().optional(),
  structureMaterial: z.string().optional(),
  inStock: z.string().min(1, "Stock quantity is required"),
  lowStockThreshold: z.string().optional(),
  reorderPoint: z.string().optional(),
  maxStock: z.string().optional(),
  sku: z.string().optional(),
  supplier: z.string().optional(),
  costPrice: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function AdminProductsContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [isEditingNewCategory, setIsEditingNewCategory] = useState(false);
  const [previousCreateCategory, setPreviousCreateCategory] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingEditImages, setUploadingEditImages] = useState(false);
  
  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<Product[]>;
    }
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as Promise<Category[]>;
    }
  });

  // Build MAIN_CATEGORIES structure from fetched categories
  const MAIN_CATEGORIES = categories?.reduce((acc, cat) => {
    acc[cat.mainCategory] = cat.subcategories;
    return acc;
  }, {} as Record<string, string[]>) || {};

  // Get all unique subcategories from backend categories
  const allSubcategories = Array.from(
    new Set(
      categories?.flatMap(cat => cat.subcategories) || []
    )
  ).sort();

  console.log('📊 Categories from backend:', categories);
  console.log('📊 All subcategories:', allSubcategories);

  // Handle image upload
  const handleImageUpload = async (files: FileList | null, isEdit: boolean = false) => {
    if (!files || files.length === 0) return;

    const form = isEdit ? editForm : createForm;
    const setUploading = isEdit ? setUploadingEditImages : setUploadingImages;

    // Validate files before uploading
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (exceeds 10MB)`);
      }
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (invalid type, must be JPEG, PNG, or WebP)`);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files detected",
        description: invalidFiles.join(', '),
        variant: "destructive"
      });
      return;
    }

    if (files.length > 5) {
      toast({
        title: "Too many files",
        description: "You can upload up to 5 images at once",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await authenticatedFetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload images');
      }

      const data = await response.json();
      
      // Add new image URLs to existing ones
      const currentImages = form.getValues('images');
      const existingUrls = currentImages ? currentImages.split('\n').filter(url => url.trim()) : [];
      const newUrls = [...existingUrls, ...data.imageUrls];
      form.setValue('images', newUrls.join('\n'));

      toast({
        title: "Images uploaded successfully",
        description: `${data.count} image(s) uploaded`
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Failed to upload images",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove an image URL from the list and delete file if it's a local upload
  const handleRemoveImageUrl = async (urlToRemove: string, isEdit: boolean = false) => {
    const form = isEdit ? editForm : createForm;
    
    // Only delete the file from server if it's a local upload (starts with /api/images/product-images/)
    if (urlToRemove.includes('/api/images/product-images/')) {
      try {
        const response = await authenticatedFetch('/api/admin/products/delete-image', {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl: urlToRemove }),
        });

        if (!response.ok) {
          console.warn('Failed to delete image file from server:', urlToRemove);
          // Continue with removing from UI even if server deletion fails
        }
      } catch (error) {
        console.error('Error deleting image file:', error);
        // Continue with removing from UI even if server deletion fails
      }
    }

    // Remove from the form field
    const currentImages = form.getValues('images');
    const urls = currentImages.split('\n').filter(url => url.trim() && url !== urlToRemove);
    form.setValue('images', urls.join('\n'));
  };

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const productData = {
        ...data,
        price: data.price,
        images: data.images ? data.images.split('\n').map(url => url.trim()).filter(url => url) : [], // Transform multiple image URLs to array
        specifications: data.specifications ? data.specifications.split('\n').filter(s => s.trim()) : [],
        planterCount: data.planterCount ? parseInt(data.planterCount) : null,
        inStock: parseInt(data.inStock),
        lowStockThreshold: data.lowStockThreshold ? parseInt(data.lowStockThreshold) : 5,
        reorderPoint: data.reorderPoint ? parseInt(data.reorderPoint) : 10,
        maxStock: data.maxStock ? parseInt(data.maxStock) : 100,
        costPrice: data.costPrice || null,
      };
      console.log('📦 CREATE PRODUCT - Form data:', data);
      console.log('📦 CREATE PRODUCT - Sending to backend:', productData);

      const response = await authenticatedFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsCreateDialogOpen(false);
      setIsCreatingNewCategory(false);
      setPreviousCreateCategory("");
      toast({ title: "Product created successfully" });
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: ProductFormValues }) => {
      const productData = {
        ...data,
        price: data.price,
        images: data.images ? data.images.split('\n').map(url => url.trim()).filter(url => url) : [], // Transform multiple image URLs to array
        specifications: data.specifications ? data.specifications.split('\n').filter(s => s.trim()) : [],
        planterCount: data.planterCount ? parseInt(data.planterCount) : null,
        inStock: parseInt(data.inStock),
        lowStockThreshold: data.lowStockThreshold ? parseInt(data.lowStockThreshold) : 5,
        reorderPoint: data.reorderPoint ? parseInt(data.reorderPoint) : 10,
        maxStock: data.maxStock ? parseInt(data.maxStock) : 100,
        costPrice: data.costPrice || null,
      };
      console.log('📝 UPDATE PRODUCT - Form data:', data);
      console.log('📝 UPDATE PRODUCT - Sending to backend:', productData);

      const response = await authenticatedFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setIsEditingNewCategory(false);
      toast({ title: "Product updated successfully" });
      editForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: "Product deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    }
  });

  const createForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      unit: "per unit",
      mainCategory: "Kits",
      category: "",
      images: "",
      specifications: "",
      planterCount: "",
      dimensions: "",
      cultivableCrops: "",
      structureMaterial: "",
      inStock: "0",
      lowStockThreshold: "5",
      reorderPoint: "10",
      maxStock: "100",
      sku: "",
      supplier: "",
      costPrice: "",
    },
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
  });

  const onCreateSubmit = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };

  const onEditSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditingNewCategory(false);
    editForm.reset({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      unit: product.unit || "per unit",
      size: (product as any).size || "",
      mainCategory: product.mainCategory || "Kits",
      category: product.category,
      images: product.images?.join('\n') || '',
      specifications: product.specifications?.join('\n') || "",
      planterCount: product.planterCount?.toString() || "",
      dimensions: product.dimensions || "",
      cultivableCrops: product.cultivableCrops || "",
      structureMaterial: product.structureMaterial || "",
      inStock: product.inStock.toString(),
      lowStockThreshold: product.lowStockThreshold?.toString() || "5",
      reorderPoint: product.reorderPoint?.toString() || "10",
      maxStock: product.maxStock?.toString() || "100",
      sku: product.sku || "",
      supplier: product.supplier || "",
      costPrice: product.costPrice?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  if (isLoading || categoriesLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" data-testid="heading-admin-products">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setIsCreatingNewCategory(false);
            setPreviousCreateCategory("");
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-product">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your catalog
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="mainCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Category</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            createForm.setValue("category", "");
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-main-category">
                              <SelectValue placeholder="Select main category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.keys(MAIN_CATEGORIES).map(mainCat => (
                              <SelectItem key={mainCat} value={mainCat}>{mainCat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => {
                      const selectedMainCategory = createForm.watch("mainCategory");
                      const availableCategories = selectedMainCategory && MAIN_CATEGORIES[selectedMainCategory as keyof typeof MAIN_CATEGORIES] 
                        ? MAIN_CATEGORIES[selectedMainCategory as keyof typeof MAIN_CATEGORIES]
                        : [];
                      
                      return (
                      <FormItem>
                        <FormLabel>Sub-Category</FormLabel>
                        {isCreatingNewCategory ? (
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter new category name"
                                data-testid="input-new-category"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsCreatingNewCategory(false);
                                field.onChange(previousCreateCategory);
                              }}
                              data-testid="button-cancel-new-category"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Select 
                            onValueChange={(value) => {
                              if (value === "__create_new__") {
                                setPreviousCreateCategory(field.value || "");
                                setIsCreatingNewCategory(true);
                                field.onChange("");
                              } else {
                                field.onChange(value);
                              }
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-product-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableCategories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                              <SelectItem value="__create_new__" data-testid="option-create-new-category">
                                + Create new category...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={createForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} data-testid="input-product-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-unit">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNIT_OPTIONS.map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., S, M, L, XL or 32, 34, 36" data-testid="input-product-size" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="inStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-product-stock" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-product-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="images"
                  render={({ field }) => {
                    const imageUrls = field.value ? field.value.split('\n').filter(url => url.trim()) : [];
                    return (
                      <FormItem>
                        <FormLabel>Product Images</FormLabel>
                        <div className="space-y-4">
                          {/* Image Upload Button */}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingImages}
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                                input.multiple = true;
                                input.onchange = (e) => {
                                  const target = e.target as HTMLInputElement;
                                  handleImageUpload(target.files, false);
                                };
                                input.click();
                              }}
                              data-testid="button-upload-product-images"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {uploadingImages ? 'Uploading...' : 'Upload Images'}
                            </Button>
                            <span className="text-sm text-muted-foreground self-center">
                              or enter URLs below (up to 5 images, 10MB each)
                            </span>
                          </div>

                          {/* Image Previews */}
                          {imageUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {imageUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={url}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-24 object-cover rounded border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveImageUrl(url, false)}
                                    data-testid={`button-remove-image-${index}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Manual URL Input */}
                          <FormControl>
                            <Textarea 
                              {...field} 
                              data-testid="input-product-images"
                              placeholder="Or paste image URLs (one per line)"
                              rows={3}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createProductMutation.isPending}
                    data-testid="button-save-product"
                  >
                    {createProductMutation.isPending ? "Creating..." : "Create Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                data-testid="input-search-products"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
              data-testid="select-category-filter"
            >
              <option value="">All Sub-Categories</option>
              {allSubcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || '/placeholder-image.jpg'}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell>₹{parseFloat(product.price.toString()).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <span data-testid={`stock-${product.id}`}>{product.inStock}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={product.inStock === 0 ? "destructive" : 
                              product.inStock <= (product.lowStockThreshold || 5) ? "secondary" : "default"}
                    >
                      {product.inStock === 0 ? "Out of Stock" : 
                       product.inStock <= (product.lowStockThreshold || 5) ? "Low Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`menu-product-${product.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(product)} data-testid={`edit-product-${product.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                          data-testid={`delete-product-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setIsEditingNewCategory(false);
          setEditingProduct(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="mainCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main Category</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          editForm.setValue("category", "");
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-main-category">
                            <SelectValue placeholder="Select main category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(MAIN_CATEGORIES).map(mainCat => (
                            <SelectItem key={mainCat} value={mainCat}>{mainCat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => {
                    const selectedMainCategory = editForm.watch("mainCategory");
                    const availableCategories = selectedMainCategory && MAIN_CATEGORIES[selectedMainCategory as keyof typeof MAIN_CATEGORIES] 
                      ? MAIN_CATEGORIES[selectedMainCategory as keyof typeof MAIN_CATEGORIES]
                      : [];
                    
                    return (
                    <FormItem>
                      <FormLabel>Sub-Category</FormLabel>
                      {isEditingNewCategory ? (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter new category name"
                              data-testid="input-edit-new-category"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingNewCategory(false);
                              field.onChange(editingProduct?.category || "");
                            }}
                            data-testid="button-cancel-edit-new-category"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Select 
                          onValueChange={(value) => {
                            if (value === "__create_new__") {
                              setIsEditingNewCategory(true);
                              field.onChange("");
                            } else {
                              field.onChange(value);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-product-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                            <SelectItem value="__create_new__" data-testid="option-edit-create-new-category">
                              + Create new category...
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                    );
                    }}
                  />
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIT_OPTIONS.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., S, M, L, XL or 32, 34, 36" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="inStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="images"
                render={({ field }) => {
                  const imageUrls = field.value ? field.value.split('\n').filter(url => url.trim()) : [];
                  return (
                    <FormItem>
                      <FormLabel>Product Images</FormLabel>
                      <div className="space-y-4">
                        {/* Image Upload Button */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingEditImages}
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
                              input.multiple = true;
                              input.onchange = (e) => {
                                const target = e.target as HTMLInputElement;
                                handleImageUpload(target.files, true);
                              };
                              input.click();
                            }}
                            data-testid="button-upload-edit-product-images"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingEditImages ? 'Uploading...' : 'Upload Images'}
                          </Button>
                          <span className="text-sm text-muted-foreground self-center">
                            or enter URLs below (up to 5 images, 10MB each)
                          </span>
                        </div>

                        {/* Image Previews */}
                        {imageUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {imageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Product ${index + 1}`}
                                  className="w-full h-24 object-cover rounded border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemoveImageUrl(url, true)}
                                  data-testid={`button-remove-edit-image-${index}`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Manual URL Input */}
                        <FormControl>
                          <Textarea 
                            {...field} 
                            data-testid="input-edit-product-images"
                            placeholder="Or paste image URLs (one per line)"
                            rows={3}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateProductMutation.isPending}
                  data-testid="button-update-product"
                >
                  {updateProductMutation.isPending ? "Updating..." : "Update Product"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminProducts() {
  return (
    <AdminRoute>
      <AdminProductsContent />
    </AdminRoute>
  );
}