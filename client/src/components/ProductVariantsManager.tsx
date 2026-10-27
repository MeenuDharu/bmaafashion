import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import type { ProductVariant } from "@shared/schema";

interface ProductVariantsManagerProps {
  productId: string;
  productName: string;
  basePrice: string;
}

interface VariantFormData {
  color: string;
  size: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  lowStockThreshold: string;
  weight: string;
  shippingChargeApplicable: boolean;
  shippingCharge: string;
  images: string;
  isActive: boolean;
  sortOrder: string;
  sku: string;
}

export default function ProductVariantsManager({
  productId,
  productName,
  basePrice,
}: ProductVariantsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState<VariantFormData>({
    color: "",
    size: "",
    price: basePrice,
    compareAtPrice: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
    weight: "",
    shippingChargeApplicable: false,
    shippingCharge: "0",
    images: "",
    isActive: true,
    sortOrder: "0",
    sku: "",
  });

  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // Fetch variants for this product
  const { data: variants = [], isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}/variants`],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/variants`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch variants");
      }
      return response.json() as Promise<ProductVariant[]>;
    },
    retry: false,
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (data: VariantFormData) => {
      const response = await authenticatedFetch(
        `/api/admin/products/${productId}/variants`,
        {
          method: "POST",
          body: JSON.stringify({
            color: data.color || null,
            size: data.size || null,
            price: data.price,
            compareAtPrice: data.compareAtPrice || null,
            stockQuantity: parseInt(data.stockQuantity, 10),
            lowStockThreshold: parseInt(data.lowStockThreshold, 10),
            weight: data.weight || null,
            shippingChargeApplicable: data.shippingChargeApplicable,
            shippingCharge: data.shippingCharge || "0",
            images: data.images.split("\n").map((image) => image.trim()).filter(Boolean),
            isActive: data.isActive,
            sortOrder: parseInt(data.sortOrder || "0", 10),
            sku: data.sku || null,
          }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create variant");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/variants`] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({ title: "Variant created successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create variant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async ({
      variantId,
      data,
    }: {
      variantId: string;
      data: VariantFormData;
    }) => {
      const response = await authenticatedFetch(
        `/api/admin/products/variants/${variantId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            color: data.color || null,
            size: data.size || null,
            price: data.price,
            compareAtPrice: data.compareAtPrice || null,
            stockQuantity: parseInt(data.stockQuantity, 10),
            lowStockThreshold: parseInt(data.lowStockThreshold, 10),
            weight: data.weight || null,
            shippingChargeApplicable: data.shippingChargeApplicable,
            shippingCharge: data.shippingCharge || "0",
            images: data.images.split("\n").map((image) => image.trim()).filter(Boolean),
            isActive: data.isActive,
            sortOrder: parseInt(data.sortOrder || "0", 10),
            sku: data.sku || null,
          }),
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error || "Failed to update variant");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/variants`] });
      setEditingVariant(null);
      toast({ title: "Variant updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update variant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const response = await authenticatedFetch(
        `/api/admin/products/variants/${variantId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete variant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/variants`] });
      toast({ title: "Variant deleted successfully" });
    },
    onError: () => {
      toast({
        title: "Failed to delete variant",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      color: "", size: "", price: basePrice, compareAtPrice: "", stockQuantity: "0",
      lowStockThreshold: "5", weight: "", shippingChargeApplicable: false,
      shippingCharge: "0", images: "", isActive: true, sortOrder: "0", sku: "",
    });
  };

  const startEditingVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      color: variant.color || "",
      size: variant.size || "",
      price: String(variant.price ?? basePrice),
      compareAtPrice: String(variant.compareAtPrice ?? ""),
      stockQuantity: String(variant.stockQuantity ?? 0),
      lowStockThreshold: String(variant.lowStockThreshold ?? 5),
      weight: String(variant.weight ?? ""),
      shippingChargeApplicable: Boolean(variant.shippingChargeApplicable),
      shippingCharge: String(variant.shippingCharge ?? "0"),
      images: Array.isArray(variant.images) ? variant.images.join("\n") : "",
      isActive: Boolean(variant.isActive),
      sortOrder: String(variant.sortOrder ?? 0),
      sku: variant.sku || "",
    });
  };

  const handleSaveVariant = () => {
    if (!formData.color && !formData.size) {
      toast({ title: "Validation Error", description: "Please provide at least a color or size", variant: "destructive" });
      return;
    }
    if (!formData.price || Number(formData.price) <= 0 || Number(formData.stockQuantity) < 0 || Number(formData.lowStockThreshold) < 0 || Number(formData.shippingCharge) < 0) {
      toast({ title: "Validation Error", description: "Check price, stock, threshold and shipping charge values", variant: "destructive" });
      return;
    }
    if (editingVariant) updateVariantMutation.mutate({ variantId: editingVariant.id, data: formData });
  };

  const handleAddVariant = () => {
    // Validate required fields
    if (!formData.color && !formData.size) {
      toast({
        title: "Validation Error",
        description: "Please provide at least a color or size",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid price",
        variant: "destructive",
      });
      return;
    }

    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid stock quantity",
        variant: "destructive",
      });
      return;
    }

    createVariantMutation.mutate(formData);
  };

  const handleUpdateStock = (variant: ProductVariant, newStock: string) => {
    // Keep the existing full-variant update contract while changing only stock.
    updateVariantMutation.mutate({
      variantId: variant.id,
      data: {
        color: variant.color || "",
        size: variant.size || "",
        price: String(variant.price ?? basePrice),
        compareAtPrice: String(variant.compareAtPrice ?? ""),
        stockQuantity: newStock,
        lowStockThreshold: String(variant.lowStockThreshold ?? 5),
        weight: String(variant.weight ?? ""),
        shippingChargeApplicable: Boolean(variant.shippingChargeApplicable),
        shippingCharge: String(variant.shippingCharge ?? "0"),
        images: Array.isArray(variant.images) ? variant.images.join("\n") : "",
        isActive: Boolean(variant.isActive),
        sortOrder: String(variant.sortOrder ?? 0),
        sku: variant.sku || "",
      },
    });
  };

  const handleDelete = (variantId: string) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      deleteVariantMutation.mutate(variantId);
    }
  };

  // Calculate total stock across all variants
  const totalStock = variants.reduce(
    (sum, variant) => sum + (variant.stockQuantity || 0),
    0
  );

  // Auto-generate SKU
  const generateSKU = () => {
    const colorPart = formData.color ? formData.color.substring(0, 3).toUpperCase() : "XXX";
    const sizePart = formData.size ? formData.size.toUpperCase() : "XX";
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${colorPart}-${sizePart}-${randomPart}`;
  };

  if (isLoading) {
    return <div className="p-4">Loading variants...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Variants</h3>
        <p className="text-red-600 text-sm mb-3">
          {error instanceof Error ? error.message : "Failed to load variants"}
        </p>
        <p className="text-red-600 text-sm">
          <strong>Note:</strong> If you see "relation does not exist" error, you need to run the database migration:
        </p>
        <code className="block mt-2 p-2 bg-red-100 rounded text-xs">
          npm run db:push
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <p className="text-sm text-muted-foreground">
            Manage color and size combinations with individual stock levels
          </p>
        </div>
        <Button type="button" onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {variants.length > 0 ? (
        <>
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Stock Across All Variants:</span>
              <Badge variant="default" className="text-lg px-4 py-1">
                {totalStock} units
              </Badge>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell>
                      {variant.color ? (
                        <Badge variant="outline">{variant.color}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {variant.size ? (
                        <Badge variant="outline">{variant.size}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {variant.sku || "-"}
                    </TableCell>
                    <TableCell>₹{parseFloat(variant.price || "0").toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{variant.stockQuantity}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          variant.stockQuantity === 0
                            ? "destructive"
                            : variant.stockQuantity <= (variant.lowStockThreshold || 5)
                            ? "secondary"
                            : "default"
                        }
                      >
                        {variant.stockQuantity === 0
                          ? "Out of Stock"
                          : variant.stockQuantity <= (variant.lowStockThreshold || 5)
                          ? "Low Stock"
                          : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => startEditingVariant(variant)} title="Edit all variant fields">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(variant.id)} title="Delete variant">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No variants created yet. Add variants to manage stock by color and size.
          </p>
          <Button type="button" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Variant
          </Button>
        </div>
      )}

      {/* Add Variant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Variant</DialogTitle>
            <DialogDescription>
              Create a new variant for {productName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g., Red, Blue"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  placeholder="e.g., S, M, L, XL"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQuantity: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sku">SKU (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  placeholder="e.g., RED-M-001"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData({ ...formData, sku: generateSKU() })
                  }
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="compareAtPrice">Compare-at Price (₹)</Label><Input id="compareAtPrice" type="number" min="0" step="0.01" value={formData.compareAtPrice} onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })} /></div>
              <div><Label htmlFor="lowStockThreshold">Low Stock Threshold</Label><Input id="lowStockThreshold" type="number" min="0" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })} /></div>
              <div><Label htmlFor="weight">Weight</Label><Input id="weight" type="number" min="0" step="0.01" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} /></div>
              {/* Temporarily hidden: shipping charge and display order fields. Data and logic are preserved. */}
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {/* Temporarily hidden: shipping charge applicability checkbox. Shipping logic is preserved. */}
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Active variant</label>
            </div>
            {/* Temporarily hidden: variant images field. Existing image data and logic are preserved. */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddVariant}
              disabled={createVariantMutation.isPending}
            >
              {createVariantMutation.isPending ? "Creating..." : "Create Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingVariant)} onOpenChange={(open) => { if (!open) setEditingVariant(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product Variant</DialogTitle>
            <DialogDescription>Edit all available fields for {productName}. Changes to stock will synchronize the parent product stock.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="edit-color">Color</Label><Input id="edit-color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} /></div>
              <div><Label htmlFor="edit-size">Size</Label><Input id="edit-size" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} /></div>
              <div><Label htmlFor="edit-price">Price (₹)</Label><Input id="edit-price" type="number" min="0.01" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
              <div><Label htmlFor="edit-compare-price">Compare-at Price (₹)</Label><Input id="edit-compare-price" type="number" min="0" step="0.01" value={formData.compareAtPrice} onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })} /></div>
              <div><Label htmlFor="edit-stock">Stock Quantity</Label><Input id="edit-stock" type="number" min="0" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} /></div>
              <div><Label htmlFor="edit-threshold">Low Stock Threshold</Label><Input id="edit-threshold" type="number" min="0" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })} /></div>
              <div><Label htmlFor="edit-sku">SKU</Label><Input id="edit-sku" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
              <div><Label htmlFor="edit-weight">Weight</Label><Input id="edit-weight" type="number" min="0" step="0.01" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} /></div>
              {/* Temporarily hidden: shipping charge and display order fields. Data and logic are preserved. */}
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {/* Temporarily hidden: shipping charge applicability checkbox. Shipping logic is preserved. */}
              <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} /> Active variant</label>
            </div>
            {/* Temporarily hidden: variant images field. Existing image data and logic are preserved. */}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingVariant(null)}>Cancel</Button>
            <Button type="button" onClick={handleSaveVariant} disabled={updateVariantMutation.isPending}>{updateVariantMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
