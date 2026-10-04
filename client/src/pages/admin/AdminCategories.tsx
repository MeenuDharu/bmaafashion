import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag, Layers, Upload, X } from "lucide-react";
import type { Category } from "@shared/schema";

export default function AdminCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    mainCategory: "",
    subcategories: [] as string[],
    imageUrl: "",
  });
  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async (category: { mainCategory: string; subcategories: string[]; imageUrl?: string }) => {
      const response = await apiRequest("POST", "/api/admin/categories", category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Category created successfully" });
      setIsCreateDialogOpen(false);
      setNewCategory({ mainCategory: "", subcategories: [], imageUrl: "" });
      setSubcategoryInput("");
      setImageFile(null);
      setImagePreview("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create category",
      });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      const response = await apiRequest("PUT", `/api/admin/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Category updated successfully" });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update category",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete category",
      });
    },
  });

  const handleAddSubcategory = (isEdit = false) => {
    if (!subcategoryInput.trim()) return;

    if (isEdit && editingCategory) {
      setEditingCategory({
        ...editingCategory,
        subcategories: [...editingCategory.subcategories, subcategoryInput.trim()],
      });
    } else {
      setNewCategory({
        ...newCategory,
        subcategories: [...newCategory.subcategories, subcategoryInput.trim()],
      });
    }
    setSubcategoryInput("");
  };

  const handleRemoveSubcategory = (index: number, isEdit = false) => {
    if (isEdit && editingCategory) {
      setEditingCategory({
        ...editingCategory,
        subcategories: editingCategory.subcategories.filter((_, i) => i !== index),
      });
    } else {
      setNewCategory({
        ...newCategory,
        subcategories: newCategory.subcategories.filter((_, i) => i !== index),
      });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image file",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Image size should be less than 5MB",
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!imageFile) return null;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = localStorage.getItem("auth_token");
      const response = await fetch('/api/admin/categories/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to upload image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload image",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (editingCategory) {
      setEditingCategory({ ...editingCategory, imageUrl: "" });
    } else {
      setNewCategory({ ...newCategory, imageUrl: "" });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.mainCategory.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Main category name is required",
      });
      return;
    }

    let imageUrl = newCategory.imageUrl;
    if (imageFile) {
      imageUrl = await handleUploadImage() || "";
    }

    createMutation.mutate({ ...newCategory, imageUrl });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    let imageUrl = editingCategory.imageUrl;
    if (imageFile) {
      imageUrl = await handleUploadImage() || editingCategory.imageUrl;
    }

    updateMutation.mutate({
      id: editingCategory.id,
      data: {
        mainCategory: editingCategory.mainCategory,
        subcategories: editingCategory.subcategories,
        imageUrl,
      },
    });
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setImagePreview(category.imageUrl || "");
    setImageFile(null);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories and subcategories
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new main category with optional subcategories
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="mainCategory">Main Category Name</Label>
                <Input
                  id="mainCategory"
                  placeholder="e.g., Fashion, Accessories"
                  value={newCategory.mainCategory}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, mainCategory: e.target.value })
                  }
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="flex flex-col gap-3">
                  {imagePreview ? (
                    <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <Input
                        id="category-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, false)}
                      />
                      <Label htmlFor="category-image" className="cursor-pointer block">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload category image
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Subcategories</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add subcategory"
                    value={subcategoryInput}
                    onChange={(e) => setSubcategoryInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddSubcategory()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddSubcategory()}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newCategory.subcategories.map((sub, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {sub}
                      <button
                        onClick={() => handleRemoveSubcategory(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={createMutation.isPending || isUploading}
              >
                {isUploading ? "Uploading..." : createMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            All Categories
          </CardTitle>
          <CardDescription>
            {categories.length} {categories.length === 1 ? "category" : "categories"} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first category
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Main Category</TableHead>
                  <TableHead>Subcategories</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.mainCategory}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Tag className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.mainCategory}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.subcategories.length > 0 ? (
                          category.subcategories.map((sub, index) => (
                            <Badge key={index} variant="outline">
                              {sub}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No subcategories
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category name and subcategories
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editMainCategory">Main Category Name</Label>
                <Input
                  id="editMainCategory"
                  value={editingCategory.mainCategory}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      mainCategory: e.target.value,
                    })
                  }
                />
              </div>
              
              {/* Image Upload Section for Edit */}
              <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="flex flex-col gap-3">
                  {imagePreview ? (
                    <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <Input
                        id="edit-category-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, true)}
                      />
                      <Label htmlFor="edit-category-image" className="cursor-pointer block">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload category image
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Subcategories</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add subcategory"
                    value={subcategoryInput}
                    onChange={(e) => setSubcategoryInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddSubcategory(true)
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddSubcategory(true)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingCategory.subcategories.map((sub, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {sub}
                      <button
                        onClick={() => handleRemoveSubcategory(index, true)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateMutation.isPending || isUploading}
            >
              {isUploading ? "Uploading..." : updateMutation.isPending ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
