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
  Send,
  Eye,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Filter,
  MessageCircle,
  Activity
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";

// Types for message templates
interface MessageTemplate {
  id: string;
  name: string;
  category: 'order_confirmation' | 'order_update' | 'payment_confirmation' | 'shipping_notification' | 'delivery_notification' | 'stock_alert' | 'promotional' | 'account_notification';
  content: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  language: string;
  variables: string[];
  performance?: {
    sent: number;
    delivered: number;
    read: number;
    deliveryRate: number;
    readRate: number;
  };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.enum(['order_confirmation', 'order_update', 'payment_confirmation', 'shipping_notification', 'delivery_notification', 'stock_alert', 'promotional', 'account_notification']),
  content: z.string().min(1, "Template content is required").max(1024, "Template content must be less than 1024 characters"),
  language: z.string().min(1, "Language is required"),
  variables: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

const TEMPLATE_CATEGORIES = [
  { value: 'order_confirmation', label: 'Order Confirmation' },
  { value: 'order_update', label: 'Order Update' },
  { value: 'payment_confirmation', label: 'Payment Confirmation' },
  { value: 'shipping_notification', label: 'Shipping Notification' },
  { value: 'delivery_notification', label: 'Delivery Notification' },
  { value: 'stock_alert', label: 'Stock Alert' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'account_notification', label: 'Account Notification' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
];

function AdminMessageTemplatesContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // Fetch message templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['/api/admin/whatsapp/templates'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/whatsapp/templates');
      if (!response.ok) throw new Error('Failed to fetch message templates');
      return response.json() as Promise<MessageTemplate[]>;
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const templateData = {
        ...data,
        variables: data.variables ? data.variables.split(',').map(v => v.trim()).filter(v => v) : [],
        status: 'draft' as const,
      };

      const response = await authenticatedFetch('/api/admin/whatsapp/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp/templates'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Template created successfully" });
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: TemplateFormValues }) => {
      const templateData = {
        ...data,
        variables: data.variables ? data.variables.split(',').map(v => v.trim()).filter(v => v) : [],
      };

      const response = await authenticatedFetch(`/api/admin/whatsapp/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp/templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      toast({ title: "Template updated successfully" });
      editForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/api/admin/whatsapp/templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp/templates'] });
      toast({ title: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  });

  // Approve template mutation
  const approveTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/api/admin/whatsapp/templates/${id}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp/templates'] });
      toast({ title: "Template approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve template", variant: "destructive" });
    }
  });

  // Reject template mutation
  const rejectTemplateMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const response = await authenticatedFetch(`/api/admin/whatsapp/templates/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to reject template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp/templates'] });
      toast({ title: "Template rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject template", variant: "destructive" });
    }
  });

  const createForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      category: "order_confirmation",
      content: "",
      language: "en",
      variables: "",
    },
  });

  const editForm = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
  });

  const onCreateSubmit = (data: TemplateFormValues) => {
    createTemplateMutation.mutate(data);
  };

  const onEditSubmit = (data: TemplateFormValues) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    editForm.reset({
      name: template.name,
      category: template.category,
      content: template.content,
      language: template.language,
      variables: template.variables.join(', '),
    });
    setIsEditDialogOpen(true);
  };

  const handlePreview = (template: MessageTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleApprove = (id: string) => {
    approveTemplateMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (reason) {
      rejectTemplateMutation.mutate({ id, reason });
    }
  };

  const handleCopyTemplate = (template: MessageTemplate) => {
    createForm.reset({
      name: `${template.name} (Copy)`,
      category: template.category,
      content: template.content,
      language: template.language,
      variables: template.variables.join(', '),
    });
    setIsCreateDialogOpen(true);
  };

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesStatus = !selectedStatus || template.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const getStatusBadge = (status: MessageTemplate['status']) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Draft" },
      pending_approval: { variant: "outline" as const, label: "Pending Approval" },
      approved: { variant: "default" as const, label: "Approved" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    return TEMPLATE_CATEGORIES.find(cat => cat.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Message Templates</h1>
            <p className="text-muted-foreground">Manage WhatsApp message templates</p>
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-message-templates">Message Templates</h1>
          <p className="text-muted-foreground">Manage WhatsApp message templates and their approval status</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create Message Template</DialogTitle>
              <DialogDescription>
                Create a new WhatsApp message template
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
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-template-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-template-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TEMPLATE_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-template-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUAGES.map((language) => (
                              <SelectItem key={language.value} value={language.value}>
                                {language.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="variables"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variables (comma-separated)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., customerName, orderNumber" data-testid="input-template-variables" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Content</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} data-testid="input-template-content" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createTemplateMutation.isPending}
                    data-testid="button-save-template"
                  >
                    {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
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
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                data-testid="input-search-templates"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Templates ({filteredTemplates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {template.content}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {LANGUAGES.find(lang => lang.value === template.language)?.label}
                        </Badge>
                        {template.variables.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {template.variables.length} variables
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getCategoryLabel(template.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(template.status)}
                  </TableCell>
                  <TableCell>
                    {template.performance ? (
                      <div className="text-sm">
                        <div>Sent: {template.performance.sent.toLocaleString()}</div>
                        <div className="text-muted-foreground">
                          Delivery: {template.performance.deliveryRate.toFixed(1)}% • 
                          Read: {template.performance.readRate.toFixed(1)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No data</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`menu-template-${template.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(template)} data-testid={`preview-template-${template.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(template)} data-testid={`edit-template-${template.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyTemplate(template)} data-testid={`copy-template-${template.id}`}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        {template.status === 'pending_approval' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(template.id)} data-testid={`approve-template-${template.id}`}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(template.id)} data-testid={`reject-template-${template.id}`}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive"
                          data-testid={`delete-template-${template.id}`}
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update template information
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
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEMPLATE_CATEGORIES.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((language) => (
                            <SelectItem key={language.value} value={language.value}>
                              {language.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="variables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variables (comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., customerName, orderNumber" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Content</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateTemplateMutation.isPending}
                  data-testid="button-update-template"
                >
                  {updateTemplateMutation.isPending ? "Updating..." : "Update Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of how this template will appear
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{previewTemplate.name}</h4>
                <p className="text-sm text-muted-foreground">{getCategoryLabel(previewTemplate.category)} • {LANGUAGES.find(lang => lang.value === previewTemplate.language)?.label}</p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="whitespace-pre-wrap">{previewTemplate.content}</p>
              </div>
              {previewTemplate.variables.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">Variables:</h5>
                  <div className="flex flex-wrap gap-1">
                    {previewTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminMessageTemplates() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminMessageTemplatesContent />
      </AdminLayout>
    </AdminRoute>
  );
}