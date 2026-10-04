import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Send,
  Search,
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  RotateCcw,
  Users,
  Calendar,
  Download,
  MoreHorizontal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import AdminRoute from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";
import { KPICard, type MetricsSummary } from "@/components/admin/KPICard";
import { DashboardGrid, DashboardSection } from "@/components/admin/DashboardGrid";

// Types for notifications
interface Notification {
  id: string;
  subject: string;
  message: string;
  channels: ('email' | 'sms' | 'whatsapp')[];
  status: 'queued' | 'sending' | 'sent' | 'partially_failed' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  deliveryStats: {
    email?: {
      sent: number;
      delivered: number;
      opened: number;
      failed: number;
    };
    sms?: {
      sent: number;
      delivered: number;
      failed: number;
    };
    whatsapp?: {
      sent: number;
      delivered: number;
      read: number;
      failed: number;
    };
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface NotificationMetrics {
  totalNotifications: MetricsSummary;
  emailsSent: MetricsSummary;
  smsSent: MetricsSummary;
  whatsappSent: MetricsSummary;
  averageDeliveryRate: number;
  emailDeliveryRate: number;
  smsDeliveryRate: number;
  whatsappDeliveryRate: number;
  queuedNotifications: number;
  failedNotifications: number;
  lastUpdated: string;
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  userCount: number;
  criteria: string;
}

const bulkNotificationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message content is required"),
  channels: z.array(z.enum(['email', 'sms', 'whatsapp'])).min(1, "At least one channel is required"),
  recipientGroups: z.array(z.string()).min(1, "At least one recipient group is required"),
  scheduleAt: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

type BulkNotificationFormValues = z.infer<typeof bulkNotificationSchema>;

const CHANNEL_ICONS = {
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageCircle,
};

const CHANNEL_COLORS = {
  email: "text-blue-600",
  sms: "text-amber-600", 
  whatsapp: "text-emerald-600",
};

function AdminNotificationsContent() {
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json() as Promise<Notification[]>;
    }
  });

  // Fetch notification metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/admin/notifications/metrics'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/notifications/metrics');
      if (!response.ok) throw new Error('Failed to fetch notification metrics');
      return response.json() as Promise<NotificationMetrics>;
    }
  });

  // Fetch recipient groups
  const { data: recipientGroups } = useQuery({
    queryKey: ['/api/admin/notifications/recipient-groups'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/notifications/recipient-groups');
      if (!response.ok) throw new Error('Failed to fetch recipient groups');
      return response.json() as Promise<RecipientGroup[]>;
    }
  });

  // Send bulk notification mutation
  const sendBulkNotificationMutation = useMutation({
    mutationFn: async (data: BulkNotificationFormValues) => {
      const response = await authenticatedFetch('/api/admin/notifications/send-bulk', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send bulk notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/metrics'] });
      setIsBulkDialogOpen(false);
      toast({ title: "Bulk notification sent successfully" });
      bulkForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to send bulk notification", variant: "destructive" });
    }
  });

  // Retry failed notification mutation
  const retryNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/api/admin/notifications/${id}/retry`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to retry notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({ title: "Notification retry initiated" });
    },
    onError: () => {
      toast({ title: "Failed to retry notification", variant: "destructive" });
    }
  });

  const bulkForm = useForm<BulkNotificationFormValues>({
    resolver: zodResolver(bulkNotificationSchema),
    defaultValues: {
      subject: "",
      message: "",
      channels: [],
      recipientGroups: [],
      priority: "normal",
    },
  });

  const onBulkSubmit = (data: BulkNotificationFormValues) => {
    sendBulkNotificationMutation.mutate(data);
  };

  const handleRetry = (id: string) => {
    retryNotificationMutation.mutate(id);
  };

  const filteredNotifications = notifications?.filter(notification => {
    const matchesSearch = notification.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = !selectedChannel || notification.channels.includes(selectedChannel as any);
    const matchesStatus = !selectedStatus || notification.status === selectedStatus;
    return matchesSearch && matchesChannel && matchesStatus;
  }) || [];

  const getStatusBadge = (status: Notification['status']) => {
    const statusConfig = {
      queued: { variant: "outline" as const, label: "Queued", icon: Clock },
      sending: { variant: "secondary" as const, label: "Sending", icon: RefreshCw },
      sent: { variant: "default" as const, label: "Sent", icon: CheckCircle },
      partially_failed: { variant: "secondary" as const, label: "Partial", icon: AlertTriangle },
      failed: { variant: "destructive" as const, label: "Failed", icon: AlertTriangle },
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getChannelIcons = (channels: string[]) => {
    return channels.map((channel) => {
      const Icon = CHANNEL_ICONS[channel as keyof typeof CHANNEL_ICONS];
      const colorClass = CHANNEL_COLORS[channel as keyof typeof CHANNEL_COLORS];
      return (
        <Icon key={channel} className={`h-4 w-4 ${colorClass}`} />
      );
    });
  };

  const exportNotifications = () => {
    import('@/components/admin/ChartExportUtils').then(({ exportToCSV }) => {
      const exportData = {
        revenue: notifications?.map((notification, index) => ({
          date: notification.createdAt,
          value: notification.recipientCount,
          label: `${notification.subject} (${notification.channels.join(', ')})`
        })),
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        }
      };
      
      const success = exportToCSV(exportData, 'notifications-export.csv');
      
      if (success) {
        console.log('✅ Notifications export completed');
        toast({ title: "Export completed successfully" });
      } else {
        console.error('❌ Notifications export failed');
        toast({ title: "Export failed", variant: "destructive" });
      }
    });
  };

  const refreshAll = () => {
    refetchNotifications();
    refetchMetrics();
  };

  const isLoading = notificationsLoading || metricsLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-notifications">Notifications</h1>
          <p className="text-muted-foreground">
            Manage multi-channel notifications and delivery tracking
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportNotifications}
            disabled={!notifications}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-send-bulk">
                <Send className="h-4 w-4 mr-2" />
                Send Bulk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Send Bulk Notification</DialogTitle>
                <DialogDescription>
                  Send notifications to multiple users across different channels
                </DialogDescription>
              </DialogHeader>
              <Form {...bulkForm}>
                <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
                  <FormField
                    control={bulkForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-notification-subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} data-testid="input-notification-message" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="channels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channels</FormLabel>
                        <div className="flex flex-col space-y-2">
                          {[
                            { id: 'email', label: 'Email', icon: Mail },
                            { id: 'sms', label: 'SMS', icon: Smartphone },
                            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }
                          ].map((channel) => (
                            <div key={channel.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(channel.id as any)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), channel.id]
                                    : field.value?.filter((c) => c !== channel.id) || [];
                                  field.onChange(newValue);
                                }}
                                data-testid={`checkbox-channel-${channel.id}`}
                              />
                              <channel.icon className="h-4 w-4" />
                              <span>{channel.label}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="recipientGroups"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Groups</FormLabel>
                        <div className="flex flex-col space-y-2">
                          {recipientGroups?.map((group) => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(group.id)}
                                onCheckedChange={(checked) => {
                                  const newValue = checked
                                    ? [...(field.value || []), group.id]
                                    : field.value?.filter((g) => g !== group.id) || [];
                                  field.onChange(newValue);
                                }}
                                data-testid={`checkbox-group-${group.id}`}
                              />
                              <div>
                                <span className="font-medium">{group.name}</span>
                                <p className="text-sm text-muted-foreground">
                                  {group.description} ({group.userCount} users)
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={sendBulkNotificationMutation.isPending}
                      data-testid="button-send-notification"
                    >
                      {sendBulkNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <DashboardSection 
            title="Notification Metrics" 
            description="Key performance indicators for notification delivery"
          >
            <DashboardGrid>
              <KPICard
                title="Total Notifications"
                description="All notifications sent"
                value={metrics?.totalNotifications || { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }}
                format="number"
                icon={<Bell className="h-4 w-4" />}
                loading={metricsLoading}
                data-testid="kpi-total-notifications"
              />

              <KPICard
                title="Emails Sent"
                description="Total email notifications"
                value={metrics?.emailsSent || { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }}
                format="number"
                icon={<Mail className="h-4 w-4" />}
                loading={metricsLoading}
                data-testid="kpi-emails-sent"
              />

              <KPICard
                title="SMS Sent"
                description="Total SMS notifications"
                value={metrics?.smsSent || { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }}
                format="number"
                icon={<Smartphone className="h-4 w-4" />}
                loading={metricsLoading}
                data-testid="kpi-sms-sent"
              />

              <KPICard
                title="WhatsApp Sent"
                description="Total WhatsApp notifications"
                value={metrics?.whatsappSent || { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'stable' }}
                format="number"
                icon={<MessageCircle className="h-4 w-4" />}
                loading={metricsLoading}
                data-testid="kpi-whatsapp-sent"
              />

              <KPICard
                title="Average Delivery Rate"
                description="Overall delivery success rate"
                value={metrics?.averageDeliveryRate || 0}
                format="percentage"
                icon={<CheckCircle className="h-4 w-4" />}
                loading={metricsLoading}
                data-testid="kpi-delivery-rate"
              />

              <KPICard
                title="Failed Notifications"
                description="Notifications that failed delivery"
                value={metrics?.failedNotifications || 0}
                format="number"
                icon={<AlertTriangle className="h-4 w-4" />}
                loading={metricsLoading}
                urgency={metrics && metrics.failedNotifications > 0 ? 'high' : 'low'}
                data-testid="kpi-failed-notifications"
              />
            </DashboardGrid>
          </DashboardSection>

          {/* Channel Performance */}
          {metrics && (
            <DashboardSection 
              title="Channel Performance" 
              description="Delivery rates by communication channel"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.emailDeliveryRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Delivery Rate</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      SMS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.smsDeliveryRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Delivery Rate</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageCircle className="h-5 w-5 text-emerald-600" />
                      WhatsApp
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.whatsappDeliveryRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Delivery Rate</div>
                  </CardContent>
                </Card>
              </div>
            </DashboardSection>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                    data-testid="input-search-notifications"
                  />
                </div>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="w-40" data-testid="select-channel-filter">
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Channels</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="partially_failed">Partial</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification History ({filteredNotifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow key={notification.id} data-testid={`row-notification-${notification.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{notification.subject}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {notification.message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {getChannelIcons(notification.channels)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{notification.recipientCount} targeted</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(notification.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">{notification.successCount} success</div>
                          {notification.failureCount > 0 && (
                            <div className="text-red-600">{notification.failureCount} failed</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {notification.sentAt ? 
                            new Date(notification.sentAt).toLocaleString() : 
                            'Not sent'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`menu-notification-${notification.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem data-testid={`view-notification-${notification.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {(notification.status === 'failed' || notification.status === 'partially_failed') && (
                              <DropdownMenuItem 
                                onClick={() => handleRetry(notification.id)}
                                data-testid={`retry-notification-${notification.id}`}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Retry Failed
                              </DropdownMenuItem>
                            )}
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Analytics</CardTitle>
              <CardDescription>
                Detailed performance metrics and insights coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics charts and reports will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminNotifications() {
  return (
    <AdminRoute>
      <AdminLayout>
        <AdminNotificationsContent />
      </AdminLayout>
    </AdminRoute>
  );
}