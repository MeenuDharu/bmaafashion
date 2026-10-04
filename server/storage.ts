import {
  users,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  orderStatusHistory,
  userAddresses,
  wishlists,
  productReviews,
  reviewHelpfulVotes,
  supportTickets,
  inventoryHistory,
  bulkOperations,
  stockAlerts,
  passwordResetTokens,
  emailVerificationTokens,
  notifications,
  userPreferences,
  emailQueue,
  emailPreferences,
  emailRateLimits,
  smsQueue,
  smsPreferences,
  smsRateLimits,
  smsDeliveryLogs,
  whatsappQueue,
  whatsappPreferences,
  whatsappRateLimits,
  whatsappDeliveryLogs,
  messageTemplates,
  notificationHistory,
  recipientGroups,
  customerCommunicationHistory,
  customerProfileAuditLog,
  customerAnalyticsCache,
  customerNotes,
  siteSettings,
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderStatusHistory,
  type InsertOrderStatusHistory,
  type UserAddress,
  type InsertUserAddress,
  type Wishlist,
  type InsertWishlist,
  type ProductReview,
  type InsertProductReview,
  type ReviewHelpfulVote,
  type InsertReviewHelpfulVote,
  type SupportTicket,
  type InsertSupportTicket,
  type InventoryHistory,
  type InsertInventoryHistory,
  type StockAlert,
  type InsertStockAlert,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type Notification,
  type InsertNotification,
  type UserPreferences,
  type InsertUserPreferences,
  type EmailQueue,
  type InsertEmailQueue,
  type EmailPreferences,
  type InsertEmailPreferences,
  type EmailRateLimits,
  type InsertEmailRateLimits,
  type SmsQueue,
  type InsertSmsQueue,
  type SmsPreferences,
  type InsertSmsPreferences,
  type SmsRateLimits,
  type InsertSmsRateLimits,
  type SmsDeliveryLogs,
  type InsertSmsDeliveryLogs,
  type WhatsappQueue,
  type InsertWhatsappQueue,
  type WhatsappPreferences,
  type InsertWhatsappPreferences,
  type WhatsappRateLimits,
  type InsertWhatsappRateLimits,
  type WhatsappDeliveryLogs,
  type InsertWhatsappDeliveryLogs,
  type MessageTemplate,
  type InsertMessageTemplate,
  type NotificationHistory,
  type InsertNotificationHistory,
  type RecipientGroup,
  type InsertRecipientGroup,
  type WhatsappAnalytics,
  type NotificationMetrics,
  type BulkNotificationRequest,
  type BulkNotificationResult,
  type SiteSettings,
  type InsertSiteSettings,
  type ChangePassword,
  type UpdateUserPreferences,
  type AdminOverviewMetrics,
  type RevenueAnalytics,
  type OrderAnalytics,
  type CustomerAnalytics,
  type TopProducts,
  type LowStockInventory,
  type MetricsDateRange,
  type TopProductsQuery,
  type RevenueQuery,
  type OrderAnalyticsQuery,
  type CustomerAnalyticsQuery,
  type LowStockQuery,
  type TopProductsByRevenue,
  type TopProductsByUnits,
  type TopCategories,
  type TopProductsByRevenueQuery,
  type TopProductsByUnitsQuery,
  type TopCategoriesQuery,
  type AdminOrdersQuery,
  type OrderStatusUpdate,
  type AdminOrdersList,
  type AdminOrderDetail,
  type OrderStatusHistoryItem,
  type AdminBulkAdjustment,
  type InventoryOverviewQuery,
  type LowStockAlertsQuery,
  type InventoryAuditQuery,
  type CsvUpload,
  type InventoryExport,
  type InventoryOverviewResponse,
  type LowStockAlertsResponse,
  type InventoryAuditResponse,
  type BulkOperationStatus,
  type BulkOperation,
  type InsertBulkOperation,
  type CustomerCommunicationHistory,
  type CustomerProfileAuditLog,
  type CustomerAnalyticsCache,
  type CustomerNotes,
  type InsertCustomerCommunicationHistory,
  type InsertCustomerProfileAuditLog,
  type InsertCustomerAnalyticsCache,
  type InsertCustomerNotes,
  type CustomersListQuery,
  type CustomerDetail,
  type CustomersListResponse,
  type CustomerAnalyticsResponse,
  type CustomerCommunication,
  type CustomerProfileUpdate,
  type CustomerExport,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, ilike, desc, asc, and, or, sql, lte } from "drizzle-orm";
import { hashToken } from "./jwtAuth";
import crypto from "crypto";

export interface IStorage {
  // User operations - JWT Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // User address operations
  getUserAddresses(userId: string): Promise<UserAddress[]>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(userId: string, id: string, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined>;
  deleteUserAddress(userId: string, id: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryByName(mainCategory: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;
  
  // Cart operations
  getCartItems(sessionId?: string, userId?: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(sessionId?: string, userId?: string): Promise<void>;
  clearCartForUser(userId: string): Promise<void>;
  
  // Cart persistence and synchronization operations
  syncCartItems(userId: string, localCartItems: Array<{productId: string; quantity: number}>): Promise<CartItem[]>;
  mergeGuestCartToUser(sessionId: string, userId: string): Promise<CartItem[]>;
  setCartItemExpiration(userId?: string, sessionId?: string): Promise<void>;
  getExpiredCartItems(beforeDate?: Date): Promise<CartItem[]>;
  cleanupExpiredCarts(): Promise<number>;
  upsertCartItem(item: InsertCartItem): Promise<CartItem>;
  getCartItemByProduct(userId: string | null, sessionId: string | null, productId: string, size?: string | null): Promise<CartItem | undefined>;
  updateCartItemTimestamp(id: string): Promise<CartItem | undefined>;
  getCartWithProducts(userId?: string, sessionId?: string): Promise<Array<CartItem & { product: Product | null }>>;
  
  // Wishlist operations
  getWishlist(userId: string): Promise<Wishlist[]>;
  addToWishlist(item: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
  isInWishlist(userId: string, productId: string): Promise<boolean>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  createSecureOrder(orderData: any, items: any[], userId: string | null): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrders(userId?: string): Promise<Order[]>;
  getOrdersByEmail(email: string): Promise<Order[]>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<Order | undefined>;
  updateOrderRazorpayDetails(id: string, details: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paymentMethod?: string;
  }): Promise<Order | undefined>;
  linkOrderToUser(orderId: string, userId: string): Promise<Order | undefined>;
  
  // Admin Orders Management (Task 15f)
  getAdminOrders(query: AdminOrdersQuery): Promise<AdminOrdersList>;
  getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | undefined>;
  updateOrderStatusWithHistory(orderId: string, update: OrderStatusUpdate, adminUserId: string): Promise<Order | undefined>;
  getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryItem[]>;
  createOrderStatusHistory(history: InsertOrderStatusHistory): Promise<OrderStatusHistory>;
  validateStatusTransition(fromStatus: string, toStatus: string): boolean;
  getOrderSummaryStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }>;
  exportOrdersData(query: AdminOrdersQuery): Promise<any[]>;
  bulkUpdateOrderStatus(orderIds: string[], status: string, adminUserId: string, reason?: string): Promise<Order[]>;
  
  // Review operations
  getProductReviews(productId: string): Promise<ProductReview[]>;
  getReviewById(reviewId: string): Promise<ProductReview | undefined>;
  createReview(review: InsertProductReview): Promise<ProductReview>;
  updateReview(id: string, review: Partial<InsertProductReview>): Promise<ProductReview | undefined>;
  deleteReview(id: string): Promise<void>;
  getProductRating(productId: string): Promise<{ averageRating: number; totalReviews: number }>;
  
  // Helpful votes operations  
  addHelpfulVote(reviewId: string, userId: string): Promise<ReviewHelpfulVote>;
  removeHelpfulVote(reviewId: string, userId: string): Promise<void>;
  hasUserVotedHelpful(reviewId: string, userId: string): Promise<boolean>;
  getHelpfulVoteCount(reviewId: string): Promise<number>;
  
  // Support operations
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTickets(userId?: string): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  
  // Inventory management operations
  getInventoryHistory(productId?: string): Promise<InventoryHistory[]>;
  addInventoryHistory(history: InsertInventoryHistory): Promise<InventoryHistory>;
  getStockAlerts(status?: string): Promise<StockAlert[]>;
  createStockAlert(alert: InsertStockAlert): Promise<StockAlert>;
  resolveStockAlert(id: string): Promise<StockAlert | undefined>;
  dismissStockAlert(id: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;
  getOutOfStockProducts(): Promise<Product[]>;
  getReorderPointProducts(): Promise<Product[]>;
  updateProductInventory(productId: string, updates: {
    inStock?: number;
    lowStockThreshold?: number;
    reorderPoint?: number;
    maxStock?: number;
    sku?: string;
    supplier?: string;
    costPrice?: string;
  }): Promise<Product | undefined>;
  adjustStock(productId: string, adjustment: number, reason: string, userId?: string, reference?: string): Promise<void>;
  bulkUpdateStock(updates: Array<{ productId: string; newStock: number; reason?: string; userId?: string }>): Promise<void>;
  getInventoryReport(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    reorderPointCount: number;
    totalInventoryValue: number;
    averageStockLevel: number;
  }>;
  
  // Admin Inventory Oversight Operations (Task 15g)
  getAdminInventoryOverview(query: InventoryOverviewQuery): Promise<InventoryOverviewResponse>;
  getAdminLowStockAlerts(query: LowStockAlertsQuery): Promise<LowStockAlertsResponse>;
  performAdminBulkAdjustment(adjustments: AdminBulkAdjustment, adminUserId: string): Promise<BulkOperation>;
  getAdminInventoryAudit(query: InventoryAuditQuery): Promise<InventoryAuditResponse>;
  exportInventoryData(exportConfig: InventoryExport): Promise<string>;
  getBulkOperationStatus(operationId: string): Promise<BulkOperationStatus | undefined>;
  processCsvInventoryUpload(csvData: CsvUpload, adminUserId: string): Promise<BulkOperation>;
  createBulkOperation(operation: InsertBulkOperation): Promise<BulkOperation>;
  updateBulkOperationStatus(operationId: string, status: string, successCount?: number, failureCount?: number, errorLog?: string): Promise<BulkOperation | undefined>;
  
  // Password reset operations
  createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  validatePasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  consumePasswordResetToken(token: string): Promise<boolean>;
  cleanupExpiredPasswordResetTokens(): Promise<void>;
  
  // Email verification operations
  createEmailVerificationToken(userId: string, email: string, token: string, expiresAt: Date): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  validateEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  consumeEmailVerificationToken(token: string): Promise<boolean>;
  verifyUserEmail(userId: string): Promise<User | undefined>;
  updateUserEmailVerification(userId: string, verified: boolean): Promise<User | undefined>;
  cleanupExpiredEmailVerificationTokens(): Promise<void>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId?: string, unreadOnly?: boolean): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  updateNotificationEmailStatus(id: string, emailSent: boolean): Promise<Notification | undefined>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  cleanupOldNotifications(daysToKeep?: number): Promise<void>;
  
  // Enhanced profile management operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<UpdateUserPreferences>): Promise<UserPreferences | undefined>;
  updateProfileImage(userId: string, imageUrl: string): Promise<User | undefined>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean>;
  deleteUserAccount(userId: string, password: string): Promise<boolean>;
  getRecentOrders(userId: string, limit?: number): Promise<Order[]>;
  
  // Email queue operations for persistent email delivery
  enqueueEmail(email: InsertEmailQueue): Promise<EmailQueue>;
  dequeueReadyEmails(limit?: number): Promise<EmailQueue[]>;
  updateEmailStatus(id: string, status: string, messageId?: string, deliveryStatus?: string, sentAt?: Date): Promise<EmailQueue | undefined>;
  markEmailAsFailed(id: string, error: string): Promise<EmailQueue | undefined>;
  incrementEmailRetry(id: string, nextRetryAt: Date): Promise<EmailQueue | undefined>;
  cleanupOldEmailQueue(daysToKeep?: number): Promise<void>;
  getEmailQueueStats(): Promise<{ pending: number; sent: number; failed: number; }>;
  
  // Email preferences and unsubscribe management
  getEmailPreferences(email: string, userId?: string): Promise<EmailPreferences | undefined>;
  createEmailPreferences(preferences: InsertEmailPreferences): Promise<EmailPreferences>;
  updateEmailPreferences(email: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences | undefined>;
  unsubscribeEmail(token: string): Promise<EmailPreferences | undefined>;
  checkEmailAllowed(email: string, emailType: string, userId?: string): Promise<boolean>;
  
  // Email rate limiting
  checkRateLimit(identifier: string, priority: string, windowType: 'minute' | 'hour'): Promise<boolean>;
  recordEmailSend(identifier: string, priority: string, windowType: 'minute' | 'hour'): Promise<void>;
  cleanupOldRateLimits(): Promise<void>;
  
  // SMS operations
  createSmsQueue(sms: InsertSmsQueue): Promise<SmsQueue>;
  getPendingSmsQueue(): Promise<SmsQueue[]>;
  updateSmsQueueStatus(id: string, status: string, updates?: Record<string, any>): Promise<SmsQueue | undefined>;
  updateSmsQueueRetry(id: string, retryCount: number, error?: string): Promise<SmsQueue | undefined>;
  updateSmsQueueStatusByTwilioSid(twilioSid: string, status: string, updates?: Record<string, any>): Promise<SmsQueue | undefined>;
  
  // SMS preferences operations
  getSmsPreferences(phoneNumber: string, userId?: string): Promise<SmsPreferences | undefined>;
  createSmsPreferences(preferences: InsertSmsPreferences): Promise<SmsPreferences>;
  updateSmsPreferences(id: string, preferences: Partial<InsertSmsPreferences>): Promise<SmsPreferences | undefined>;
  optInSms(phoneNumber: string, userId?: string): Promise<SmsPreferences>;
  optOutSms(phoneNumber: string, optInToken?: string): Promise<boolean>;
  
  // SMS rate limiting operations
  getSmsRateLimitCount(identifier: string, windowStart: Date, windowType: string, priority: string): Promise<number>;
  incrementSmsRateLimit(identifier: string, priority: string): Promise<void>;
  
  // SMS delivery log operations
  createSmsDeliveryLog(log: InsertSmsDeliveryLogs): Promise<SmsDeliveryLogs>;
  updateSmsDeliveryLogStatus(twilioSid: string, updates: Record<string, any>): Promise<SmsDeliveryLogs | undefined>;
  getSmsDeliveryLogs(smsQueueId?: string): Promise<SmsDeliveryLogs[]>;

  // WhatsApp queue operations for persistent WhatsApp delivery
  createWhatsappQueue(whatsapp: InsertWhatsappQueue): Promise<WhatsappQueue>;
  getPendingWhatsappQueue(): Promise<WhatsappQueue[]>;
  updateWhatsappQueueStatus(id: string, status: string, updates?: Record<string, any>): Promise<WhatsappQueue | undefined>;
  updateWhatsappQueueRetry(id: string, retryCount: number, error?: string): Promise<WhatsappQueue | undefined>;
  updateWhatsappQueueStatusByTwilioSid(twilioSid: string, status: string, updates?: Record<string, any>): Promise<WhatsappQueue | undefined>;
  getWhatsappQueueByTwilioSid(twilioSid: string): Promise<WhatsappQueue | undefined>;

  // WhatsApp preferences operations for opt-in/opt-out management
  getWhatsappPreferences(phoneNumber: string, userId?: string): Promise<WhatsappPreferences | undefined>;
  createWhatsappPreferences(preferences: InsertWhatsappPreferences): Promise<WhatsappPreferences>;
  updateWhatsappPreferences(id: string, preferences: Partial<InsertWhatsappPreferences>): Promise<WhatsappPreferences | undefined>;
  createOrUpdateWhatsappPreferences(preferences: Partial<InsertWhatsappPreferences>): Promise<WhatsappPreferences>;
  updateWhatsappOptOut(phoneNumber: string, userId?: string, method?: string): Promise<boolean>;

  // WhatsApp rate limiting operations
  getWhatsappRateLimitCount(identifier: string, windowStart: Date, windowType: string, priority: string): Promise<number>;
  incrementWhatsappRateLimit(identifier: string, priority: string): Promise<void>;

  // WhatsApp delivery log operations
  createWhatsappDeliveryLog(log: InsertWhatsappDeliveryLogs): Promise<WhatsappDeliveryLogs>;
  updateWhatsappDeliveryLogStatus(twilioSid: string, status: string, webhookData?: any): Promise<WhatsappDeliveryLogs | undefined>;
  getWhatsappDeliveryLogs(whatsappQueueId?: string): Promise<WhatsappDeliveryLogs[]>;
  
  // Admin Metrics operations - Business Analytics & Reporting
  getAdminOverviewMetrics(dateRange: MetricsDateRange): Promise<AdminOverviewMetrics>;
  getRevenueAnalytics(query: RevenueQuery): Promise<RevenueAnalytics>;
  getOrderAnalytics(query: OrderAnalyticsQuery): Promise<OrderAnalytics>;
  getCustomerAnalytics(query: CustomerAnalyticsQuery): Promise<CustomerAnalytics>;
  getTopProducts(query: TopProductsQuery): Promise<TopProducts>;
  getLowStockInventory(query: LowStockQuery): Promise<LowStockInventory>;
  
  // Task 15e - Specific Top Products & Categories Analytics
  getTopProductsByRevenue(query: TopProductsByRevenueQuery): Promise<TopProductsByRevenue>;
  getTopProductsByUnits(query: TopProductsByUnitsQuery): Promise<TopProductsByUnits>;
  getTopCategories(query: TopCategoriesQuery): Promise<TopCategories>;
  
  // Task 15h - Admin Customer Management Operations
  getAdminCustomers(query: CustomersListQuery): Promise<CustomersListResponse>;
  getAdminCustomerDetail(customerId: string): Promise<CustomerDetail | undefined>;
  getCustomerOrderHistory(customerId: string, query: { page?: number; limit?: number; status?: string }): Promise<{
    orders: Array<{
      id: string;
      total: number;
      status: string;
      paymentStatus: string;
      createdAt: string;
      itemCount: number;
      items?: Array<{
        productName: string;
        quantity: number;
        price: number;
      }>;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
  getCustomerAnalytics(customerId: string, dateRange: { from: string; to: string }): Promise<CustomerAnalyticsResponse>;
  
  // Customer LTV and Analytics Cache Management
  calculateCustomerLTV(customerId: string): Promise<CustomerAnalyticsCache>;
  updateCustomerAnalyticsCache(customerId: string): Promise<CustomerAnalyticsCache>;
  getCustomerAnalyticsFromCache(customerId: string): Promise<CustomerAnalyticsCache | undefined>;
  refreshAllCustomerAnalytics(): Promise<void>;
  calculateCustomerSegment(customerId: string): Promise<string>; // returns segment: new, returning, vip, at_risk, inactive
  
  // Customer Communication Operations
  createCustomerCommunication(communication: InsertCustomerCommunicationHistory): Promise<CustomerCommunicationHistory>;
  getCustomerCommunicationHistory(customerId: string, limit?: number): Promise<CustomerCommunicationHistory[]>;
  sendCustomerCommunication(communication: CustomerCommunication, adminUserId: string): Promise<CustomerCommunicationHistory>;
  
  // Customer Profile Management with Audit Trail
  updateCustomerProfile(customerId: string, updates: CustomerProfileUpdate, adminUserId: string, ipAddress?: string, userAgent?: string): Promise<CustomerDetail>;
  getCustomerProfileAuditLog(customerId: string, limit?: number): Promise<CustomerProfileAuditLog[]>;
  createProfileAuditEntry(auditEntry: InsertCustomerProfileAuditLog): Promise<CustomerProfileAuditLog>;
  
  // Customer Notes Management
  createCustomerNote(note: InsertCustomerNotes): Promise<CustomerNotes>;
  getCustomerNotes(customerId: string, includePrivate?: boolean): Promise<CustomerNotes[]>;
  updateCustomerNote(noteId: string, updates: Partial<InsertCustomerNotes>): Promise<CustomerNotes | undefined>;
  deleteCustomerNote(noteId: string, adminUserId: string): Promise<void>;
  
  // Customer Segmentation and Analytics
  getCustomerSegmentation(): Promise<{
    segments: Array<{
      segment: string;
      count: number;
      percentage: number;
      averageLtv: number;
      description: string;
    }>;
    totalCustomers: number;
  }>;
  getCustomersBySegment(segment: string, limit?: number, offset?: number): Promise<CustomerDetail[]>;
  getCustomerInsights(customerId: string): Promise<{
    riskScore: number; // 0-100, higher = more at risk
    valueScore: number; // 0-100, higher = more valuable
    predictions: {
      nextOrderProbability: number;
      churnRisk: number;
      projectedLifetimeValue: number;
      recommendedActions: string[];
    };
    engagementMetrics: {
      emailOpenRate: number | null;
      emailClickRate: number | null;
      smsResponseRate: number | null;
      lastEngagementDate: string | null;
    };
  }>;
  
  // Customer Export and Bulk Operations
  exportCustomerData(exportConfig: CustomerExport): Promise<any[]>;
  bulkUpdateCustomerSegment(customerIds: string[], segment: string, adminUserId: string): Promise<void>;
  bulkSendCommunication(customerIds: string[], communication: CustomerCommunication, adminUserId: string): Promise<CustomerCommunicationHistory[]>;
  
  // Customer Search and Filtering
  searchCustomers(query: string, filters?: {
    segment?: string;
    city?: string;
    state?: string;
    ltvMin?: number;
    ltvMax?: number;
    lastActivityDays?: number;
  }): Promise<CustomerDetail[]>;
  getCustomersNeedingAttention(): Promise<{
    atRisk: CustomerDetail[];
    inactive: CustomerDetail[];
    highValue: CustomerDetail[];
    newCustomers: CustomerDetail[];
  }>;

  // ================================
  // COMPREHENSIVE ADMIN EXPORT METHODS
  // ================================

  // Comprehensive Export Data Generation
  exportOrdersComprehensive(params: OrdersExport): Promise<any[]>;
  exportRevenueAnalytics(params: RevenueExport): Promise<any[]>;
  exportCustomersComprehensive(params: CustomerExport): Promise<any[]>;
  exportInventoryComprehensive(params: InventoryExport): Promise<any[]>;
  exportBusinessAnalytics(params: AnalyticsExport): Promise<any[]>;

  // CSV Generation Methods
  generateOrdersCSV(data: any[], params: OrdersExport): Promise<string>;
  generateRevenueCSV(data: any[], params: RevenueExport): Promise<string>;
  generateCustomersCSV(data: any[], params: CustomerExport): Promise<string>;
  generateInventoryCSV(data: any[], params: InventoryExport): Promise<string>;
  generateAnalyticsCSV(data: any[], params: AnalyticsExport): Promise<string>;

  // Export Job Management
  getExportHistory(params: {
    adminUserId: string;
    type?: string;
    page: number;
    limit: number;
  }): Promise<ExportHistory>;
  getExportJobStatus(exportId: string, adminUserId: string): Promise<ExportJob | undefined>;
  cancelExportJob(exportId: string, adminUserId: string): Promise<boolean>;

  // Test and Development Helpers
  generateTestExportData(type: string, sampleSize: number): Promise<any[]>;
  generateTestCSV(data: any[], type: string): Promise<string>;

  // Utility CSV Helper Methods
  escapeCSVValue(value: any): string;
  formatDateForCSV(date: Date | string, timezone?: string): string;
  generateCSVHeaders(fields: string[], type: string): string[];

  // ================================
  // ADMIN COMMUNICATIONS METHODS
  // ================================

  // WhatsApp Analytics Methods
  getWhatsappAnalytics(dateRange?: {from: Date, to: Date}): Promise<WhatsappAnalytics>;
  exportWhatsappAnalytics(filters: any): Promise<any[]>;
  getWhatsappEngagementStats(dateRange?: {from: Date, to: Date}): Promise<any>;
  getWhatsappMessageBreakdown(dateRange?: {from: Date, to: Date}): Promise<any>;
  getWhatsappCostAnalysis(dateRange?: {from: Date, to: Date}): Promise<any>;

  // Message Template Methods
  getMessageTemplates(): Promise<MessageTemplate[]>;
  getMessageTemplate(id: string): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: string, updates: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: string): Promise<void>;
  approveMessageTemplate(id: string, adminUserId: string): Promise<MessageTemplate | undefined>;
  rejectMessageTemplate(id: string, adminUserId: string, reason: string): Promise<MessageTemplate | undefined>;

  // Notification Management Methods
  getNotificationMetrics(dateRange?: {from: Date, to: Date}): Promise<NotificationMetrics>;
  getNotificationHistory(params: any): Promise<NotificationHistory[]>;
  createNotificationHistory(history: InsertNotificationHistory): Promise<NotificationHistory>;
  sendBulkNotifications(request: BulkNotificationRequest): Promise<BulkNotificationResult>;
  retryNotification(id: string): Promise<NotificationHistory | undefined>;
  exportNotificationsData(filters: any): Promise<any[]>;

  // Recipient Groups Methods
  getRecipientGroups(): Promise<RecipientGroup[]>;
  getRecipientGroup(id: string): Promise<RecipientGroup | undefined>;
  createRecipientGroup(group: InsertRecipientGroup): Promise<RecipientGroup>;
  updateRecipientGroup(id: string, updates: Partial<InsertRecipientGroup>): Promise<RecipientGroup | undefined>;
  deleteRecipientGroup(id: string): Promise<void>;
  calculateRecipientGroupSize(criteria: any): Promise<number>;

  // Site Settings Methods
  getSiteSettings(): Promise<SiteSettings>;
  upsertSiteSettings(data: InsertSiteSettings): Promise<SiteSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations - JWT Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Read-then-branch approach for safety and reliability
    let existingUser: User | undefined;
    
    // Check if user exists by id or email
    if (userData.id) {
      existingUser = await this.getUser(userData.id);
    } else if (userData.email) {
      existingUser = await this.getUserByEmail(userData.email);
    }
    
    if (existingUser) {
      // User exists - perform UPDATE with validated partial data
      const updateData: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      };
      
      // Only include defined fields in the update
      if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
      if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.phoneNumber !== undefined) updateData.phoneNumber = userData.phoneNumber;
      if (userData.profileImageUrl !== undefined) updateData.profileImageUrl = userData.profileImageUrl;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.password !== undefined) updateData.password = userData.password;
      if (userData.emailVerified !== undefined) updateData.emailVerified = userData.emailVerified;
      
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existingUser.id))
        .returning();
      
      return updatedUser;
    } else {
      // User doesn't exist - validate required fields and INSERT
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required for creating a new user');
      }
      
      // Use insertUserSchema to validate the data for insertion
      const insertData = {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || null,
        profileImageUrl: userData.profileImageUrl || null,
        role: userData.role || 'user',
        emailVerified: userData.emailVerified || false,
      };
      
      const [newUser] = await db.insert(users).values(insertData).returning();
      return newUser;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // User address operations
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return await db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const [userAddress] = await db.insert(userAddresses).values(address).returning();
    return userAddress;
  }

  async updateUserAddress(userId: string, id: string, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined> {
    const [updated] = await db
      .update(userAddresses)
      .set(address)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
      .returning();
    return updated;
  }

  async deleteUserAddress(userId: string, id: string): Promise<void> {
    await db.delete(userAddresses).where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)));
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // Use transaction to ensure atomicity of default address management
    await db.transaction(async (tx) => {
      // First verify the address belongs to the user
      const [addressExists] = await tx
        .select()
        .from(userAddresses)
        .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)));
      
      if (!addressExists) {
        throw new Error('Address not found or access denied');
      }
      
      // First, unset all default addresses for the user
      await tx
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, userId));
      
      // Then set the specified address as default
      await tx
        .update(userAddresses)
        .set({ isDefault: true })
        .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)));
    });
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(asc(products.name));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.category, searchTerm),
          ilike(products.cultivableCrops, searchTerm)
        )
      )
      .orderBy(asc(products.name));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    // Add subcategory to categories table if it doesn't exist (using transaction for atomicity)
    if (product.mainCategory && product.category) {
      await db.transaction(async (tx) => {
        const [category] = await tx
          .select()
          .from(categories)
          .where(eq(categories.mainCategory, product.mainCategory));
        
        if (category && !category.subcategories.includes(product.category)) {
          // Add the new subcategory atomically
          await tx
            .update(categories)
            .set({ 
              subcategories: [...category.subcategories, product.category],
              updatedAt: new Date()
            })
            .where(eq(categories.id, category.id));
        }
      });
    }
    
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    // Get existing product to determine mainCategory if not provided
    let mainCategory = product.mainCategory;
    if (!mainCategory && product.category) {
      const existingProduct = await this.getProduct(id);
      mainCategory = existingProduct?.mainCategory;
    }
    
    // Add subcategory to categories table if it doesn't exist (using transaction for atomicity)
    if (mainCategory && product.category) {
      await db.transaction(async (tx) => {
        const [category] = await tx
          .select()
          .from(categories)
          .where(eq(categories.mainCategory, mainCategory!));
        
        if (category && !category.subcategories.includes(product.category!)) {
          // Add the new subcategory atomically
          await tx
            .update(categories)
            .set({ 
              subcategories: [...category.subcategories, product.category!],
              updatedAt: new Date()
            })
            .where(eq(categories.id, category.id));
        }
      });
    }
    
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.mainCategory));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryByName(mainCategory: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.mainCategory, mainCategory));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const [newCategory] = await db.insert(categories).values(category).returning();
      return newCategory;
    } catch (error: any) {
      console.error('Database error creating category:', error);
      if (error.code === '23505') { // Unique violation
        throw new Error(`Category "${category.mainCategory}" already exists`);
      }
      throw error;
    }
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    try {
      const [updated] = await db
        .update(categories)
        .set({ ...category, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning();
      return updated;
    } catch (error: any) {
      console.error('Database error updating category:', error);
      if (error.code === '23505') { // Unique violation
        throw new Error(`Category name "${category.mainCategory}" already exists`);
      }
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
    } catch (error: any) {
      console.error('Database error deleting category:', error);
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Cannot delete category: it is being used by products');
      }
      throw error;
    }
  }

  // Cart operations
  async getCartItems(sessionId?: string, userId?: string): Promise<CartItem[]> {
    if (userId) {
      return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      return await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    }
    return [];
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart (same product and size)
    const conditions = [
      eq(cartItems.productId, item.productId),
      item.userId ? eq(cartItems.userId, item.userId) : eq(cartItems.sessionId, item.sessionId!)
    ];
    
    // Add size condition if size is provided
    if (item.size) {
      conditions.push(eq(cartItems.size, item.size));
    } else {
      conditions.push(sql`${cartItems.size} IS NULL`);
    }
    
    const existingItems = await db
      .select()
      .from(cartItems)
      .where(and(...conditions));

    if (existingItems.length > 0) {
      // Update quantity
      const existingItem = existingItems[0];
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updated;
    } else {
      // Create new cart item
      const [cartItem] = await db.insert(cartItems).values(item).returning();
      return cartItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId?: string, userId?: string): Promise<void> {
    if (userId) {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    }
  }

  async clearCartForUser(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Cart persistence and synchronization operations
  async syncCartItems(userId: string, localCartItems: Array<{productId: string; quantity: number}>): Promise<CartItem[]> {
    // Get existing database cart items for the user
    const dbCartItems = await this.getCartItems(undefined, userId);
    const dbCartMap = new Map(dbCartItems.map(item => [item.productId, item]));
    
    // Calculate expiration date for user cart items (90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    const syncedItems: CartItem[] = [];
    const skippedProducts: string[] = [];
    
    // Process local cart items
    for (const localItem of localCartItems) {
      const dbItem = dbCartMap.get(localItem.productId);
      
      if (dbItem) {
        // Item exists in both: sum quantities (conflict resolution)
        const newQuantity = Math.min(dbItem.quantity + localItem.quantity, 99); // Max 99 items
        const [updated] = await db
          .update(cartItems)
          .set({ 
            quantity: newQuantity, 
            updatedAt: new Date(),
            expiresAt 
          })
          .where(eq(cartItems.id, dbItem.id))
          .returning();
        syncedItems.push(updated);
        dbCartMap.delete(localItem.productId); // Mark as processed
      } else {
        // Item only in local cart: verify product exists before adding
        const productExists = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, localItem.productId))
          .limit(1);
        
        if (productExists.length > 0) {
          // Product exists: add to database
          const [newItem] = await db
            .insert(cartItems)
            .values({
              userId,
              productId: localItem.productId,
              quantity: localItem.quantity,
              sessionId: null,
              addedAt: new Date(),
              updatedAt: new Date(),
              expiresAt,
              createdAt: new Date(),
            })
            .returning();
          syncedItems.push(newItem);
        } else {
          // Product doesn't exist: skip and log
          console.log(`⚠️ Skipping cart sync for missing product: ${localItem.productId}`);
          skippedProducts.push(localItem.productId);
        }
      }
    }
    
    // Add remaining database items that weren't in local cart
    Array.from(dbCartMap.values()).forEach(dbItem => {
      syncedItems.push(dbItem);
    });
    
    if (skippedProducts.length > 0) {
      console.log(`⚠️ Cart sync completed. ${skippedProducts.length} product(s) were removed (no longer available)`);
    }
    
    return syncedItems;
  }

  async mergeGuestCartToUser(sessionId: string, userId: string): Promise<CartItem[]> {
    // Get guest cart items
    const guestCartItems = await this.getCartItems(sessionId);
    
    // Calculate expiration date for user cart items (90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    const mergedItems: CartItem[] = [];
    
    // Process each guest cart item
    for (const guestItem of guestCartItems) {
      // Check if user already has this product in cart
      const existingUserItem = await this.getCartItemByProduct(userId, null, guestItem.productId);
      
      if (existingUserItem) {
        // Merge quantities
        const newQuantity = Math.min(existingUserItem.quantity + guestItem.quantity, 99);
        const [updated] = await db
          .update(cartItems)
          .set({ 
            quantity: newQuantity,
            updatedAt: new Date(),
            expiresAt 
          })
          .where(eq(cartItems.id, existingUserItem.id))
          .returning();
        mergedItems.push(updated);
      } else {
        // Transfer guest item to user
        const [newItem] = await db
          .insert(cartItems)
          .values({
            userId,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
            sessionId: null,
            addedAt: guestItem.addedAt || new Date(),
            updatedAt: new Date(),
            expiresAt,
            createdAt: new Date(),
          })
          .returning();
        mergedItems.push(newItem);
      }
    }
    
    // Clear guest cart after successful migration
    await this.clearCart(sessionId);
    
    // Get all user cart items after merge
    return await this.getCartItems(undefined, userId);
  }

  async setCartItemExpiration(userId?: string, sessionId?: string): Promise<void> {
    const now = new Date();
    let expiresAt: Date;
    
    if (userId) {
      // User cart items expire in 90 days
      expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      await db
        .update(cartItems)
        .set({ expiresAt, updatedAt: now })
        .where(eq(cartItems.userId, userId));
    } else if (sessionId) {
      // Guest cart items expire in 7 days
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await db
        .update(cartItems)
        .set({ expiresAt, updatedAt: now })
        .where(eq(cartItems.sessionId, sessionId));
    }
  }

  async getExpiredCartItems(beforeDate?: Date): Promise<CartItem[]> {
    const expireDate = beforeDate || new Date();
    return await db
      .select()
      .from(cartItems)
      .where(sql`expires_at IS NOT NULL AND expires_at < ${expireDate}`);
  }

  async cleanupExpiredCarts(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(cartItems)
      .where(sql`expires_at IS NOT NULL AND expires_at < ${now}`);
    
    return result.rowCount || 0;
  }

  async upsertCartItem(item: InsertCartItem): Promise<CartItem> {
    console.log(`📦 upsertCartItem called with:`, { productId: item.productId, quantity: item.quantity, size: item.size, userId: item.userId, sessionId: item.sessionId });
    
    // Calculate expiration date
    const expiresAt = new Date();
    if (item.userId) {
      expiresAt.setDate(expiresAt.getDate() + 90); // User cart: 90 days
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7); // Guest cart: 7 days
    }
    
    // Try to find existing item (considering size)
    const existingItem = await this.getCartItemByProduct(
      item.userId || null,
      item.sessionId || null,
      item.productId,
      item.size || null
    );
    
    if (existingItem) {
      console.log(`📝 Existing cart item found - Current quantity: ${existingItem.quantity}, Adding: ${item.quantity}, New total: ${existingItem.quantity + item.quantity}`);
      // Update existing item - ADD to existing quantity instead of replacing
      const [updated] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + item.quantity,
          updatedAt: new Date(),
          expiresAt
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      console.log(`✅ Cart item updated - ID: ${updated.id}, Final quantity: ${updated.quantity}`);
      return updated;
    } else {
      console.log(`➕ Creating new cart item with quantity: ${item.quantity}, size: ${item.size || 'N/A'}`);
      // Create new item
      const [newItem] = await db
        .insert(cartItems)
        .values({
          ...item,
          addedAt: new Date(),
          updatedAt: new Date(),
          expiresAt,
          createdAt: new Date(),
        })
        .returning();
      console.log(`✅ New cart item created - ID: ${newItem.id}, Quantity: ${newItem.quantity}`);
      return newItem;
    }
  }

  async getCartItemByProduct(userId: string | null, sessionId: string | null, productId: string, size?: string | null): Promise<CartItem | undefined> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(cartItems.userId, userId));
      conditions.push(eq(cartItems.productId, productId));
    } else if (sessionId) {
      conditions.push(eq(cartItems.sessionId, sessionId));
      conditions.push(eq(cartItems.productId, productId));
      conditions.push(sql`user_id IS NULL`);
    } else {
      return undefined;
    }
    
    // Add size condition
    if (size) {
      conditions.push(eq(cartItems.size, size));
    } else {
      conditions.push(sql`${cartItems.size} IS NULL`);
    }
    
    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(...conditions));
    
    return item;
  }

  async updateCartItemTimestamp(id: string): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async getCartWithProducts(userId?: string, sessionId?: string): Promise<Array<CartItem & { product: Product | null }>> {
    const cartItemsData = await this.getCartItems(sessionId, userId);
    
    const itemsWithProducts = await Promise.all(
      cartItemsData.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product: product ?? null
        };
      })
    );
    
    return itemsWithProducts;
  }

  // Wishlist operations
  async getWishlist(userId: string): Promise<Wishlist[]> {
    return await db.select().from(wishlists).where(eq(wishlists.userId, userId));
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    const [wishlistItem] = await db.insert(wishlists).values(item).returning();
    return wishlistItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const [exists] = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
    return !!exists;
  }

  // Order operations - DEPRECATED: Use createSecureOrder instead
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    // Insert order items
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map(item => ({ ...item, orderId: newOrder.id }))
      );
    }

    // Update product stock using audited method
    for (const item of items) {
      await this.adjustStock(item.productId, -item.quantity, 'Order fulfillment', undefined, newOrder.id);
    }

    return newOrder;
  }

  // SECURE order creation - prevents price tampering and ensures atomicity
  async createSecureOrder(orderData: any, items: any[], userId: string | null = null): Promise<Order> {
    const result = await db.transaction(async (tx) => {
      // Validate and get current product prices from database
      let subtotal = 0;
      const validatedItems: InsertOrderItem[] = [];
      
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          throw new Error('Invalid item: missing productId or invalid quantity');
        }
        
        // Get current product from database
        const [product] = await tx.select().from(products).where(eq(products.id, item.productId));
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        
        // Check stock availability
        if (product.inStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.inStock}, Requested: ${item.quantity}`);
        }
        
        // Use database price, not client-provided price
        const itemTotal = parseFloat(product.price) * item.quantity;
        subtotal += itemTotal;
        
        validatedItems.push({
          productId: item.productId,
          productName: product.name,
          productPrice: product.price,
          quantity: item.quantity,
          totalPrice: itemTotal.toFixed(2),
          orderId: '' // Will be set after order creation
        });
        
        // Stock will be decremented atomically within this transaction
      }
      
      // Calculate shipping and tax (simple rules for now)
      const shippingCost = 0; // Free shipping for all orders
      const taxRate = 0; // GST set to 0% for all orders
      const taxAmount = subtotal * taxRate;
      const total = subtotal + shippingCost + taxAmount;
      
      // Create order with server-calculated totals
      const secureOrderData: InsertOrder = {
        userId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        shippingAddress: orderData.shippingAddress,
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2),
        status: 'pending',
        paymentStatus: 'pending',
        notes: orderData.notes
      };
      
      const [newOrder] = await tx.insert(orders).values(secureOrderData).returning();
      
      // Insert order items
      if (validatedItems.length > 0) {
        await tx.insert(orderItems).values(
          validatedItems.map(item => ({ ...item, orderId: newOrder.id }))
        );
      }
      
      // Atomic stock decrement with conditional UPDATE to prevent overselling
      for (const item of validatedItems) {
        // Use conditional UPDATE WHERE inStock >= requestedQuantity to prevent overselling
        const updateResult = await tx
          .update(products)
          .set({ 
            inStock: sql`${products.inStock} - ${item.quantity}`,
            updatedAt: new Date()
          })
          .where(and(
            eq(products.id, item.productId),
            sql`${products.inStock} >= ${item.quantity}` // Prevent overselling
          ))
          .returning({ id: products.id, newStock: products.inStock });
        
        // Check if update succeeded (row was affected)
        if (updateResult.length === 0) {
          throw new Error(`Failed to reserve stock for ${item.productName}. Insufficient inventory or concurrent order conflict.`);
        }
        
        // Create inventory history record atomically
        const newStock = updateResult[0].newStock;
        const oldStock = newStock + item.quantity;
        await tx.insert(inventoryHistory).values({
          productId: item.productId,
          changeType: 'order',
          quantityBefore: oldStock,
          quantityChanged: item.quantity,
          quantityAfter: newStock,
          reason: 'Order fulfillment',
          reference: newOrder.id,
          userId: userId,
        });
      }
      
      // Clear user's cart atomically (only for authenticated users)
      if (userId) {
        await tx.delete(cartItems).where(eq(cartItems.userId, userId));
      }
      
      return newOrder;
    });
    
    return result;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    if (userId) {
      return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    }
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerEmail, email)).orderBy(desc(orders.createdAt));
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderPaymentStatus(id: string, paymentStatus: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderRazorpayDetails(id: string, details: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paymentMethod?: string;
  }): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ ...details, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async linkOrderToUser(orderId: string, userId: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ userId, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated;
  }

  // ==============================================================================
  // ADMIN ORDERS MANAGEMENT METHODS (Task 15f)
  // ==============================================================================

  async getAdminOrders(query: AdminOrdersQuery): Promise<AdminOrdersList> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status = 'all',
        paymentStatus = 'all',
        dateFrom,
        dateTo,
        search,
        customerEmail,
        customerName,
        totalMin,
        totalMax,
        paymentMethod,
        hasTracking,
        includeItems = false,
        includeHistory = false
      } = query;

    // Build WHERE conditions
    const conditions = [];
    
    if (status !== 'all') {
      conditions.push(eq(orders.status, status));
    }
    
    if (paymentStatus !== 'all') {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }
    
    if (dateFrom) {
      conditions.push(sql`${orders.createdAt} >= ${new Date(dateFrom)}`);
    }
    
    if (dateTo) {
      conditions.push(sql`${orders.createdAt} <= ${new Date(dateTo)}`);
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(orders.customerName, `%${search}%`),
          ilike(orders.customerEmail, `%${search}%`),
          ilike(orders.id, `%${search}%`)
        )
      );
    }
    
    if (customerEmail) {
      conditions.push(ilike(orders.customerEmail, `%${customerEmail}%`));
    }
    
    if (customerName) {
      conditions.push(ilike(orders.customerName, `%${customerName}%`));
    }
    
    if (totalMin !== undefined) {
      conditions.push(sql`CAST(${orders.total} AS DECIMAL) >= ${totalMin}`);
    }
    
    if (totalMax !== undefined) {
      conditions.push(sql`CAST(${orders.total} AS DECIMAL) <= ${totalMax}`);
    }
    
    if (paymentMethod) {
      conditions.push(eq(orders.paymentMethod, paymentMethod));
    }
    
    if (hasTracking !== undefined) {
      if (hasTracking) {
        conditions.push(sql`${orders.trackingNumber} IS NOT NULL`);
      } else {
        conditions.push(sql`${orders.trackingNumber} IS NULL`);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build ORDER BY clause
    const orderByColumn = {
      createdAt: orders.createdAt,
      total: orders.total,
      status: orders.status,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      updatedAt: orders.updatedAt
    }[sortBy] || orders.createdAt;

    const orderDirection = sortOrder === 'asc' ? asc : desc;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);

    const totalPages = Math.ceil(count / limit);
    const offset = (page - 1) * limit;

    // Get orders with pagination
    const ordersResult = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(orderDirection(orderByColumn))
      .limit(limit)
      .offset(offset);

    // Transform to AdminOrderDetail format and optionally include items and history
    const ordersWithDetails: AdminOrderDetail[] = [];
    
    for (const order of ordersResult) {
      let items = undefined;
      let statusHistory = undefined;
      
      if (includeItems) {
        const orderItemsResult = await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: orderItems.productName,
            productPrice: orderItems.productPrice,
            quantity: orderItems.quantity,
            totalPrice: orderItems.totalPrice,
            productImage: sql<string>`(SELECT ${products.images}[1] FROM ${products} WHERE ${products.id} = ${orderItems.productId})`
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        
        items = orderItemsResult.map(item => ({
          ...item,
          productPrice: parseFloat(item.productPrice),
          totalPrice: parseFloat(item.totalPrice)
        }));
      }
      
      if (includeHistory) {
        statusHistory = await this.getOrderStatusHistory(order.id);
      }

      ordersWithDetails.push({
        id: order.id,
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        subtotal: parseFloat(order.subtotal),
        shippingCost: parseFloat(order.shippingCost || '0'),
        taxAmount: parseFloat(order.taxAmount || '0'),
        total: parseFloat(order.total),
        status: order.status,
        paymentStatus: order.paymentStatus || 'pending',
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        paymentMethod: order.paymentMethod,
        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
        notes: order.notes,
        createdAt: order.createdAt!.toISOString(),
        updatedAt: order.updatedAt!.toISOString(),
        items,
        statusHistory
      });
    }

    // Get summary statistics
    const summary = await this.getOrderSummaryStats();

    // Get filter metadata
    const availableStatusesResult = await db
      .selectDistinct({ status: orders.status })
      .from(orders);
    
    const availablePaymentMethodsResult = await db
      .selectDistinct({ paymentMethod: orders.paymentMethod })
      .from(orders)
      .where(sql`${orders.paymentMethod} IS NOT NULL`);
    
    // Safely handle empty results
    const availableStatuses = availableStatusesResult || [];
    const availablePaymentMethods = availablePaymentMethodsResult || [];

    const [dateRange] = await db
      .select({
        earliest: sql<string>`MIN(${orders.createdAt})`,
        latest: sql<string>`MAX(${orders.createdAt})`
      })
      .from(orders);

    const [amountRange] = await db
      .select({
        min: sql<number>`MIN(CAST(${orders.total} AS DECIMAL))`,
        max: sql<number>`MAX(CAST(${orders.total} AS DECIMAL))`
      })
      .from(orders);

    return {
      orders: ordersWithDetails,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      summary,
      filters: {
        appliedFilters: {
          status: status !== 'all' ? status : undefined,
          paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
          dateFrom,
          dateTo,
          search,
          customerEmail,
          customerName,
          totalMin,
          totalMax,
          paymentMethod,
          hasTracking
        },
        availableStatuses: availableStatuses.map(s => s.status),
        availablePaymentMethods: availablePaymentMethods.map(pm => pm.paymentMethod),
        dateRange: {
          earliest: dateRange.earliest,
          latest: dateRange.latest
        },
        amountRange: {
          min: amountRange.min,
          max: amountRange.max
        }
      }
    };
    } catch (error) {
      console.error('❌ Error in getAdminOrders:', error);
      throw error;
    }
  }

  async getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return undefined;
    }

    // Get order items with product details
    const orderItemsResult = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productName: orderItems.productName,
        productPrice: orderItems.productPrice,
        quantity: orderItems.quantity,
        totalPrice: orderItems.totalPrice,
        productImage: sql<string>`(SELECT ${products.images}[1] FROM ${products} WHERE ${products.id} = ${orderItems.productId})`
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const items = orderItemsResult.map(item => ({
      ...item,
      productPrice: parseFloat(item.productPrice),
      totalPrice: parseFloat(item.totalPrice)
    }));

    // Get status history
    const statusHistory = await this.getOrderStatusHistory(orderId);

    // Get customer order stats if user exists
    let customerOrderCount = undefined;
    let customerTotalSpent = undefined;
    
    if (order.userId) {
      const [customerStats] = await db
        .select({
          orderCount: sql<number>`COUNT(*)`,
          totalSpent: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
        })
        .from(orders)
        .where(eq(orders.userId, order.userId));
      
      customerOrderCount = customerStats.orderCount;
      customerTotalSpent = customerStats.totalSpent;
    }

    return {
      id: order.id,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      subtotal: parseFloat(order.subtotal),
      shippingCost: parseFloat(order.shippingCost || '0'),
      taxAmount: parseFloat(order.taxAmount || '0'),
      total: parseFloat(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus || 'pending',
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentMethod: order.paymentMethod,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
      notes: order.notes,
      createdAt: order.createdAt!.toISOString(),
      updatedAt: order.updatedAt!.toISOString(),
      items,
      statusHistory,
      customerOrderCount,
      customerTotalSpent
    };
  }

  async updateOrderStatusWithHistory(
    orderId: string, 
    update: OrderStatusUpdate, 
    adminUserId: string
  ): Promise<Order | undefined> {
    return await db.transaction(async (tx) => {
      // Get current order
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Validate status transition
      if (!this.validateStatusTransition(currentOrder.status, update.status)) {
        throw new Error(`Invalid status transition from ${currentOrder.status} to ${update.status}`);
      }

      // Update order with new status and optional tracking/delivery info
      const updateData: any = {
        status: update.status,
        updatedAt: new Date()
      };

      if (update.trackingNumber) {
        updateData.trackingNumber = update.trackingNumber;
      }

      if (update.estimatedDelivery) {
        updateData.estimatedDelivery = new Date(update.estimatedDelivery);
      }

      if (update.notes && !currentOrder.notes) {
        updateData.notes = update.notes;
      } else if (update.notes && currentOrder.notes) {
        updateData.notes = `${currentOrder.notes}\n\n${new Date().toISOString()}: ${update.notes}`;
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))
        .returning();

      // Create status history entry
      await tx.insert(orderStatusHistory).values({
        orderId,
        previousStatus: currentOrder.status,
        newStatus: update.status,
        changedBy: adminUserId,
        reason: update.reason,
        notes: update.notes,
        isSystemChange: false
      });

      return updatedOrder;
    });
  }

  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryItem[]> {
    const historyResult = await db
      .select({
        id: orderStatusHistory.id,
        orderId: orderStatusHistory.orderId,
        previousStatus: orderStatusHistory.previousStatus,
        newStatus: orderStatusHistory.newStatus,
        changedBy: orderStatusHistory.changedBy,
        changedByName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, 'System')`,
        reason: orderStatusHistory.reason,
        notes: orderStatusHistory.notes,
        isSystemChange: orderStatusHistory.isSystemChange,
        createdAt: orderStatusHistory.createdAt
      })
      .from(orderStatusHistory)
      .leftJoin(users, eq(orderStatusHistory.changedBy, users.id))
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));

    return historyResult.map(history => ({
      id: history.id,
      orderId: history.orderId,
      previousStatus: history.previousStatus,
      newStatus: history.newStatus,
      changedBy: history.changedBy,
      changedByName: history.changedByName,
      reason: history.reason,
      notes: history.notes,
      isSystemChange: history.isSystemChange,
      createdAt: history.createdAt!.toISOString()
    }));
  }

  async createOrderStatusHistory(history: InsertOrderStatusHistory): Promise<OrderStatusHistory> {
    const [newHistory] = await db
      .insert(orderStatusHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  validateStatusTransition(fromStatus: string, toStatus: string): boolean {
    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['cancelled'], // Allow cancellation for returns/refunds
      'cancelled': [] // No transitions from cancelled
    };

    // Allow same status (no-op)
    if (fromStatus === toStatus) {
      return true;
    }

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  async getOrderSummaryStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const [stats] = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        pendingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`,
        processingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'processing' THEN 1 END)`,
        shippedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'shipped' THEN 1 END)`,
        deliveredOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`,
        cancelledOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'cancelled' THEN 1 END)`,
        totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.paymentStatus} = 'completed' THEN CAST(${orders.total} AS DECIMAL) ELSE 0 END), 0)`,
        averageOrderValue: sql<number>`COALESCE(AVG(CASE WHEN ${orders.paymentStatus} = 'completed' THEN CAST(${orders.total} AS DECIMAL) ELSE NULL END), 0)`
      })
      .from(orders);

    return stats;
  }

  async exportOrdersData(query: AdminOrdersQuery): Promise<any[]> {
    // Use the same filtering logic as getAdminOrders but without pagination
    const { status, paymentStatus, dateFrom, dateTo, search, customerEmail, customerName, totalMin, totalMax, paymentMethod, hasTracking } = query;

    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status));
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }
    
    if (dateFrom) {
      conditions.push(sql`${orders.createdAt} >= ${new Date(dateFrom)}`);
    }
    
    if (dateTo) {
      conditions.push(sql`${orders.createdAt} <= ${new Date(dateTo)}`);
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(orders.customerName, `%${search}%`),
          ilike(orders.customerEmail, `%${search}%`),
          ilike(orders.id, `%${search}%`)
        )
      );
    }
    
    if (customerEmail) {
      conditions.push(ilike(orders.customerEmail, `%${customerEmail}%`));
    }
    
    if (customerName) {
      conditions.push(ilike(orders.customerName, `%${customerName}%`));
    }
    
    if (totalMin !== undefined) {
      conditions.push(sql`CAST(${orders.total} AS DECIMAL) >= ${totalMin}`);
    }
    
    if (totalMax !== undefined) {
      conditions.push(sql`CAST(${orders.total} AS DECIMAL) <= ${totalMax}`);
    }
    
    if (paymentMethod) {
      conditions.push(eq(orders.paymentMethod, paymentMethod));
    }
    
    if (hasTracking !== undefined) {
      if (hasTracking) {
        conditions.push(sql`${orders.trackingNumber} IS NOT NULL`);
      } else {
        conditions.push(sql`${orders.trackingNumber} IS NULL`);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const exportData = await db
      .select({
        orderId: orders.id,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt
      })
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt));

    return exportData.map(order => ({
      orderId: `#${order.orderId.slice(-8)}`,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || '',
      total: parseFloat(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod || '',
      shippingAddress: order.shippingAddress,
      trackingNumber: order.trackingNumber || '',
      createdAt: order.createdAt?.toISOString() || '',
      updatedAt: order.updatedAt?.toISOString() || ''
    }));
  }

  async bulkUpdateOrderStatus(
    orderIds: string[], 
    status: string, 
    adminUserId: string, 
    reason?: string
  ): Promise<Order[]> {
    return await db.transaction(async (tx) => {
      const updatedOrders: Order[] = [];

      for (const orderId of orderIds) {
        // Get current order
        const [currentOrder] = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, orderId));

        if (!currentOrder) {
          continue; // Skip non-existent orders
        }

        // Validate status transition
        if (!this.validateStatusTransition(currentOrder.status, status)) {
          continue; // Skip invalid transitions
        }

        // Update order
        const [updatedOrder] = await tx
          .update(orders)
          .set({ status, updatedAt: new Date() })
          .where(eq(orders.id, orderId))
          .returning();

        if (updatedOrder) {
          updatedOrders.push(updatedOrder);

          // Create status history entry
          await tx.insert(orderStatusHistory).values({
            orderId,
            previousStatus: currentOrder.status,
            newStatus: status,
            changedBy: adminUserId,
            reason: reason || 'Bulk status update',
            isSystemChange: false
          });
        }
      }

      return updatedOrders;
    });
  }

  // Review operations
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    return await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt));
  }

  async createReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db.insert(productReviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: string, review: Partial<InsertProductReview>): Promise<ProductReview | undefined> {
    const [updated] = await db
      .update(productReviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(productReviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(productReviews).where(eq(productReviews.id, id));
  }

  async getProductRating(productId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const reviews = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId));
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    return { averageRating, totalReviews };
  }

  async getReviewById(reviewId: string): Promise<ProductReview | undefined> {
    const [review] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, reviewId));
    return review;
  }

  // Helpful votes operations
  async addHelpfulVote(reviewId: string, userId: string): Promise<ReviewHelpfulVote> {
    // Use transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Try to insert the vote with ON CONFLICT DO NOTHING for idempotency
      const [vote] = await tx
        .insert(reviewHelpfulVotes)
        .values({ reviewId, userId })
        .onConflictDoNothing()
        .returning();

      // If no vote was inserted (already exists), fetch the existing vote
      if (!vote) {
        const [existingVote] = await tx
          .select()
          .from(reviewHelpfulVotes)
          .where(
            and(
              eq(reviewHelpfulVotes.reviewId, reviewId),
              eq(reviewHelpfulVotes.userId, userId)
            )
          );
        return existingVote;
      }

      // Only update counter if a new vote was actually inserted
      await tx
        .update(productReviews)
        .set({
          helpfulVotes: sql`${productReviews.helpfulVotes} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(productReviews.id, reviewId));

      return vote;
    });
  }

  async removeHelpfulVote(reviewId: string, userId: string): Promise<void> {
    // Use transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      const result = await tx
        .delete(reviewHelpfulVotes)
        .where(
          and(
            eq(reviewHelpfulVotes.reviewId, reviewId),
            eq(reviewHelpfulVotes.userId, userId)
          )
        )
        .returning();

      // Only decrement if we actually deleted a vote
      if (result.length > 0) {
        await tx
          .update(productReviews)
          .set({
            helpfulVotes: sql`GREATEST(${productReviews.helpfulVotes} - 1, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(productReviews.id, reviewId));
      }
    });
  }

  async hasUserVotedHelpful(reviewId: string, userId: string): Promise<boolean> {
    const [vote] = await db
      .select()
      .from(reviewHelpfulVotes)
      .where(
        and(
          eq(reviewHelpfulVotes.reviewId, reviewId),
          eq(reviewHelpfulVotes.userId, userId)
        )
      );
    return !!vote;
  }

  async getHelpfulVoteCount(reviewId: string): Promise<number> {
    const votes = await db
      .select()
      .from(reviewHelpfulVotes)
      .where(eq(reviewHelpfulVotes.reviewId, reviewId));
    return votes.length;
  }

  // Synchronize helpful vote counters with actual vote counts
  async syncHelpfulVoteCounters(): Promise<void> {
    // Get all reviews with their actual vote counts
    const reviewsWithVoteCounts = await db
      .select({
        reviewId: productReviews.id,
        currentCounter: productReviews.helpfulVotes,
        actualVoteCount: sql<number>`count(${reviewHelpfulVotes.id})`
      })
      .from(productReviews)
      .leftJoin(reviewHelpfulVotes, eq(productReviews.id, reviewHelpfulVotes.reviewId))
      .groupBy(productReviews.id, productReviews.helpfulVotes);

    // Update counters that don't match actual counts
    for (const review of reviewsWithVoteCounts) {
      if (review.currentCounter !== review.actualVoteCount) {
        await db
          .update(productReviews)
          .set({
            helpfulVotes: review.actualVoteCount,
            updatedAt: new Date(),
          })
          .where(eq(productReviews.id, review.reviewId));
      }
    }
  }

  // Support operations
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [newTicket] = await db.insert(supportTickets).values(ticket).returning();
    return newTicket;
  }

  async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    if (userId) {
      return await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, userId))
        .orderBy(desc(supportTickets.createdAt));
    }
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicket(id: string, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    const [updated] = await db
      .update(supportTickets)
      .set({ ...ticket, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updated;
  }

  // Inventory management operations
  async getInventoryHistory(productId?: string): Promise<InventoryHistory[]> {
    if (productId) {
      return await db
        .select()
        .from(inventoryHistory)
        .where(eq(inventoryHistory.productId, productId))
        .orderBy(desc(inventoryHistory.createdAt));
    }
    return await db.select().from(inventoryHistory).orderBy(desc(inventoryHistory.createdAt));
  }

  async addInventoryHistory(history: InsertInventoryHistory): Promise<InventoryHistory> {
    const [newHistory] = await db.insert(inventoryHistory).values(history).returning();
    return newHistory;
  }

  async getStockAlerts(status?: string): Promise<StockAlert[]> {
    if (status) {
      return await db
        .select()
        .from(stockAlerts)
        .where(eq(stockAlerts.status, status))
        .orderBy(desc(stockAlerts.notifiedAt));
    }
    return await db.select().from(stockAlerts).orderBy(desc(stockAlerts.notifiedAt));
  }

  async createStockAlert(alert: InsertStockAlert): Promise<StockAlert> {
    const [newAlert] = await db.insert(stockAlerts).values(alert).returning();
    return newAlert;
  }

  async resolveStockAlert(id: string): Promise<StockAlert | undefined> {
    const [resolved] = await db
      .update(stockAlerts)
      .set({ status: 'resolved', resolvedAt: new Date() })
      .where(eq(stockAlerts.id, id))
      .returning();
    return resolved;
  }

  async dismissStockAlert(id: string): Promise<void> {
    await db.delete(stockAlerts).where(eq(stockAlerts.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.inStock} <= ${products.lowStockThreshold}`)
      .orderBy(asc(products.inStock));
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.inStock, 0))
      .orderBy(asc(products.name));
  }

  async getReorderPointProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.inStock} <= ${products.reorderPoint}`)
      .orderBy(asc(products.inStock));
  }

  async updateProductInventory(productId: string, updates: {
    inStock?: number;
    lowStockThreshold?: number;
    reorderPoint?: number;
    maxStock?: number;
    sku?: string;
    supplier?: string;
    costPrice?: string;
  }): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();
    return updated;
  }

  async adjustStock(productId: string, adjustment: number, reason: string, userId?: string, reference?: string): Promise<void> {
    // Get current product
    const product = await this.getProduct(productId);
    if (!product) throw new Error("Product not found");
    
    const oldStock = product.inStock;
    const newStock = Math.max(0, oldStock + adjustment);
    
    // Update product stock atomically
    await db.transaction(async (tx) => {
      // Update product stock
      await tx
        .update(products)
        .set({ inStock: newStock, updatedAt: new Date() })
        .where(eq(products.id, productId));
      
      // Add history record
      await tx.insert(inventoryHistory).values({
        productId,
        changeType: adjustment > 0 ? 'stock_in' : 'stock_out',
        quantityBefore: oldStock,
        quantityChanged: Math.abs(adjustment),
        quantityAfter: newStock,
        reason,
        reference,
        userId,
      });
      
      // Check if stock alert needed - with deduplication
      if (newStock <= product.lowStockThreshold && oldStock > product.lowStockThreshold) {
        // Check for existing active low_stock alert
        const existingLowStockAlert = await tx
          .select()
          .from(stockAlerts)
          .where(and(
            eq(stockAlerts.productId, productId),
            eq(stockAlerts.alertType, 'low_stock'),
            eq(stockAlerts.status, 'active')
          ));
        
        if (existingLowStockAlert.length === 0) {
          await tx.insert(stockAlerts).values({
            productId,
            alertType: 'low_stock',
            currentStock: newStock,
            threshold: product.lowStockThreshold,
            status: 'active',
          });
        }
      }
      
      if (newStock === 0 && oldStock > 0) {
        // Check for existing active out_of_stock alert
        const existingOutOfStockAlert = await tx
          .select()
          .from(stockAlerts)
          .where(and(
            eq(stockAlerts.productId, productId),
            eq(stockAlerts.alertType, 'out_of_stock'),
            eq(stockAlerts.status, 'active')
          ));
        
        if (existingOutOfStockAlert.length === 0) {
          await tx.insert(stockAlerts).values({
            productId,
            alertType: 'out_of_stock',
            currentStock: newStock,
            threshold: 0,
            status: 'active',
          });
        }
      }
    });
  }

  async bulkUpdateStock(updates: Array<{ productId: string; newStock: number; reason?: string; userId?: string }>): Promise<void> {
    await db.transaction(async (tx) => {
      for (const update of updates) {
        const product = await tx.select().from(products).where(eq(products.id, update.productId));
        if (product[0]) {
          const oldStock = product[0].inStock;
          const adjustment = update.newStock - oldStock;
          
          // Update stock
          await tx
            .update(products)
            .set({ inStock: update.newStock, updatedAt: new Date() })
            .where(eq(products.id, update.productId));
          
          // Add history
          await tx.insert(inventoryHistory).values({
            productId: update.productId,
            changeType: 'bulk_update',
            quantityBefore: oldStock,
            quantityChanged: Math.abs(adjustment),
            quantityAfter: update.newStock,
            reason: update.reason || 'Bulk stock update',
            userId: update.userId,
          });
        }
      }
    });
  }

  async getInventoryReport(): Promise<{
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    reorderPointCount: number;
    totalInventoryValue: number;
    averageStockLevel: number;
  }> {
    const allProducts = await db.select().from(products);
    
    const totalProducts = allProducts.length;
    const lowStockCount = allProducts.filter(p => p.inStock <= p.lowStockThreshold).length;
    const outOfStockCount = allProducts.filter(p => p.inStock === 0).length;
    const reorderPointCount = allProducts.filter(p => p.inStock <= p.reorderPoint).length;
    
    const totalInventoryValue = allProducts.reduce((sum, p) => {
      const cost = p.costPrice ? parseFloat(p.costPrice) : parseFloat(p.price);
      return sum + (cost * p.inStock);
    }, 0);
    
    const totalStock = allProducts.reduce((sum, p) => sum + p.inStock, 0);
    const averageStockLevel = totalProducts > 0 ? totalStock / totalProducts : 0;
    
    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      reorderPointCount,
      totalInventoryValue,
      averageStockLevel,
    };
  }

  // ==============================================================================
  // ADMIN INVENTORY OVERSIGHT IMPLEMENTATIONS (Task 15g)
  // ==============================================================================

  async getAdminInventoryOverview(query: InventoryOverviewQuery): Promise<InventoryOverviewResponse> {
    const { page, limit, search, category, stockStatus, sortBy, sortOrder, includeValue } = query;
    const offset = (page - 1) * limit;
    
    // Build base query conditions
    const conditions = [];
    
    if (search) {
      conditions.push(or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku, `%${search}%`)
      ));
    }
    
    if (category) {
      conditions.push(eq(products.category, category));
    }
    
    // Apply stock status filter
    if (stockStatus !== 'all') {
      if (stockStatus === 'out-of-stock') {
        conditions.push(eq(products.inStock, 0));
      } else if (stockStatus === 'low-stock') {
        conditions.push(and(
          sql`${products.inStock} > 0`,
          sql`${products.inStock} <= ${products.lowStockThreshold}`
        ));
      } else if (stockStatus === 'in-stock') {
        conditions.push(sql`${products.inStock} > ${products.lowStockThreshold}`);
      }
    }
    
    // Get total count for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(products);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const totalCountResult = await countQuery;
    const total = totalCountResult[0]?.count || 0;
    
    // Get products with sorting and pagination
    let productsQuery = db.select().from(products);
    if (conditions.length > 0) {
      productsQuery = productsQuery.where(and(...conditions));
    }
    
    // Apply sorting
    if (sortBy === 'name') {
      productsQuery = productsQuery.orderBy(sortOrder === 'desc' ? desc(products.name) : asc(products.name));
    } else if (sortBy === 'inStock') {
      productsQuery = productsQuery.orderBy(sortOrder === 'desc' ? desc(products.inStock) : asc(products.inStock));
    } else if (sortBy === 'category') {
      productsQuery = productsQuery.orderBy(sortOrder === 'desc' ? desc(products.category) : asc(products.category));
    } else if (sortBy === 'updatedAt') {
      productsQuery = productsQuery.orderBy(sortOrder === 'desc' ? desc(products.updatedAt) : asc(products.updatedAt));
    }
    
    const productsResult = await productsQuery.limit(limit).offset(offset);
    
    // Calculate reserved stock (simplified - in real implementation would check pending orders)
    const reservedStockMap = new Map(); // product_id -> reserved_amount
    
    // Transform products data
    const productsData = productsResult.map(product => {
      const reserved = reservedStockMap.get(product.id) || 0;
      const available = Math.max(0, product.inStock - reserved);
      const costPrice = product.costPrice ? parseFloat(product.costPrice) : null;
      const totalValue = costPrice ? costPrice * product.inStock : null;
      
      let status: 'in-stock' | 'low-stock' | 'out-of-stock';
      if (product.inStock === 0) {
        status = 'out-of-stock';
      } else if (product.inStock <= product.lowStockThreshold) {
        status = 'low-stock';
      } else {
        status = 'in-stock';
      }
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        inStock: product.inStock,
        reserved,
        available,
        lowStockThreshold: product.lowStockThreshold,
        reorderPoint: product.reorderPoint,
        maxStock: product.maxStock,
        costPrice,
        totalValue,
        status,
        lastRestockDate: null, // Would need to query inventory history for actual date
        supplier: product.supplier,
        updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
      };
    });
    
    // Calculate summary statistics
    const allProducts = await db.select().from(products);
    const summary = {
      totalProducts: allProducts.length,
      inStockCount: allProducts.filter(p => p.inStock > p.lowStockThreshold).length,
      lowStockCount: allProducts.filter(p => p.inStock > 0 && p.inStock <= p.lowStockThreshold).length,
      outOfStockCount: allProducts.filter(p => p.inStock === 0).length,
      totalInventoryValue: allProducts.reduce((sum, p) => {
        const cost = p.costPrice ? parseFloat(p.costPrice) : parseFloat(p.price);
        return sum + (cost * p.inStock);
      }, 0),
      totalUnits: allProducts.reduce((sum, p) => sum + p.inStock, 0),
      averageStockLevel: allProducts.length > 0 ? allProducts.reduce((sum, p) => sum + p.inStock, 0) / allProducts.length : 0,
      criticalAlerts: allProducts.filter(p => p.inStock === 0).length, // Out of stock alerts
    };
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      products: productsData,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getAdminLowStockAlerts(query: LowStockAlertsQuery): Promise<LowStockAlertsResponse> {
    const { page, limit, urgency, category, alertType, sortBy, sortOrder, includeResolved } = query;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    
    if (!includeResolved) {
      conditions.push(eq(stockAlerts.status, 'active'));
    }
    
    if (alertType !== 'all') {
      conditions.push(eq(stockAlerts.alertType, alertType));
    }
    
    // Get alerts with product details
    const alertsQuery = db
      .select({
        alert: stockAlerts,
        product: products,
      })
      .from(stockAlerts)
      .innerJoin(products, eq(stockAlerts.productId, products.id));
    
    if (conditions.length > 0) {
      alertsQuery.where(and(...conditions));
    }
    
    if (category) {
      alertsQuery.where(eq(products.category, category));
    }
    
    const alertsResult = await alertsQuery;
    
    // Process and filter alerts
    const processedAlerts = alertsResult.map(row => {
      const { alert, product } = row;
      
      // Calculate urgency based on stock levels and thresholds
      let calculatedUrgency: 'critical' | 'high' | 'medium' | 'low';
      if (alert.alertType === 'out_of_stock') {
        calculatedUrgency = 'critical';
      } else if (product.inStock <= (product.reorderPoint * 0.5)) {
        calculatedUrgency = 'high';
      } else if (product.inStock <= product.reorderPoint) {
        calculatedUrgency = 'medium';
      } else {
        calculatedUrgency = 'low';
      }
      
      // Calculate days until stockout (simplified calculation)
      const avgDailyUsage = 2; // This would be calculated from historical data
      const daysUntilStockout = avgDailyUsage > 0 ? Math.floor(product.inStock / avgDailyUsage) : null;
      
      return {
        id: alert.id,
        productId: alert.productId,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        currentStock: alert.currentStock,
        threshold: alert.threshold,
        alertType: alert.alertType,
        urgency: calculatedUrgency,
        daysUntilStockout,
        supplier: product.supplier,
        lastRestockDate: null, // Would calculate from inventory history
        avgDailyUsage,
        status: alert.status,
        notifiedAt: alert.notifiedAt?.toISOString() || new Date().toISOString(),
        resolvedAt: alert.resolvedAt?.toISOString() || null,
      };
    });
    
    // Filter by urgency if specified
    const filteredAlerts = urgency === 'all' ? processedAlerts : processedAlerts.filter(alert => alert.urgency === urgency);
    
    // Apply sorting
    filteredAlerts.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'urgency') {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        comparison = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      } else if (sortBy === 'currentStock') {
        comparison = a.currentStock - b.currentStock;
      } else if (sortBy === 'threshold') {
        comparison = a.threshold - b.threshold;
      } else if (sortBy === 'productName') {
        comparison = a.productName.localeCompare(b.productName);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Paginate results
    const total = filteredAlerts.length;
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);
    
    // Calculate summary
    const summary = {
      totalAlerts: total,
      criticalAlerts: filteredAlerts.filter(a => a.urgency === 'critical').length,
      highAlerts: filteredAlerts.filter(a => a.urgency === 'high').length,
      mediumAlerts: filteredAlerts.filter(a => a.urgency === 'medium').length,
      resolvedToday: 0, // Would calculate from database
      estimatedStockoutValue: 0, // Would calculate based on product prices
    };
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      alerts: paginatedAlerts,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async performAdminBulkAdjustment(adjustments: AdminBulkAdjustment, adminUserId: string): Promise<BulkOperation> {
    const { adjustments: adjustmentsList, operationDescription, bulkOperationType } = adjustments;
    
    // Create bulk operation record
    const bulkOperation = await this.createBulkOperation({
      operationType: bulkOperationType,
      description: operationDescription,
      adminUserId,
      totalItems: adjustmentsList.length,
      status: 'pending',
    });
    
    // Process adjustments in transaction
    try {
      await this.updateBulkOperationStatus(bulkOperation.id, 'in_progress');
      
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];
      
      await db.transaction(async (tx) => {
        for (const adjustment of adjustmentsList) {
          try {
            // Get current product
            const product = await tx.select().from(products).where(eq(products.id, adjustment.productId));
            if (!product[0]) {
              throw new Error(`Product not found: ${adjustment.productId}`);
            }
            
            const currentProduct = product[0];
            const oldStock = currentProduct.inStock;
            const newStock = Math.max(0, oldStock + adjustment.quantity);
            
            // Update product stock
            await tx
              .update(products)
              .set({ inStock: newStock, updatedAt: new Date() })
              .where(eq(products.id, adjustment.productId));
            
            // Add inventory history record
            await tx.insert(inventoryHistory).values({
              productId: adjustment.productId,
              changeType: 'bulk_adjustment',
              quantityBefore: oldStock,
              quantityChanged: Math.abs(adjustment.quantity),
              quantityAfter: newStock,
              reason: adjustment.reason,
              reference: adjustment.reference,
              userId: adminUserId,
              bulkOperationId: bulkOperation.id,
              adjustmentType: adjustment.adjustmentType,
              notes: adjustment.notes,
              isSystemChange: false,
            });
            
            successCount++;
          } catch (error) {
            failureCount++;
            errors.push(`Product ${adjustment.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      });
      
      // Update bulk operation with results
      const finalStatus = failureCount === 0 ? 'completed' : (successCount > 0 ? 'partially_completed' : 'failed');
      const errorLog = errors.length > 0 ? JSON.stringify(errors) : null;
      
      const updatedOperation = await this.updateBulkOperationStatus(
        bulkOperation.id,
        finalStatus,
        successCount,
        failureCount,
        errorLog
      );
      
      return updatedOperation || bulkOperation;
    } catch (error) {
      await this.updateBulkOperationStatus(bulkOperation.id, 'failed', 0, adjustmentsList.length, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getAdminInventoryAudit(query: InventoryAuditQuery): Promise<InventoryAuditResponse> {
    const { page, limit, productId, adminUserId, changeType, adjustmentType, bulkOperationId, dateFrom, dateTo, search, sortBy, sortOrder, includeSystemChanges } = query;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    const conditions = [];
    
    if (productId) {
      conditions.push(eq(inventoryHistory.productId, productId));
    }
    
    if (adminUserId) {
      conditions.push(eq(inventoryHistory.userId, adminUserId));
    }
    
    if (changeType !== 'all') {
      conditions.push(eq(inventoryHistory.changeType, changeType));
    }
    
    if (adjustmentType !== 'all') {
      conditions.push(eq(inventoryHistory.adjustmentType, adjustmentType));
    }
    
    if (bulkOperationId) {
      conditions.push(eq(inventoryHistory.bulkOperationId, bulkOperationId));
    }
    
    if (!includeSystemChanges) {
      conditions.push(eq(inventoryHistory.isSystemChange, false));
    }
    
    if (dateFrom) {
      conditions.push(sql`${inventoryHistory.createdAt} >= ${new Date(dateFrom)}`);
    }
    
    if (dateTo) {
      conditions.push(sql`${inventoryHistory.createdAt} <= ${new Date(dateTo)}`);
    }
    
    if (search) {
      conditions.push(or(
        ilike(inventoryHistory.reason, `%${search}%`),
        ilike(inventoryHistory.notes, `%${search}%`),
        ilike(inventoryHistory.reference, `%${search}%`)
      ));
    }
    
    // Get audit records with product and user details
    const auditQuery = db
      .select({
        history: inventoryHistory,
        product: products,
        user: users,
        bulkOp: bulkOperations,
      })
      .from(inventoryHistory)
      .leftJoin(products, eq(inventoryHistory.productId, products.id))
      .leftJoin(users, eq(inventoryHistory.userId, users.id))
      .leftJoin(bulkOperations, eq(inventoryHistory.bulkOperationId, bulkOperations.id));
    
    if (conditions.length > 0) {
      auditQuery.where(and(...conditions));
    }
    
    // Apply sorting
    if (sortBy === 'createdAt') {
      auditQuery.orderBy(sortOrder === 'desc' ? desc(inventoryHistory.createdAt) : asc(inventoryHistory.createdAt));
    } else if (sortBy === 'productName') {
      auditQuery.orderBy(sortOrder === 'desc' ? desc(products.name) : asc(products.name));
    } else if (sortBy === 'changeType') {
      auditQuery.orderBy(sortOrder === 'desc' ? desc(inventoryHistory.changeType) : asc(inventoryHistory.changeType));
    } else if (sortBy === 'quantityChanged') {
      auditQuery.orderBy(sortOrder === 'desc' ? desc(inventoryHistory.quantityChanged) : asc(inventoryHistory.quantityChanged));
    }
    
    // Get total count for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(inventoryHistory);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const totalCountResult = await countQuery;
    const total = totalCountResult[0]?.count || 0;
    
    // Get paginated results
    const auditResult = await auditQuery.limit(limit).offset(offset);
    
    // Transform data
    const historyData = auditResult.map(row => ({
      id: row.history.id,
      productId: row.history.productId,
      productName: row.product?.name || 'Unknown Product',
      changeType: row.history.changeType,
      adjustmentType: row.history.adjustmentType,
      quantityBefore: row.history.quantityBefore,
      quantityChanged: row.history.quantityChanged,
      quantityAfter: row.history.quantityAfter,
      reason: row.history.reason,
      notes: row.history.notes,
      reference: row.history.reference,
      userId: row.history.userId,
      adminUserName: row.user ? `${row.user.firstName} ${row.user.lastName}` : null,
      bulkOperationId: row.history.bulkOperationId,
      bulkOperationDescription: row.bulkOp?.description || null,
      isSystemChange: row.history.isSystemChange,
      metadata: row.history.metadata,
      createdAt: row.history.createdAt?.toISOString() || new Date().toISOString(),
    }));
    
    // Calculate summary
    const allHistory = await db.select().from(inventoryHistory);
    const summary = {
      totalChanges: allHistory.length,
      totalAdjustments: allHistory.filter(h => h.changeType === 'adjustment' || h.changeType === 'bulk_adjustment').length,
      totalBulkOperations: (await db.select().from(bulkOperations)).length,
      netStockChange: allHistory.reduce((sum, h) => sum + (h.changeType === 'stock_in' ? h.quantityChanged : -h.quantityChanged), 0),
      mostActiveAdmin: null, // Would need more complex query to calculate
    };
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      history: historyData,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async exportInventoryData(exportConfig: InventoryExport): Promise<string> {
    const { format, type, filters, includeMetadata } = exportConfig;
    
    // This is a simplified implementation - in a real app you'd use a proper CSV/Excel library
    let data: any[] = [];
    let headers: string[] = [];
    
    if (type === 'overview') {
      const productsList = await db.select().from(products);
      headers = ['ID', 'Name', 'SKU', 'Category', 'In Stock', 'Low Stock Threshold', 'Reorder Point', 'Supplier'];
      data = productsList.map(p => [
        p.id,
        p.name,
        p.sku || '',
        p.category,
        p.inStock,
        p.lowStockThreshold,
        p.reorderPoint,
        p.supplier || ''
      ]);
    } else if (type === 'audit_trail') {
      const history = await db.select().from(inventoryHistory).orderBy(desc(inventoryHistory.createdAt));
      headers = ['Date', 'Product ID', 'Change Type', 'Quantity Before', 'Quantity Changed', 'Quantity After', 'Reason', 'Admin User'];
      data = history.map(h => [
        h.createdAt?.toISOString() || '',
        h.productId,
        h.changeType,
        h.quantityBefore,
        h.quantityChanged,
        h.quantityAfter,
        h.reason || '',
        h.userId || ''
      ]);
    } else if (type === 'low_stock_alerts') {
      const alerts = await db.select().from(stockAlerts).where(eq(stockAlerts.status, 'active'));
      headers = ['Product ID', 'Alert Type', 'Current Stock', 'Threshold', 'Notified At'];
      data = alerts.map(a => [
        a.productId,
        a.alertType,
        a.currentStock,
        a.threshold,
        a.notifiedAt?.toISOString() || ''
      ]);
    }
    
    // Convert to CSV format
    const csvHeader = headers.join(',');
    const csvRows = data.map(row => row.map(cell => `"${cell}"`).join(','));
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    return csvContent;
  }

  async getBulkOperationStatus(operationId: string): Promise<BulkOperationStatus | undefined> {
    const operation = await db
      .select({
        operation: bulkOperations,
        user: users,
      })
      .from(bulkOperations)
      .leftJoin(users, eq(bulkOperations.adminUserId, users.id))
      .where(eq(bulkOperations.id, operationId));
    
    if (!operation[0]) {
      return undefined;
    }
    
    const { operation: op, user } = operation[0];
    
    // Calculate progress
    const progress = op.totalItems > 0 ? 
      Math.round(((op.successCount + op.failureCount) / op.totalItems) * 100) : 0;
    
    return {
      id: op.id,
      operationType: op.operationType,
      description: op.description || '',
      adminUserId: op.adminUserId,
      adminUserName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Admin',
      totalItems: op.totalItems,
      successCount: op.successCount,
      failureCount: op.failureCount,
      status: op.status,
      fileName: op.fileName,
      errorLog: op.errorLog,
      startedAt: op.startedAt?.toISOString() || new Date().toISOString(),
      completedAt: op.completedAt?.toISOString() || null,
      progress,
      estimatedTimeRemaining: null, // Would calculate based on progress and elapsed time
    };
  }

  async processCsvInventoryUpload(csvData: CsvUpload, adminUserId: string): Promise<BulkOperation> {
    // This is a placeholder implementation - in a real app you'd parse the CSV file
    const bulkOperation = await this.createBulkOperation({
      operationType: 'csv_upload',
      description: csvData.operationDescription,
      adminUserId,
      totalItems: 0, // Would be determined after parsing CSV
      fileName: csvData.fileName,
      fileSize: csvData.fileSize,
      status: 'pending',
    });
    
    // In a real implementation, you would:
    // 1. Parse the CSV file
    // 2. Validate each row
    // 3. Process the adjustments
    // 4. Update the bulk operation status
    
    return bulkOperation;
  }

  async createBulkOperation(operation: InsertBulkOperation): Promise<BulkOperation> {
    const [newOperation] = await db.insert(bulkOperations).values(operation).returning();
    return newOperation;
  }

  async updateBulkOperationStatus(operationId: string, status: string, successCount?: number, failureCount?: number, errorLog?: string): Promise<BulkOperation | undefined> {
    const updateData: any = { status };
    
    if (successCount !== undefined) {
      updateData.successCount = successCount;
    }
    
    if (failureCount !== undefined) {
      updateData.failureCount = failureCount;
    }
    
    if (errorLog) {
      updateData.errorLog = errorLog;
    }
    
    if (status === 'completed' || status === 'failed' || status === 'partially_completed') {
      updateData.completedAt = new Date();
    }
    
    const [updated] = await db
      .update(bulkOperations)
      .set(updateData)
      .where(eq(bulkOperations.id, operationId))
      .returning();
    
    return updated;
  }

  // Password reset operations
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    // Hash the token before storing for security
    const hashedToken = hashToken(token);
    const [resetToken] = await db.insert(passwordResetTokens).values({
      email,
      token: hashedToken,
      expiresAt,
    }).returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    // Hash the token before querying
    const hashedToken = hashToken(token);
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, hashedToken));
    return resetToken;
  }

  async validatePasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    // Hash the token before querying
    const hashedToken = hashToken(token);
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          eq(passwordResetTokens.used, false),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      );
    return resetToken;
  }

  async consumePasswordResetToken(token: string): Promise<boolean> {
    // Hash the token before querying
    const hashedToken = hashToken(token);
    const result = await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(
        and(
          eq(passwordResetTokens.token, hashedToken),
          eq(passwordResetTokens.used, false),
          sql`${passwordResetTokens.expiresAt} > NOW()`
        )
      )
      .returning();
    return result.length > 0;
  }

  async cleanupExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} <= NOW()`);
  }

  // Email verification operations - Updated to use user table fields
  async createEmailVerificationToken(userId: string, email: string, token: string, expiresAt: Date): Promise<EmailVerificationToken> {
    // Hash the token before storing for security
    const hashedToken = hashToken(token);
    
    // Update user with verification token and expiry
    const [updatedUser] = await db
      .update(users)
      .set({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    // Return a compatible EmailVerificationToken object
    return {
      id: userId,
      userId,
      email,
      token: hashedToken,
      expiresAt,
      used: false,
      createdAt: new Date()
    };
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    // Hash the token before querying
    const hashedToken = hashToken(token);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, hashedToken));
    
    if (!user || !user.emailVerificationToken) {
      return undefined;
    }

    // Return a compatible EmailVerificationToken object
    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      token: user.emailVerificationToken,
      expiresAt: user.emailVerificationTokenExpiry!,
      used: user.emailVerified, // If email is verified, token is considered used
      createdAt: user.createdAt!
    };
  }

  async validateEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    // Hash the token before querying
    const hashedToken = hashToken(token);
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, hashedToken),
          eq(users.emailVerified, false), // Token not used (email not verified)
          sql`${users.emailVerificationTokenExpiry} > NOW()` // Token not expired
        )
      );
    
    if (!user || !user.emailVerificationToken) {
      return undefined;
    }

    // Return a compatible EmailVerificationToken object
    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      token: user.emailVerificationToken,
      expiresAt: user.emailVerificationTokenExpiry!,
      used: false,
      createdAt: user.createdAt!
    };
  }

  async consumeEmailVerificationToken(token: string): Promise<boolean> {
    // Hash the token before querying
    const hashedToken = hashToken(token);
    const result = await db
      .update(users)
      .set({ 
        emailVerified: true,
        emailVerificationToken: null, // Clear the token
        emailVerificationTokenExpiry: null, // Clear the expiry
        updatedAt: new Date()
      })
      .where(
        and(
          eq(users.emailVerificationToken, hashedToken),
          eq(users.emailVerified, false),
          sql`${users.emailVerificationTokenExpiry} > NOW()`
        )
      )
      .returning();
    return result.length > 0;
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserEmailVerification(userId: string, verified: boolean): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        emailVerified: verified,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async cleanupExpiredEmailVerificationTokens(): Promise<void> {
    await db
      .delete(emailVerificationTokens)
      .where(sql`${emailVerificationTokens.expiresAt} <= NOW()`);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotifications(userId?: string, unreadOnly?: boolean): Promise<Notification[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }
    
    if (unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }
    
    const baseQuery = db.select().from(notifications);
    
    if (conditions.length > 0) {
      return await baseQuery
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));
    }
    
    return await baseQuery.orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async updateNotificationEmailStatus(id: string, emailSent: boolean): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ 
        emailSent,
        emailSentAt: emailSent ? new Date() : null
      })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql`COUNT(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    return Number(result[0]?.count || 0);
  }

  async cleanupOldNotifications(daysToKeep = 30): Promise<void> {
    await db
      .delete(notifications)
      .where(sql`${notifications.createdAt} < NOW() - INTERVAL '${daysToKeep} days'`);
  }

  // Enhanced profile management operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db
      .insert(userPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }

  async updateUserPreferences(userId: string, preferences: Partial<UpdateUserPreferences>): Promise<UserPreferences | undefined> {
    const updateData: Partial<typeof userPreferences.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (preferences.emailNotifications !== undefined) {
      updateData.emailNotifications = preferences.emailNotifications;
    }
    if (preferences.privacySettings !== undefined) {
      updateData.privacySettings = preferences.privacySettings;
    }
    if (preferences.displayPreferences !== undefined) {
      updateData.displayPreferences = preferences.displayPreferences;
    }

    const [updatedPreferences] = await db
      .update(userPreferences)
      .set(updateData)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return updatedPreferences;
  }

  async updateProfileImage(userId: string, imageUrl: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        profileImageUrl: imageUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const { comparePassword, hashPassword } = await import("./jwtAuth");
    
    // Get current user
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return false;
    }

    // Hash new password and update
    const hashedNewPassword = await hashPassword(newPassword);
    const [updatedUser] = await db
      .update(users)
      .set({ 
        password: hashedNewPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return !!updatedUser;
  }

  async deleteUserAccount(userId: string, password: string): Promise<boolean> {
    const { comparePassword } = await import("./jwtAuth");
    
    // Get current user
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return false;
    }

    // Delete user (cascade will handle related data)
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    return result.length > 0;
  }

  async getRecentOrders(userId: string, limit = 5): Promise<Order[]> {
    const recentOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
    return recentOrders;
  }

  // =============================================================================
  // EMAIL QUEUE OPERATIONS FOR PERSISTENT EMAIL DELIVERY
  // =============================================================================

  async enqueueEmail(email: InsertEmailQueue): Promise<EmailQueue> {
    const [newEmail] = await db.insert(emailQueue).values(email).returning();
    return newEmail;
  }

  async dequeueReadyEmails(limit = 50): Promise<EmailQueue[]> {
    const readyEmails = await db
      .select()
      .from(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'pending'),
          sql`${emailQueue.scheduledAt} <= NOW()`,
          sql`${emailQueue.retryCount} <= ${emailQueue.maxRetries}`
        )
      )
      .orderBy(asc(emailQueue.priority), asc(emailQueue.createdAt))
      .limit(limit);
    
    return readyEmails;
  }

  async updateEmailStatus(
    id: string, 
    status: string, 
    messageId?: string, 
    deliveryStatus?: string, 
    sentAt?: Date
  ): Promise<EmailQueue | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (messageId) updateData.messageId = messageId;
    if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
    if (sentAt) updateData.sentAt = sentAt;
    
    const [updated] = await db
      .update(emailQueue)
      .set(updateData)
      .where(eq(emailQueue.id, id))
      .returning();
    
    return updated;
  }

  async markEmailAsFailed(id: string, error: string): Promise<EmailQueue | undefined> {
    const [updated] = await db
      .update(emailQueue)
      .set({ 
        status: 'failed', 
        lastError: error,
        updatedAt: new Date()
      })
      .where(eq(emailQueue.id, id))
      .returning();
    
    return updated;
  }

  async incrementEmailRetry(id: string, nextRetryAt: Date): Promise<EmailQueue | undefined> {
    const [updated] = await db
      .update(emailQueue)
      .set({ 
        retryCount: sql`${emailQueue.retryCount} + 1`,
        scheduledAt: nextRetryAt,
        updatedAt: new Date()
      })
      .where(eq(emailQueue.id, id))
      .returning();
    
    return updated;
  }

  async cleanupOldEmailQueue(daysToKeep = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await db
      .delete(emailQueue)
      .where(
        and(
          or(eq(emailQueue.status, 'sent'), eq(emailQueue.status, 'failed')),
          sql`${emailQueue.createdAt} < ${cutoffDate}`
        )
      );
  }

  async getEmailQueueStats(): Promise<{ pending: number; sent: number; failed: number; }> {
    const stats = await db
      .select({
        status: emailQueue.status,
        count: sql<number>`COUNT(*)::int`
      })
      .from(emailQueue)
      .groupBy(emailQueue.status);
    
    const result = { pending: 0, sent: 0, failed: 0 };
    stats.forEach(stat => {
      if (stat.status === 'pending') result.pending = stat.count;
      if (stat.status === 'sent') result.sent = stat.count;
      if (stat.status === 'failed') result.failed = stat.count;
    });
    
    return result;
  }

  // =============================================================================
  // EMAIL PREFERENCES AND UNSUBSCRIBE MANAGEMENT
  // =============================================================================

  async getEmailPreferences(email: string, userId?: string): Promise<EmailPreferences | undefined> {
    const whereClause = userId 
      ? eq(emailPreferences.userId, userId)
      : eq(emailPreferences.email, email);
    
    const [prefs] = await db
      .select()
      .from(emailPreferences)
      .where(whereClause);
    
    return prefs;
  }

  async createEmailPreferences(preferences: InsertEmailPreferences): Promise<EmailPreferences> {
    const [newPrefs] = await db.insert(emailPreferences).values(preferences).returning();
    return newPrefs;
  }

  async updateEmailPreferences(email: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences | undefined> {
    const [updated] = await db
      .update(emailPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(emailPreferences.email, email))
      .returning();
    
    return updated;
  }

  async unsubscribeEmail(token: string): Promise<EmailPreferences | undefined> {
    const [updated] = await db
      .update(emailPreferences)
      .set({ 
        marketingEmails: false,
        promotionalOffers: false,
        newsletterSubscription: false,
        unsubscribedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(emailPreferences.unsubscribeToken, token))
      .returning();
    
    return updated;
  }

  async checkEmailAllowed(email: string, emailType: string, userId?: string): Promise<boolean> {
    const prefs = await this.getEmailPreferences(email, userId);
    
    if (!prefs) return true; // Default to allowing emails if no preferences set
    
    // Check specific email type preferences
    switch (emailType) {
      case 'promotional':
      case 'newsletter':
        return (prefs.marketingEmails ?? false) && (prefs.promotionalOffers ?? false) && (prefs.newsletterSubscription ?? false);
      case 'order_confirmation':
      case 'payment_confirmation':
      case 'order_status_update':
        return prefs.orderUpdates ?? false;
      case 'stock_alert':
        return prefs.stockAlerts ?? false;
      case 'account_welcome':
      case 'email_verification':
      case 'password_reset':
        return prefs.accountNotifications ?? false;
      default:
        return true; // Allow transactional emails by default
    }
  }

  // =============================================================================
  // EMAIL RATE LIMITING
  // =============================================================================

  async checkRateLimit(identifier: string, priority: string, windowType: 'minute' | 'hour'): Promise<boolean> {
    const windowStart = new Date();
    if (windowType === 'minute') {
      windowStart.setSeconds(0, 0);
    } else {
      windowStart.setMinutes(0, 0, 0);
    }
    
    const [current] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(emailRateLimits)
      .where(
        and(
          eq(emailRateLimits.identifier, identifier),
          eq(emailRateLimits.priority, priority),
          eq(emailRateLimits.windowType, windowType),
          eq(emailRateLimits.window, windowStart)
        )
      );
    
    // Define rate limits based on priority
    const limits = {
      high: windowType === 'minute' ? 100 : 1000,
      normal: windowType === 'minute' ? 50 : 500,
      low: windowType === 'minute' ? 10 : 100
    };
    
    const limit = limits[priority as keyof typeof limits] || limits.normal;
    return (current?.count || 0) < limit;
  }

  async recordEmailSend(identifier: string, priority: string, windowType: 'minute' | 'hour'): Promise<void> {
    const windowStart = new Date();
    if (windowType === 'minute') {
      windowStart.setSeconds(0, 0);
    } else {
      windowStart.setMinutes(0, 0, 0);
    }
    
    // Use upsert to increment count or create new record
    await db
      .insert(emailRateLimits)
      .values({
        identifier,
        priority,
        windowType,
        window: windowStart,
        count: 1
      })
      .onConflictDoUpdate({
        target: [emailRateLimits.identifier, emailRateLimits.priority, emailRateLimits.windowType, emailRateLimits.window],
        set: { count: sql`${emailRateLimits.count} + 1` }
      });
  }

  async cleanupOldRateLimits(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // Keep last 24 hours
    
    await db
      .delete(emailRateLimits)
      .where(sql`${emailRateLimits.window} < ${cutoffDate}`);
  }

  // =============================================================================
  // SMS OPERATIONS IMPLEMENTATION
  // =============================================================================

  async createSmsQueue(sms: InsertSmsQueue): Promise<SmsQueue> {
    const [smsQueueEntry] = await db.insert(smsQueue).values(sms).returning();
    return smsQueueEntry;
  }

  async getPendingSmsQueue(): Promise<SmsQueue[]> {
    return await db
      .select()
      .from(smsQueue)
      .where(
        and(
          or(
            eq(smsQueue.status, 'pending'),
            eq(smsQueue.status, 'sending')
          )
        )
      )
      .orderBy(
        asc(smsQueue.priority), // high, normal, low
        asc(smsQueue.scheduledAt)
      );
  }

  async updateSmsQueueStatus(
    id: string, 
    status: string, 
    updates?: Record<string, any>
  ): Promise<SmsQueue | undefined> {
    const updateData = {
      status,
      updatedAt: new Date(),
      ...updates
    };

    const [updated] = await db
      .update(smsQueue)
      .set(updateData)
      .where(eq(smsQueue.id, id))
      .returning();

    return updated;
  }

  async updateSmsQueueRetry(
    id: string, 
    retryCount: number, 
    error?: string
  ): Promise<SmsQueue | undefined> {
    const [updated] = await db
      .update(smsQueue)
      .set({
        retryCount,
        lastError: error,
        updatedAt: new Date(),
      })
      .where(eq(smsQueue.id, id))
      .returning();

    return updated;
  }

  async updateSmsQueueStatusByTwilioSid(
    twilioSid: string, 
    status: string, 
    updates?: Record<string, any>
  ): Promise<SmsQueue | undefined> {
    const updateData = {
      status,
      updatedAt: new Date(),
      ...updates
    };

    const [updated] = await db
      .update(smsQueue)
      .set(updateData)
      .where(eq(smsQueue.twilioSid, twilioSid))
      .returning();

    return updated;
  }

  // SMS preferences operations
  async getSmsPreferences(
    phoneNumber: string, 
    userId?: string
  ): Promise<SmsPreferences | undefined> {
    if (userId) {
      const [preferences] = await db
        .select()
        .from(smsPreferences)
        .where(eq(smsPreferences.userId, userId));
      return preferences;
    } else {
      const [preferences] = await db
        .select()
        .from(smsPreferences)
        .where(eq(smsPreferences.phoneNumber, phoneNumber));
      return preferences;
    }
  }

  async createSmsPreferences(preferences: InsertSmsPreferences): Promise<SmsPreferences> {
    const [smsPrefs] = await db.insert(smsPreferences).values(preferences).returning();
    return smsPrefs;
  }

  async updateSmsPreferences(
    id: string, 
    preferences: Partial<InsertSmsPreferences>
  ): Promise<SmsPreferences | undefined> {
    const [updated] = await db
      .update(smsPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(smsPreferences.id, id))
      .returning();

    return updated;
  }

  async optInSms(phoneNumber: string, userId?: string): Promise<SmsPreferences> {
    // Generate unique opt-in token
    const optInToken = crypto.randomBytes(32).toString('hex');
    
    // Check if preferences already exist
    const existing = await this.getSmsPreferences(phoneNumber, userId);
    
    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(smsPreferences)
        .set({
          isOptedIn: true,
          optedInAt: new Date(),
          optedOutAt: null,
          updatedAt: new Date(),
        })
        .where(eq(smsPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(smsPreferences)
        .values({
          userId,
          phoneNumber,
          optInToken,
          isOptedIn: true,
          optedInAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  async optOutSms(phoneNumber: string, optInToken?: string): Promise<boolean> {
    try {
      const whereCondition = optInToken 
        ? and(
            eq(smsPreferences.phoneNumber, phoneNumber),
            eq(smsPreferences.optInToken, optInToken)
          )
        : eq(smsPreferences.phoneNumber, phoneNumber);

      const [updated] = await db
        .update(smsPreferences)
        .set({
          isOptedIn: false,
          optedOutAt: new Date(),
          updatedAt: new Date(),
        })
        .where(whereCondition)
        .returning();

      return !!updated;
    } catch (error) {
      console.error('Error opting out of SMS:', error);
      return false;
    }
  }

  // SMS rate limiting operations
  async getSmsRateLimitCount(
    identifier: string, 
    windowStart: Date, 
    windowType: string, 
    priority: string
  ): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(smsRateLimits)
      .where(
        and(
          eq(smsRateLimits.identifier, identifier),
          eq(smsRateLimits.windowType, windowType),
          eq(smsRateLimits.priority, priority),
          sql`${smsRateLimits.window} >= ${windowStart}`
        )
      );

    return result?.count || 0;
  }

  async incrementSmsRateLimit(identifier: string, priority: string): Promise<void> {
    const now = new Date();
    
    // Minute window
    const minuteWindow = new Date(now);
    minuteWindow.setSeconds(0, 0);
    
    // Hour window
    const hourWindow = new Date(now);
    hourWindow.setMinutes(0, 0, 0);
    
    // Insert minute counter
    await db
      .insert(smsRateLimits)
      .values({
        identifier,
        window: minuteWindow,
        windowType: 'minute',
        priority,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [smsRateLimits.identifier, smsRateLimits.window, smsRateLimits.windowType, smsRateLimits.priority],
        set: { count: sql`${smsRateLimits.count} + 1` }
      });

    // Insert hour counter
    await db
      .insert(smsRateLimits)
      .values({
        identifier,
        window: hourWindow,
        windowType: 'hour',
        priority,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [smsRateLimits.identifier, smsRateLimits.window, smsRateLimits.windowType, smsRateLimits.priority],
        set: { count: sql`${smsRateLimits.count} + 1` }
      });
  }

  // SMS delivery log operations
  async createSmsDeliveryLog(log: InsertSmsDeliveryLogs): Promise<SmsDeliveryLogs> {
    const [deliveryLog] = await db.insert(smsDeliveryLogs).values(log).returning();
    return deliveryLog;
  }

  async updateSmsDeliveryLogStatus(
    twilioSid: string, 
    updates: Record<string, any>
  ): Promise<SmsDeliveryLogs | undefined> {
    const [updated] = await db
      .update(smsDeliveryLogs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(smsDeliveryLogs.twilioSid, twilioSid))
      .returning();

    return updated;
  }

  async getSmsDeliveryLogs(smsQueueId?: string): Promise<SmsDeliveryLogs[]> {
    if (smsQueueId) {
      return await db
        .select()
        .from(smsDeliveryLogs)
        .where(eq(smsDeliveryLogs.smsQueueId, smsQueueId))
        .orderBy(desc(smsDeliveryLogs.createdAt));
    } else {
      return await db
        .select()
        .from(smsDeliveryLogs)
        .orderBy(desc(smsDeliveryLogs.createdAt))
        .limit(100);
    }
  }

  // =============================================================================
  // WHATSAPP QUEUE AND DELIVERY OPERATIONS
  // =============================================================================

  // WhatsApp queue operations for persistent WhatsApp delivery
  async createWhatsappQueue(whatsapp: InsertWhatsappQueue): Promise<WhatsappQueue> {
    const [whatsappQueueEntry] = await db.insert(whatsappQueue).values(whatsapp).returning();
    return whatsappQueueEntry;
  }

  async getPendingWhatsappQueue(): Promise<WhatsappQueue[]> {
    return await db
      .select()
      .from(whatsappQueue)
      .where(
        and(
          eq(whatsappQueue.status, 'pending'),
          or(
            eq(whatsappQueue.retryCount, 0),
            lte(whatsappQueue.scheduledAt, new Date())
          )
        )
      )
      .orderBy(
        asc(whatsappQueue.priority), // HIGH priority first
        asc(whatsappQueue.scheduledAt)
      );
  }

  async updateWhatsappQueueStatus(
    id: string, 
    status: string, 
    updates?: Record<string, any>
  ): Promise<WhatsappQueue | undefined> {
    const [updated] = await db
      .update(whatsappQueue)
      .set({
        status,
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(whatsappQueue.id, id))
      .returning();

    return updated;
  }

  async updateWhatsappQueueRetry(
    id: string, 
    retryCount: number, 
    error?: string
  ): Promise<WhatsappQueue | undefined> {
    const [updated] = await db
      .update(whatsappQueue)
      .set({
        retryCount,
        lastError: error,
        updatedAt: new Date(),
      })
      .where(eq(whatsappQueue.id, id))
      .returning();

    return updated;
  }

  async updateWhatsappQueueStatusByTwilioSid(
    twilioSid: string, 
    status: string, 
    updates?: Record<string, any>
  ): Promise<WhatsappQueue | undefined> {
    const [updated] = await db
      .update(whatsappQueue)
      .set({
        status,
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(whatsappQueue.twilioSid, twilioSid))
      .returning();

    return updated;
  }

  async getWhatsappQueueByTwilioSid(twilioSid: string): Promise<WhatsappQueue | undefined> {
    const [entry] = await db
      .select()
      .from(whatsappQueue)
      .where(eq(whatsappQueue.twilioSid, twilioSid))
      .limit(1);

    return entry;
  }

  // WhatsApp preferences operations for opt-in/opt-out management
  async getWhatsappPreferences(
    phoneNumber: string, 
    userId?: string
  ): Promise<WhatsappPreferences | undefined> {
    let query = db.select().from(whatsappPreferences);
    
    if (userId) {
      query = query.where(
        and(
          eq(whatsappPreferences.phoneNumber, phoneNumber),
          eq(whatsappPreferences.userId, userId)
        )
      );
    } else {
      query = query.where(eq(whatsappPreferences.phoneNumber, phoneNumber));
    }
    
    const [prefs] = await query.limit(1);
    return prefs;
  }

  async createWhatsappPreferences(preferences: InsertWhatsappPreferences): Promise<WhatsappPreferences> {
    const [whatsappPrefs] = await db.insert(whatsappPreferences).values(preferences).returning();
    return whatsappPrefs;
  }

  async updateWhatsappPreferences(
    id: string, 
    preferences: Partial<InsertWhatsappPreferences>
  ): Promise<WhatsappPreferences | undefined> {
    const [updated] = await db
      .update(whatsappPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(whatsappPreferences.id, id))
      .returning();

    return updated;
  }

  async createOrUpdateWhatsappPreferences(preferences: Partial<InsertWhatsappPreferences>): Promise<WhatsappPreferences> {
    if (!preferences.phoneNumber) {
      throw new Error('Phone number is required for WhatsApp preferences');
    }

    // Check if preferences already exist
    const existing = await this.getWhatsappPreferences(preferences.phoneNumber, preferences.userId);
    
    if (existing) {
      // Update existing preferences
      return await this.updateWhatsappPreferences(existing.id, preferences) || existing;
    } else {
      // Create new preferences with defaults
      const newPreferences: InsertWhatsappPreferences = {
        phoneNumber: preferences.phoneNumber,
        userId: preferences.userId,
        isOptedIn: preferences.isOptedIn ?? false,
        orderConfirmation: preferences.orderConfirmation ?? true,
        orderUpdates: preferences.orderUpdates ?? true,
        shippingNotifications: preferences.shippingNotifications ?? true,
        paymentConfirmations: preferences.paymentConfirmations ?? true,
        deliveryNotifications: preferences.deliveryNotifications ?? true,
        stockAlerts: preferences.stockAlerts ?? false,
        promotionalMessages: preferences.promotionalMessages ?? false,
        accountNotifications: preferences.accountNotifications ?? true,
        optInToken: preferences.optInToken,
        optInDate: preferences.optInDate,
        optInMethod: preferences.optInMethod,
        consentSource: preferences.consentSource,
        ...preferences,
      };
      
      return await this.createWhatsappPreferences(newPreferences);
    }
  }

  async updateWhatsappOptOut(
    phoneNumber: string, 
    userId?: string, 
    method: string = 'user_request'
  ): Promise<boolean> {
    try {
      const existing = await this.getWhatsappPreferences(phoneNumber, userId);
      
      if (existing) {
        await this.updateWhatsappPreferences(existing.id, {
          isOptedIn: false,
          optOutDate: new Date(),
          optOutMethod: method,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating WhatsApp opt-out:', error);
      return false;
    }
  }

  // WhatsApp rate limiting operations
  async getWhatsappRateLimitCount(
    identifier: string,
    windowStart: Date,
    windowType: string,
    priority: string
  ): Promise<number> {
    const [result] = await db
      .select({ count: whatsappRateLimits.count })
      .from(whatsappRateLimits)
      .where(
        and(
          eq(whatsappRateLimits.identifier, identifier),
          eq(whatsappRateLimits.window, windowType),
          eq(whatsappRateLimits.priority, priority),
          gte(whatsappRateLimits.windowStart, windowStart)
        )
      )
      .limit(1);

    return result?.count || 0;
  }

  async incrementWhatsappRateLimit(identifier: string, priority: string): Promise<void> {
    const now = new Date();
    const minuteWindow = new Date(now.getTime() - (now.getTime() % (60 * 1000)));
    const hourWindow = new Date(now.getTime() - (now.getTime() % (60 * 60 * 1000)));

    // Insert minute counter
    await db
      .insert(whatsappRateLimits)
      .values({
        identifier,
        window: 'minute',
        windowStart: minuteWindow,
        priority,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [whatsappRateLimits.identifier, whatsappRateLimits.window, whatsappRateLimits.priority, whatsappRateLimits.windowStart],
        set: { count: sql`${whatsappRateLimits.count} + 1` }
      });

    // Insert hour counter
    await db
      .insert(whatsappRateLimits)
      .values({
        identifier,
        window: 'hour',
        windowStart: hourWindow,
        priority,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [whatsappRateLimits.identifier, whatsappRateLimits.window, whatsappRateLimits.priority, whatsappRateLimits.windowStart],
        set: { count: sql`${whatsappRateLimits.count} + 1` }
      });
  }

  // WhatsApp delivery log operations
  async createWhatsappDeliveryLog(log: InsertWhatsappDeliveryLogs): Promise<WhatsappDeliveryLogs> {
    const [deliveryLog] = await db.insert(whatsappDeliveryLogs).values(log).returning();
    return deliveryLog;
  }

  async updateWhatsappDeliveryLogStatus(
    twilioSid: string, 
    status: string, 
    webhookData?: any
  ): Promise<WhatsappDeliveryLogs | undefined> {
    const [updated] = await db
      .update(whatsappDeliveryLogs)
      .set({
        status,
        webhookData: webhookData || {},
        updatedAt: new Date(),
      })
      .where(eq(whatsappDeliveryLogs.twilioSid, twilioSid))
      .returning();

    return updated;
  }

  async getWhatsappDeliveryLogs(whatsappQueueId?: string): Promise<WhatsappDeliveryLogs[]> {
    if (whatsappQueueId) {
      return await db
        .select()
        .from(whatsappDeliveryLogs)
        .where(eq(whatsappDeliveryLogs.whatsappQueueId, whatsappQueueId))
        .orderBy(desc(whatsappDeliveryLogs.createdAt));
    } else {
      return await db
        .select()
        .from(whatsappDeliveryLogs)
        .orderBy(desc(whatsappDeliveryLogs.createdAt))
        .limit(100);
    }
  }

  // =============================================================================
  // ADMIN METRICS OPERATIONS - Business Analytics & Reporting
  // =============================================================================

  private getDateRangeFromQuery(dateRange: MetricsDateRange): { startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date } {
    const now = new Date();
    const endDate = dateRange.endDate ? new Date(dateRange.endDate) : now;
    let startDate: Date;
    let daysDifference: number;

    // Calculate date ranges based on period
    switch (dateRange.period) {
      case '7d':
        daysDifference = 7;
        startDate = new Date(endDate.getTime() - (daysDifference * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        daysDifference = 30;
        startDate = new Date(endDate.getTime() - (daysDifference * 24 * 60 * 60 * 1000));
        break;
      case '90d':
        daysDifference = 90;
        startDate = new Date(endDate.getTime() - (daysDifference * 24 * 60 * 60 * 1000));
        break;
      case '1y':
        daysDifference = 365;
        startDate = new Date(endDate.getTime() - (daysDifference * 24 * 60 * 60 * 1000));
        break;
      case 'custom':
        if (!dateRange.startDate) {
          throw new Error('Start date is required for custom date range');
        }
        startDate = new Date(dateRange.startDate);
        daysDifference = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        break;
      default:
        daysDifference = 30;
        startDate = new Date(endDate.getTime() - (daysDifference * 24 * 60 * 60 * 1000));
    }

    // Calculate previous period for comparison
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(startDate.getTime() - (daysDifference * 24 * 60 * 60 * 1000));

    return {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate
    };
  }

  private calculateMetricsSummary(current: number, previous: number) {
    const change = current - previous;
    const changePercent = previous === 0 ? (current > 0 ? 100 : 0) : ((change / previous) * 100);
    const trend = changePercent > 5 ? 'up' : (changePercent < -5 ? 'down' : 'stable');
    
    return {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      trend: trend as 'up' | 'down' | 'stable'
    };
  }

  async getAdminOverviewMetrics(dateRange: MetricsDateRange): Promise<AdminOverviewMetrics> {
    const { startDate, endDate, previousStartDate, previousEndDate } = this.getDateRangeFromQuery(dateRange);

    // Revenue metrics - current and previous period
    const [currentRevenueResult, previousRevenueResult] = await Promise.all([
      db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
        averageOrderValue: sql<number>`ROUND(COALESCE(AVG(CAST(${orders.total} AS DECIMAL)), 0), 2)`,
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`,
          eq(orders.paymentStatus, 'completed')
        )),
      
      db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
        averageOrderValue: sql<number>`ROUND(COALESCE(AVG(CAST(${orders.total} AS DECIMAL)), 0), 2)`,
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${previousStartDate}`,
          sql`${orders.createdAt} <= ${previousEndDate}`,
          eq(orders.paymentStatus, 'completed')
        ))
    ]);

    const currentRevenue = currentRevenueResult[0];
    const previousRevenue = previousRevenueResult[0];

    // Order status breakdown
    const [orderStatusResult] = await Promise.all([
      db.select({
        status: orders.status,
        count: sql<number>`COUNT(*)`
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`
        ))
        .groupBy(orders.status)
    ]);

    const orderStatusMap = orderStatusResult.reduce((acc, row) => {
      acc[row.status as string] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Customer metrics - current and previous period
    const [currentCustomerResult, previousCustomerResult] = await Promise.all([
      db.select({
        totalCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${users.createdAt} <= ${endDate} THEN ${users.id} END)`,
        newCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${users.createdAt} >= ${startDate} AND ${users.createdAt} <= ${endDate} THEN ${users.id} END)`,
      }).from(users),
      
      db.select({
        totalCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${users.createdAt} <= ${previousEndDate} THEN ${users.id} END)`,
        newCustomers: sql<number>`COUNT(DISTINCT CASE WHEN ${users.createdAt} >= ${previousStartDate} AND ${users.createdAt} <= ${previousEndDate} THEN ${users.id} END)`,
      }).from(users)
    ]);

    const currentCustomers = currentCustomerResult[0];
    const previousCustomers = previousCustomerResult[0];

    // Calculate returning customers (customers with multiple orders in current period)
    const [returningCustomersResult] = await Promise.all([
      db.select({
        returningCustomers: sql<number>`COUNT(DISTINCT ${orders.userId})`
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`,
          sql`${orders.userId} IS NOT NULL`,
          sql`${orders.userId} IN (
            SELECT user_id FROM orders 
            WHERE user_id IS NOT NULL 
            AND created_at < ${startDate}
            GROUP BY user_id
          )`
        ))
    ]);

    // Product & Inventory metrics
    const [productMetrics] = await Promise.all([
      db.select({
        totalProducts: sql<number>`COUNT(*)`,
        lowStockProducts: sql<number>`COUNT(CASE WHEN ${products.inStock} <= ${products.lowStockThreshold} AND ${products.inStock} > 0 THEN 1 END)`,
        outOfStockProducts: sql<number>`COUNT(CASE WHEN ${products.inStock} = 0 THEN 1 END)`,
      }).from(products)
    ]);

    // Top selling category in current period
    const [topCategoryResult] = await Promise.all([
      db.select({
        category: products.category,
      }).from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`,
          eq(orders.paymentStatus, 'completed')
        ))
        .groupBy(products.category)
        .orderBy(desc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`))
        .limit(1)
    ]);

    // Performance indicators
    const [performanceMetrics] = await Promise.all([
      db.select({
        totalOrders: sql<number>`COUNT(*)`,
        cancelledOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'cancelled' THEN 1 END)`,
        completedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'delivered' THEN 1 END)`,
        averageFulfillmentHours: sql<number>`
          COALESCE(AVG(
            CASE WHEN ${orders.status} = 'delivered' 
            THEN EXTRACT(EPOCH FROM (${orders.updatedAt} - ${orders.createdAt})) / 3600 
            END
          ), 0)
        `
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`
        ))
    ]);

    const refundRate = performanceMetrics[0].totalOrders > 0 
      ? (performanceMetrics[0].cancelledOrders / performanceMetrics[0].totalOrders) * 100 
      : 0;

    // Calculate conversion rate (completed orders / total customers * 100)
    // This represents the percentage of customers who made a purchase
    const conversionRate = currentCustomers.totalCustomers > 0
      ? Math.round((performanceMetrics[0].completedOrders / currentCustomers.totalCustomers) * 100 * 100) / 100
      : 0;

    return {
      grossMerchandiseValue: this.calculateMetricsSummary(currentRevenue.totalRevenue, previousRevenue.totalRevenue),
      totalRevenue: this.calculateMetricsSummary(currentRevenue.totalRevenue, previousRevenue.totalRevenue),
      averageOrderValue: this.calculateMetricsSummary(currentRevenue.averageOrderValue, previousRevenue.averageOrderValue),
      totalOrders: this.calculateMetricsSummary(currentRevenue.totalOrders, previousRevenue.totalOrders),
      pendingOrders: orderStatusMap['pending'] || 0,
      completedOrders: orderStatusMap['delivered'] || 0,
      cancelledOrders: orderStatusMap['cancelled'] || 0,
      totalCustomers: this.calculateMetricsSummary(currentCustomers.totalCustomers, previousCustomers.totalCustomers),
      newCustomers: this.calculateMetricsSummary(currentCustomers.newCustomers, previousCustomers.newCustomers),
      returningCustomers: this.calculateMetricsSummary(returningCustomersResult[0].returningCustomers, 0),
      customerRetentionRate: currentCustomers.totalCustomers > 0 
        ? Math.round((returningCustomersResult[0].returningCustomers / currentCustomers.totalCustomers) * 100 * 100) / 100
        : 0,
      totalProducts: productMetrics[0].totalProducts,
      lowStockProducts: productMetrics[0].lowStockProducts,
      outOfStockProducts: productMetrics[0].outOfStockProducts,
      topSellingCategory: topCategoryResult[0]?.category || 'N/A',
      conversionRate,
      refundRate: Math.round(refundRate * 100) / 100,
      averageFulfillmentTime: Math.round(performanceMetrics[0].averageFulfillmentHours * 100) / 100,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getRevenueAnalytics(query: RevenueQuery): Promise<RevenueAnalytics> {
    const { startDate, endDate } = this.getDateRangeFromQuery(query);
    
    // Determine date truncation based on granularity
    const dateTrunc = query.granularity === 'daily' ? 'day' : 
                     query.granularity === 'weekly' ? 'week' : 'month';

    // Time series revenue data
    const timeSeriesResult = await db.select({
      date: sql<string>`DATE_TRUNC('${sql.raw(dateTrunc)}', ${orders.createdAt})::date`,
      value: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
    }).from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed'),
        ...(query.category ? [sql`EXISTS (
          SELECT 1 FROM ${orderItems} oi 
          INNER JOIN ${products} p ON oi.product_id = p.id 
          WHERE oi.order_id = ${orders.id} AND p.category = ${query.category}
        )`] : [])
      ))
      .groupBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${orders.createdAt})`);

    // Revenue by category
    const categoryRevenueResult = await db.select({
      category: products.category,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0)`,
      orders: sql<number>`COUNT(DISTINCT ${orders.id})`
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed')
      ))
      .groupBy(products.category)
      .orderBy(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0) DESC`);

    // Revenue breakdown
    const revenueBreakdownResult = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      subtotal: sql<number>`COALESCE(SUM(CAST(${orders.subtotal} AS DECIMAL)), 0)`,
      shippingRevenue: sql<number>`COALESCE(SUM(CAST(${orders.shippingCost} AS DECIMAL)), 0)`,
      taxRevenue: sql<number>`COALESCE(SUM(CAST(${orders.taxAmount} AS DECIMAL)), 0)`
    }).from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed')
      ));

    // Calculate growth trends
    const previousPeriodEnd = new Date(startDate.getTime() - 1);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const previousPeriodStart = new Date(startDate.getTime() - (daysDiff * 24 * 60 * 60 * 1000));

    const [currentTotal, previousTotal] = await Promise.all([
      db.select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`,
          eq(orders.paymentStatus, 'completed')
        )),
      
      db.select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${previousPeriodStart}`,
          sql`${orders.createdAt} <= ${previousPeriodEnd}`,
          eq(orders.paymentStatus, 'completed')
        ))
    ]);

    const currentRevenue = currentTotal[0].revenue;
    const previousRevenue = previousTotal[0].revenue;
    const overallGrowth = previousRevenue === 0 ? 0 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    const totalRevenue = revenueBreakdownResult[0]?.totalRevenue || 0;

    return {
      timeSeries: timeSeriesResult.map(row => ({
        date: row.date,
        value: row.value,
        label: query.granularity === 'daily' ? new Date(row.date).toLocaleDateString() : row.date
      })),
      revenueByCategory: categoryRevenueResult.map(row => ({
        id: row.category,
        name: row.category,
        value: row.revenue,
        percentage: totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0,
        metadata: { orders: row.orders }
      })),
      revenueBreakdown: {
        totalRevenue: revenueBreakdownResult[0]?.totalRevenue || 0,
        productRevenue: revenueBreakdownResult[0]?.subtotal || 0,
        shippingRevenue: revenueBreakdownResult[0]?.shippingRevenue || 0,
        taxRevenue: revenueBreakdownResult[0]?.taxRevenue || 0,
      },
      trends: {
        dailyGrowth: overallGrowth / daysDiff,
        weeklyGrowth: overallGrowth / (daysDiff / 7),
        monthlyGrowth: overallGrowth / (daysDiff / 30),
      },
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      }
    };
  }

  async getOrderAnalytics(query: OrderAnalyticsQuery): Promise<OrderAnalytics> {
    const { startDate, endDate } = this.getDateRangeFromQuery(query);

    // Order trends over time
    const orderTrendsResult = await db.select({
      date: sql<string>`DATE_TRUNC('day', ${orders.createdAt})::date`,
      value: sql<number>`COUNT(*)`
    }).from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`
      ))
      .groupBy(sql`DATE_TRUNC('day', ${orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${orders.createdAt})`);

    // Orders by status
    const ordersByStatusResult = await db.select({
      status: orders.status,
      count: sql<number>`COUNT(*)`
    }).from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`
      ))
      .groupBy(orders.status);

    const totalOrders = ordersByStatusResult.reduce((sum, row) => sum + row.count, 0);

    // Order value distribution
    const orderValueDistributionResult = await db.select({
      range: sql<string>`
        CASE 
          WHEN CAST(${orders.total} AS DECIMAL) < 500 THEN '0-500'
          WHEN CAST(${orders.total} AS DECIMAL) < 1000 THEN '500-1000'
          WHEN CAST(${orders.total} AS DECIMAL) < 2000 THEN '1000-2000'
          WHEN CAST(${orders.total} AS DECIMAL) < 5000 THEN '2000-5000'
          ELSE '5000+'
        END
      `,
      count: sql<number>`COUNT(*)`
    }).from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed')
      ))
      .groupBy(sql`
        CASE 
          WHEN CAST(${orders.total} AS DECIMAL) < 500 THEN '0-500'
          WHEN CAST(${orders.total} AS DECIMAL) < 1000 THEN '500-1000'
          WHEN CAST(${orders.total} AS DECIMAL) < 2000 THEN '1000-2000'
          WHEN CAST(${orders.total} AS DECIMAL) < 5000 THEN '2000-5000'
          ELSE '5000+'
        END
      `);

    // Peak ordering hours (if requested)
    let peakOrderingHours: { hour: number, orderCount: number }[] = [];
    if (query.includeHourlyPatterns) {
      const hourlyResult = await db.select({
        hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt})`,
        orderCount: sql<number>`COUNT(*)`
      }).from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`
        ))
        .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`)
        .orderBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`);

      peakOrderingHours = hourlyResult.map(row => ({
        hour: row.hour,
        orderCount: row.orderCount
      }));
    }

    // Average order processing time
    const processingTimeResult = await db.select({
      averageProcessingHours: sql<number>`
        COALESCE(AVG(
          CASE WHEN ${orders.status} IN ('delivered', 'shipped') 
          THEN EXTRACT(EPOCH FROM (${orders.updatedAt} - ${orders.createdAt})) / 3600 
          END
        ), 0)
      `
    }).from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`
      ));

    // Order completion rate
    const completedOrders = ordersByStatusResult.find(row => row.status === 'delivered')?.count || 0;
    const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      orderTrends: orderTrendsResult.map(row => ({
        date: row.date,
        value: row.value,
        label: new Date(row.date).toLocaleDateString()
      })),
      ordersByStatus: ordersByStatusResult.map(row => ({
        status: row.status as string,
        count: row.count,
        percentage: totalOrders > 0 ? (row.count / totalOrders) * 100 : 0
      })),
      orderValueDistribution: orderValueDistributionResult.map(row => ({
        range: row.range,
        count: row.count,
        percentage: totalOrders > 0 ? (row.count / totalOrders) * 100 : 0
      })),
      peakOrderingHours,
      averageOrderProcessingTime: Math.round(processingTimeResult[0].averageProcessingHours * 100) / 100,
      orderCompletionRate: Math.round(orderCompletionRate * 100) / 100,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      }
    };
  }

  async getCustomerAnalytics(query: CustomerAnalyticsQuery): Promise<CustomerAnalytics> {
    const { startDate, endDate } = this.getDateRangeFromQuery(query);

    // Customer acquisition trends
    const customerAcquisitionResult = await db.select({
      date: sql<string>`DATE_TRUNC('day', ${users.createdAt})::date`,
      value: sql<number>`COUNT(*)`
    }).from(users)
      .where(and(
        sql`${users.createdAt} >= ${startDate}`,
        sql`${users.createdAt} <= ${endDate}`
      ))
      .groupBy(sql`DATE_TRUNC('day', ${users.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${users.createdAt})`);

    // Customer segments analysis
    const customerSegmentResult = await db.select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      createdAt: users.createdAt,
      orderCount: sql<number>`COUNT(${orders.id})`,
      totalSpent: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      lastOrderDate: sql<string>`MAX(${orders.createdAt})`
    }).from(users)
      .leftJoin(orders, and(
        eq(orders.userId, users.id),
        eq(orders.paymentStatus, 'completed')
      ))
      .where(sql`${users.createdAt} <= ${endDate}`)
      .groupBy(users.id, users.firstName, users.lastName, users.email, users.createdAt);

    // Process customer segments
    const segments = {
      new: { count: 0, totalSpent: 0, orders: 0 },
      returning: { count: 0, totalSpent: 0, orders: 0 },
      vip: { count: 0, totalSpent: 0, orders: 0 }
    };

    const topCustomers: any[] = [];

    for (const customer of customerSegmentResult) {
      const isNewCustomer = customer.createdAt >= startDate;
      const isVip = customer.totalSpent > 5000 || customer.orderCount > 5;
      const isReturning = customer.orderCount > 1;

      if (isVip) {
        segments.vip.count++;
        segments.vip.totalSpent += customer.totalSpent;
        segments.vip.orders += customer.orderCount;
      } else if (isReturning) {
        segments.returning.count++;
        segments.returning.totalSpent += customer.totalSpent;
        segments.returning.orders += customer.orderCount;
      } else if (isNewCustomer) {
        segments.new.count++;
        segments.new.totalSpent += customer.totalSpent;
        segments.new.orders += customer.orderCount;
      }

      // Collect top customers
      if (customer.orderCount > 0) {
        topCustomers.push({
          customerId: customer.userId,
          customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email,
          totalOrders: customer.orderCount,
          totalSpent: customer.totalSpent,
          averageOrderValue: customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0,
          lastOrderDate: customer.lastOrderDate
        });
      }
    }

    // Sort and limit top customers
    topCustomers.sort((a, b) => b.totalSpent - a.totalSpent);
    const limitedTopCustomers = topCustomers.slice(0, query.limit || 20);

    const totalCustomers = segments.new.count + segments.returning.count + segments.vip.count;

    // Customer lifetime value calculations
    const allSpentValues = topCustomers.map(c => c.totalSpent).sort((a, b) => a - b);
    const clv = {
      average: allSpentValues.length > 0 ? allSpentValues.reduce((sum, val) => sum + val, 0) / allSpentValues.length : 0,
      median: allSpentValues.length > 0 ? allSpentValues[Math.floor(allSpentValues.length / 2)] : 0,
      percentiles: {
        p25: allSpentValues.length > 0 ? allSpentValues[Math.floor(allSpentValues.length * 0.25)] : 0,
        p75: allSpentValues.length > 0 ? allSpentValues[Math.floor(allSpentValues.length * 0.75)] : 0,
        p90: allSpentValues.length > 0 ? allSpentValues[Math.floor(allSpentValues.length * 0.90)] : 0,
      }
    };

    // Geographic distribution (if requested)
    let geographicDistribution: any[] = [];
    if (query.includeGeographic) {
      const geoResult = await db.select({
        state: userAddresses.state,
        customerCount: sql<number>`COUNT(DISTINCT ${userAddresses.userId})`,
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
      }).from(userAddresses)
        .leftJoin(orders, eq(orders.userId, userAddresses.userId))
        .where(and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`,
          eq(orders.paymentStatus, 'completed')
        ))
        .groupBy(userAddresses.state)
        .orderBy(sql`COUNT(DISTINCT ${userAddresses.userId}) DESC`);

      const totalGeoCustomers = geoResult.reduce((sum, row) => sum + row.customerCount, 0);
      
      geographicDistribution = geoResult.map(row => ({
        state: row.state,
        customerCount: row.customerCount,
        percentage: totalGeoCustomers > 0 ? (row.customerCount / totalGeoCustomers) * 100 : 0,
        totalRevenue: row.totalRevenue
      }));
    }

    // Retention metrics
    const retentionRate = totalCustomers > 0 ? (segments.returning.count / totalCustomers) * 100 : 0;
    const avgCustomerLifespan = 12; // Estimated - would need more complex calculation
    const churnRate = 100 - retentionRate;

    return {
      customerAcquisition: customerAcquisitionResult.map(row => ({
        date: row.date,
        value: row.value,
        label: new Date(row.date).toLocaleDateString()
      })),
      customerSegments: [
        {
          segment: 'new',
          count: segments.new.count,
          percentage: totalCustomers > 0 ? (segments.new.count / totalCustomers) * 100 : 0,
          averageOrderValue: segments.new.orders > 0 ? segments.new.totalSpent / segments.new.orders : 0
        },
        {
          segment: 'returning',
          count: segments.returning.count,
          percentage: totalCustomers > 0 ? (segments.returning.count / totalCustomers) * 100 : 0,
          averageOrderValue: segments.returning.orders > 0 ? segments.returning.totalSpent / segments.returning.orders : 0
        },
        {
          segment: 'vip',
          count: segments.vip.count,
          percentage: totalCustomers > 0 ? (segments.vip.count / totalCustomers) * 100 : 0,
          averageOrderValue: segments.vip.orders > 0 ? segments.vip.totalSpent / segments.vip.orders : 0
        }
      ],
      topCustomers: limitedTopCustomers,
      customerLifetimeValue: clv,
      geographicDistribution,
      retentionMetrics: {
        monthlyRetentionRate: Math.round(retentionRate * 100) / 100,
        averageCustomerLifespan: avgCustomerLifespan,
        churnRate: Math.round(churnRate * 100) / 100
      },
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      }
    };
  }

  async getTopProducts(query: TopProductsQuery): Promise<TopProducts> {
    const { startDate, endDate } = this.getDateRangeFromQuery(query);

    // Top products by revenue
    const topByRevenueResult = await db.select({
      productId: products.id,
      productName: products.name,
      category: products.category,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0)`,
      unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      orders: sql<number>`COUNT(DISTINCT ${orders.id})`
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed'),
        ...(query.category ? [eq(products.category, query.category)] : []),
        ...(query.includeOutOfStock ? [] : [sql`${products.inStock} > 0`])
      ))
      .groupBy(products.id, products.name, products.category)
      .orderBy(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0) DESC`)
      .limit(query.limit || 20);

    // Top products by units sold
    const topByUnitsResult = await db.select({
      productId: products.id,
      productName: products.name,
      category: products.category,
      unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0)`
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed'),
        ...(query.category ? [eq(products.category, query.category)] : [])
      ))
      .groupBy(products.id, products.name, products.category)
      .orderBy(sql`COALESCE(SUM(${orderItems.quantity}), 0) DESC`)
      .limit(query.limit || 20);

    // Top products by margin (using costPrice vs selling price)
    const topByMarginResult = await db.select({
      productId: products.id,
      productName: products.name,
      category: products.category,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0)`,
      cost: sql<number>`COALESCE(SUM(CAST(${products.costPrice} AS DECIMAL) * ${orderItems.quantity}), 0)`,
      margin: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)) - SUM(CAST(${products.costPrice} AS DECIMAL) * ${orderItems.quantity}), 0)`
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed'),
        sql`${products.costPrice} IS NOT NULL`,
        ...(query.category ? [eq(products.category, query.category)] : [])
      ))
      .groupBy(products.id, products.name, products.category)
      .orderBy(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)) - SUM(CAST(${products.costPrice} AS DECIMAL) * ${orderItems.quantity}), 0) DESC`)
      .limit(query.limit || 20);

    // Category performance analysis
    const categoryPerformanceResult = await db.select({
      category: products.category,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0)`,
      unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      averagePrice: sql<number>`COALESCE(AVG(CAST(${orderItems.productPrice} AS DECIMAL)), 0)`,
      orders: sql<number>`COUNT(DISTINCT ${orders.id})`,
      products: sql<number>`COUNT(DISTINCT ${products.id})`
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed')
      ))
      .groupBy(products.category)
      .orderBy(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DECIMAL)), 0) DESC`);

    // Calculate total revenue for percentages
    const totalRevenue = topByRevenueResult.reduce((sum, product) => sum + product.revenue, 0);

    // Format results
    const formatTopProducts = (results: any[], valueKey: string) =>
      results.map((product, index) => ({
        id: product.productId,
        name: product.productName,
        value: product[valueKey],
        percentage: totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0,
        metadata: {
          category: product.category,
          revenue: product.revenue,
          unitsSold: product.unitsSold,
          rank: index + 1
        }
      }));

    return {
      topByRevenue: formatTopProducts(topByRevenueResult, 'revenue'),
      topByUnits: formatTopProducts(topByUnitsResult, 'unitsSold'),
      topByMargin: topByMarginResult.map((product, index) => ({
        id: product.productId,
        name: product.productName,
        value: product.margin,
        percentage: product.revenue > 0 ? (product.margin / product.revenue) * 100 : 0,
        metadata: {
          category: product.category,
          revenue: product.revenue,
          cost: product.cost,
          rank: index + 1
        }
      })),
      categoryPerformance: categoryPerformanceResult.map(cat => ({
        category: cat.category,
        revenue: cat.revenue,
        unitsSold: cat.unitsSold,
        averagePrice: cat.averagePrice,
        margin: 0, // Would need cost data
        growthRate: 0, // Would need previous period comparison
      })),
      productTrends: [], // Complex query - could be added later
      inventoryTurnover: [], // Would need inventory history data
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      }
    };
  }

  // Task 15e - Specific Top Products & Categories Analytics Methods
  async getTopProductsByRevenue(query: TopProductsByRevenueQuery): Promise<TopProductsByRevenue> {
    // Calculate date range
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    let startDate: Date;
    
    switch (query.period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where conditions for products query
    const whereConditions = [
      sql`${orders.createdAt} >= ${startDate}`,
      sql`${orders.createdAt} <= ${endDate}`,
      eq(orders.paymentStatus, 'completed'),
    ];

    if (query.category) {
      whereConditions.push(eq(products.category, query.category));
    }

    if (query.search) {
      whereConditions.push(ilike(products.name, `%${query.search}%`));
    }

    // Main products by revenue query with proper ordering
    const productsResult = await db.select({
      id: products.id,
      name: products.name,
      image: sql<string>`COALESCE((SELECT ${products.images}[1]), '')`, // Get first image safely
      category: products.category,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`,
      unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
      averagePricePerUnit: sql<number>`CASE WHEN COALESCE(SUM(${orderItems.quantity}), 0) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COALESCE(SUM(${orderItems.quantity}), 1) ELSE 0 END`,
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...whereConditions))
      .groupBy(products.id, products.name, products.category)
      .orderBy(
        query.sortOrder === 'asc' 
          ? (query.sortBy === 'revenue' ? asc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`) : 
             query.sortBy === 'unitsSold' ? asc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`) :
             query.sortBy === 'averagePricePerUnit' ? asc(sql`CASE WHEN COALESCE(SUM(${orderItems.quantity}), 0) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COALESCE(SUM(${orderItems.quantity}), 1) ELSE 0 END`) :
             asc(products.name))
          : (query.sortBy === 'revenue' ? desc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`) : 
             query.sortBy === 'unitsSold' ? desc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`) :
             query.sortBy === 'averagePricePerUnit' ? desc(sql`CASE WHEN COALESCE(SUM(${orderItems.quantity}), 0) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COALESCE(SUM(${orderItems.quantity}), 1) ELSE 0 END`) :
             desc(products.name))
      )
      .limit(query.limit || 25)
      .offset(((query.page || 1) - 1) * (query.limit || 25));

    // Calculate totals for summary
    const totalStatsResult = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`,
      totalProducts: sql<number>`COUNT(DISTINCT ${products.id})`,
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...whereConditions));

    const totalStats = totalStatsResult[0] || { totalRevenue: 0, totalProducts: 0 };

    // Previous period data for growth calculation if requested
    let previousPeriod = undefined;
    if (query.includeGrowth) {
      const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
      const previousEndDate = new Date(startDate);

      const previousStatsResult = await db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`,
      }).from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          sql`${orders.createdAt} >= ${previousStartDate}`,
          sql`${orders.createdAt} <= ${previousEndDate}`,
          eq(orders.paymentStatus, 'completed'),
          ...(query.category ? [eq(products.category, query.category)] : []),
          ...(query.search ? [ilike(products.name, `%${query.search}%`)] : [])
        ));

      const previousStats = previousStatsResult[0] || { totalRevenue: 0 };
      const growthPercent = previousStats.totalRevenue > 0 
        ? ((totalStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
        : 0;

      previousPeriod = {
        totalRevenue: previousStats.totalRevenue,
        growthPercent,
      };
    }

    return {
      products: productsResult.map(product => ({
        ...product,
        image: product.image || undefined,
        growthPercent: undefined, // Individual product growth would require additional queries
      })),
      totalProducts: totalStats.totalProducts,
      totalRevenue: totalStats.totalRevenue,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      previousPeriod,
    };
  }

  async getTopProductsByUnits(query: TopProductsByUnitsQuery): Promise<TopProductsByUnits> {
    // Calculate date range (same logic as revenue method)
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    let startDate: Date;
    
    switch (query.period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build where conditions
    const whereConditions = [
      sql`${orders.createdAt} >= ${startDate}`,
      sql`${orders.createdAt} <= ${endDate}`,
      eq(orders.paymentStatus, 'completed'),
    ];

    if (query.category) {
      whereConditions.push(eq(products.category, query.category));
    }

    if (query.search) {
      whereConditions.push(ilike(products.name, `%${query.search}%`));
    }

    // Main products by units sold query
    const productsResult = await db.select({
      id: products.id,
      name: products.name,
      image: sql<string>`COALESCE((SELECT ${products.images}[1]), '')`, // Get first image safely
      category: products.category,
      unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`,
      orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
      averagePricePerUnit: sql<number>`CASE WHEN COALESCE(SUM(${orderItems.quantity}), 0) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COALESCE(SUM(${orderItems.quantity}), 1) ELSE 0 END`,
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...whereConditions))
      .groupBy(products.id, products.name, products.category)
      .orderBy(
        query.sortOrder === 'asc' 
          ? (query.sortBy === 'unitsSold' ? asc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`) : 
             query.sortBy === 'revenue' ? asc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`) :
             query.sortBy === 'averagePricePerUnit' ? asc(sql`CASE WHEN COALESCE(SUM(${orderItems.quantity}), 0) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COALESCE(SUM(${orderItems.quantity}), 1) ELSE 0 END`) :
             asc(products.name))
          : (query.sortBy === 'unitsSold' ? desc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`) : 
             query.sortBy === 'revenue' ? desc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`) :
             query.sortBy === 'averagePricePerUnit' ? desc(sql`CASE WHEN COALESCE(SUM(${orderItems.quantity}), 0) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COALESCE(SUM(${orderItems.quantity}), 1) ELSE 0 END`) :
             desc(products.name))
      )
      .limit(query.limit || 25)
      .offset(((query.page || 1) - 1) * (query.limit || 25));

    // Calculate totals for summary
    const totalStatsResult = await db.select({
      totalUnitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      totalProducts: sql<number>`COUNT(DISTINCT ${products.id})`,
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...whereConditions));

    const totalStats = totalStatsResult[0] || { totalUnitsSold: 0, totalProducts: 0 };

    // Previous period data for growth calculation if requested
    let previousPeriod = undefined;
    if (query.includeGrowth) {
      const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
      const previousEndDate = new Date(startDate);

      const previousStatsResult = await db.select({
        totalUnitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      }).from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          sql`${orders.createdAt} >= ${previousStartDate}`,
          sql`${orders.createdAt} <= ${previousEndDate}`,
          eq(orders.paymentStatus, 'completed'),
          ...(query.category ? [eq(products.category, query.category)] : []),
          ...(query.search ? [ilike(products.name, `%${query.search}%`)] : [])
        ));

      const previousStats = previousStatsResult[0] || { totalUnitsSold: 0 };
      const growthPercent = previousStats.totalUnitsSold > 0 
        ? ((totalStats.totalUnitsSold - previousStats.totalUnitsSold) / previousStats.totalUnitsSold) * 100
        : 0;

      previousPeriod = {
        totalUnitsSold: previousStats.totalUnitsSold,
        growthPercent,
      };
    }

    return {
      products: productsResult.map(product => ({
        ...product,
        image: product.image || undefined,
        growthPercent: undefined, // Individual product growth would require additional queries
      })),
      totalProducts: totalStats.totalProducts,
      totalUnitsSold: totalStats.totalUnitsSold,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      previousPeriod,
    };
  }

  async getTopCategories(query: TopCategoriesQuery): Promise<TopCategories> {
    // Calculate date range (same logic as other methods)
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    let startDate: Date;
    
    switch (query.period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Main categories performance query
    const categoriesResult = await db.select({
      category: products.category,
      revenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`,
      unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      averageOrderValue: sql<number>`CASE WHEN COUNT(DISTINCT ${orders.id}) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COUNT(DISTINCT ${orders.id}) ELSE 0 END`,
      productCount: sql<number>`COUNT(DISTINCT ${products.id})`,
      orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed')
      ))
      .groupBy(products.category)
      .orderBy(
        query.sortOrder === 'asc' 
          ? (query.sortBy === 'revenue' ? asc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`) : 
             query.sortBy === 'unitsSold' ? asc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`) :
             query.sortBy === 'averageOrderValue' ? asc(sql`CASE WHEN COUNT(DISTINCT ${orders.id}) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COUNT(DISTINCT ${orders.id}) ELSE 0 END`) :
             asc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`))
          : (query.sortBy === 'revenue' ? desc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`) : 
             query.sortBy === 'unitsSold' ? desc(sql`COALESCE(SUM(${orderItems.quantity}), 0)`) :
             query.sortBy === 'averageOrderValue' ? desc(sql`CASE WHEN COUNT(DISTINCT ${orders.id}) > 0 THEN COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0) / COUNT(DISTINCT ${orders.id}) ELSE 0 END`) :
             desc(sql`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`))
      )
      .limit(query.limit || 25)
      .offset(((query.page || 1) - 1) * (query.limit || 25));

    // Calculate totals for market share
    const totalStatsResult = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`,
      totalUnitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      totalCategories: sql<number>`COUNT(DISTINCT ${products.category})`,
    }).from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(
        sql`${orders.createdAt} >= ${startDate}`,
        sql`${orders.createdAt} <= ${endDate}`,
        eq(orders.paymentStatus, 'completed')
      ));

    const totalStats = totalStatsResult[0] || { totalRevenue: 0, totalUnitsSold: 0, totalCategories: 0 };

    // Previous period data for growth calculation if requested
    let previousPeriod = undefined;
    if (query.includeGrowth) {
      const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
      const previousEndDate = new Date(startDate);

      const previousStatsResult = await db.select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orderItems.totalPrice} AS DOUBLE PRECISION)), 0)`,
        totalUnitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      }).from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          sql`${orders.createdAt} >= ${previousStartDate}`,
          sql`${orders.createdAt} <= ${previousEndDate}`,
          eq(orders.paymentStatus, 'completed')
        ));

      const previousStats = previousStatsResult[0] || { totalRevenue: 0, totalUnitsSold: 0 };
      const revenueGrowthPercent = previousStats.totalRevenue > 0 
        ? ((totalStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
        : 0;

      previousPeriod = {
        totalRevenue: previousStats.totalRevenue,
        totalUnitsSold: previousStats.totalUnitsSold,
        growthPercent: revenueGrowthPercent,
      };
    }

    return {
      categories: categoriesResult.map(category => ({
        ...category,
        marketSharePercent: totalStats.totalRevenue > 0 ? (category.revenue / totalStats.totalRevenue) * 100 : 0,
        growthPercent: undefined, // Individual category growth would require additional queries
      })),
      totalCategories: totalStats.totalCategories,
      totalRevenue: totalStats.totalRevenue,
      totalUnitsSold: totalStats.totalUnitsSold,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      previousPeriod,
    };
  }

  async getLowStockInventory(query: LowStockQuery): Promise<LowStockInventory> {
    // Low stock products
    const lowStockConditions = [
      sql`${products.inStock} <= ${products.lowStockThreshold}`,
      sql`${products.inStock} > 0`
    ];

    if (query.category) {
      lowStockConditions.push(eq(products.category, query.category));
    }

    const lowStockProductsResult = await db.select({
      productId: products.id,
      productName: products.name,
      category: products.category,
      currentStock: products.inStock,
      lowStockThreshold: products.lowStockThreshold,
      reorderPoint: products.reorderPoint,
      supplier: products.supplier,
      updatedAt: products.updatedAt
    }).from(products)
      .where(and(...lowStockConditions))
      .orderBy(
        query.sortBy === 'stockLevel' ? asc(products.inStock) :
        query.sortBy === 'daysUntilStockout' ? asc(products.inStock) :
        asc(products.lowStockThreshold) // urgency
      );

    // Out of stock products
    const outOfStockConditions = [eq(products.inStock, 0)];
    if (query.category) {
      outOfStockConditions.push(eq(products.category, query.category));
    }

    let outOfStockProductsResult: any[] = [];
    if (query.includeOutOfStock) {
      outOfStockProductsResult = await db.select({
        productId: products.id,
        productName: products.name,
        category: products.category,
        updatedAt: products.updatedAt
      }).from(products)
        .where(and(...outOfStockConditions))
        .orderBy(desc(products.updatedAt));
    }

    // Stock alerts
    const alertConditions = [eq(stockAlerts.status, 'active')];
    if (query.category) {
      alertConditions.push(sql`EXISTS (
        SELECT 1 FROM ${products} p 
        WHERE p.id = ${stockAlerts.productId} 
        AND p.category = ${query.category}
      )`);
    }

    const stockAlertsResult = await db.select({
      alertId: stockAlerts.id,
      productId: stockAlerts.productId,
      productName: sql<string>`(SELECT name FROM ${products} WHERE id = ${stockAlerts.productId})`,
      alertType: stockAlerts.alertType,
      currentStock: stockAlerts.currentStock,
      threshold: stockAlerts.threshold,
      status: stockAlerts.status,
      createdAt: stockAlerts.notifiedAt
    }).from(stockAlerts)
      .where(and(...alertConditions))
      .orderBy(desc(stockAlerts.notifiedAt));

    // Inventory summary
    const inventorySummaryResult = await db.select({
      totalProducts: sql<number>`COUNT(*)`,
      lowStockCount: sql<number>`COUNT(CASE WHEN ${products.inStock} <= ${products.lowStockThreshold} AND ${products.inStock} > 0 THEN 1 END)`,
      outOfStockCount: sql<number>`COUNT(CASE WHEN ${products.inStock} = 0 THEN 1 END)`,
      totalInventoryValue: sql<number>`COALESCE(SUM(${products.inStock} * CAST(${products.price} AS DECIMAL)), 0)`,
      averageStockLevel: sql<number>`COALESCE(AVG(${products.inStock}), 0)`
    }).from(products)
      .where(query.category ? eq(products.category, query.category) : undefined);

    // Calculate urgency levels for low stock products
    const processedLowStockProducts = lowStockProductsResult.map(product => {
      const stockRatio = product.currentStock / product.lowStockThreshold;
      const urgency = stockRatio <= 0.25 ? 'critical' :
                     stockRatio <= 0.5 ? 'high' :
                     stockRatio <= 0.75 ? 'medium' : 'low';

      // Estimate days until stockout (simplified calculation)
      const daysUntilStockout = product.currentStock > 0 ? Math.floor(product.currentStock / 1) : 0; // Assuming 1 unit sold per day

      return {
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        currentStock: product.currentStock,
        lowStockThreshold: product.lowStockThreshold,
        reorderPoint: product.reorderPoint,
        daysUntilStockout,
        supplier: product.supplier || undefined,
        lastRestock: product.updatedAt ? product.updatedAt.toISOString() : undefined,
        urgency: urgency as 'critical' | 'high' | 'medium' | 'low'
      };
    });

    // Filter by urgency if specified
    const filteredLowStockProducts = query.urgency === 'all' 
      ? processedLowStockProducts 
      : processedLowStockProducts.filter(product => product.urgency === query.urgency);

    // Process out of stock products
    const processedOutOfStockProducts = outOfStockProductsResult.map(product => {
      const stockoutDate = product.updatedAt ? product.updatedAt.toISOString() : new Date().toISOString();
      const daysOutOfStock = product.updatedAt 
        ? Math.floor((Date.now() - product.updatedAt.getTime()) / (24 * 60 * 60 * 1000))
        : 0;

      return {
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        stockoutDate,
        daysOutOfStock,
        lostSales: undefined // Could be calculated with order history
      };
    });

    // Process stock alerts
    const processedStockAlerts = stockAlertsResult.map(alert => ({
      alertId: alert.alertId,
      productId: alert.productId,
      productName: alert.productName || 'Unknown Product',
      alertType: alert.alertType,
      currentStock: alert.currentStock,
      threshold: alert.threshold,
      status: alert.status,
      createdAt: alert.createdAt ? alert.createdAt.toISOString() : new Date().toISOString()
    }));

    return {
      lowStockProducts: filteredLowStockProducts,
      outOfStockProducts: processedOutOfStockProducts,
      stockAlerts: processedStockAlerts,
      inventorySummary: {
        totalProducts: inventorySummaryResult[0]?.totalProducts || 0,
        lowStockCount: inventorySummaryResult[0]?.lowStockCount || 0,
        outOfStockCount: inventorySummaryResult[0]?.outOfStockCount || 0,
        totalInventoryValue: inventorySummaryResult[0]?.totalInventoryValue || 0,
        averageStockLevel: Math.round((inventorySummaryResult[0]?.averageStockLevel || 0) * 100) / 100
      }
    };
  }
  // ================================
  // COMPREHENSIVE ADMIN EXPORT IMPLEMENTATIONS
  // ================================

  // Comprehensive Orders Export with detailed information
  async exportOrdersComprehensive(params: OrdersExport): Promise<any[]> {
    try {
      console.log('🔍 Generating comprehensive orders export:', params);

      // Build query conditions
      const conditions: any[] = [];
      
      if (params.dateFrom) {
        conditions.push(sql`${orders.createdAt} >= ${new Date(params.dateFrom)}`);
      }
      if (params.dateTo) {
        conditions.push(sql`${orders.createdAt} <= ${new Date(params.dateTo)}`);
      }
      if (params.status && params.status.length > 0) {
        conditions.push(sql`${orders.status} = ANY(${params.status})`);
      }
      if (params.customerId) {
        conditions.push(eq(orders.userId, params.customerId));
      }
      if (params.customerEmail) {
        conditions.push(eq(orders.customerEmail, params.customerEmail));
      }

      // Main orders query with joined data
      const ordersQuery = db
        .select({
          orderId: orders.id,
          orderNumber: orders.id, // Use order ID as order number for now
          customerName: orders.customerName,
          customerEmail: orders.customerEmail,
          customerPhone: orders.customerPhone,
          orderDate: orders.createdAt,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentMethod: orders.paymentMethod,
          total: orders.total,
          tax: orders.tax,
          shippingCost: orders.shippingCost,
          shippingAddress: orders.shippingAddress,
          billingAddress: orders.billingAddress,
          fulfillmentStatus: orders.status,
          razorpayOrderId: orders.razorpayOrderId,
          razorpayPaymentId: orders.razorpayPaymentId,
          notes: orders.notes,
          updatedAt: orders.updatedAt,
          userId: orders.userId
        })
        .from(orders)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orders.createdAt))
        .limit(10000); // Limit for performance

      const ordersResult = await ordersQuery;

      // Get order items for each order if requested
      const exportData = [];
      for (const order of ordersResult) {
        let orderData: any = {
          orderId: `#${order.orderId.slice(-8)}`,
          orderNumber: `#${order.orderNumber.slice(-8)}`,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone || '',
          orderDate: this.formatDateForCSV(order.orderDate),
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod || '',
          total: parseFloat(order.total || '0').toFixed(2),
          tax: parseFloat(order.tax || '0').toFixed(2),
          shippingCost: parseFloat(order.shippingCost || '0').toFixed(2)
        };

        // Add addresses if requested
        if (params.includeShippingDetails) {
          const shippingAddr = order.shippingAddress as any;
          const billingAddr = order.billingAddress as any;
          
          orderData.shippingAddress = shippingAddr ? 
            `${shippingAddr.street || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''} ${shippingAddr.postalCode || ''}` : '';
          orderData.billingAddress = billingAddr ? 
            `${billingAddr.street || ''}, ${billingAddr.city || ''}, ${billingAddr.state || ''} ${billingAddr.postalCode || ''}` : '';
        }

        // Add payment details if requested
        if (params.includePaymentDetails) {
          orderData.razorpayOrderId = order.razorpayOrderId || '';
          orderData.razorpayPaymentId = order.razorpayPaymentId || '';
        }

        // Get order items if requested
        if (params.includeItems) {
          const orderItems = await db
            .select({
              productName: sql<string>`COALESCE(${products.name}, 'Unknown Product')`,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
              totalPrice: orderItems.totalPrice
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.orderId));

          const itemsText = orderItems.map(item => 
            `${item.productName} x${item.quantity} @ $${parseFloat(item.unitPrice).toFixed(2)}`
          ).join('; ');
          
          orderData.items = itemsText;
          orderData.quantities = orderItems.map(item => item.quantity).join('; ');
          orderData.itemPrices = orderItems.map(item => parseFloat(item.unitPrice).toFixed(2)).join('; ');
        }

        orderData.notes = order.notes || '';
        orderData.updatedAt = this.formatDateForCSV(order.updatedAt);

        exportData.push(orderData);
      }

      console.log(`✅ Orders export generated: ${exportData.length} orders`);
      return exportData;
    } catch (error) {
      console.error('❌ Error generating orders export:', error);
      throw error;
    }
  }

  // Revenue Analytics Export with customizable breakdowns
  async exportRevenueAnalytics(params: RevenueExport): Promise<any[]> {
    try {
      console.log('📊 Generating revenue analytics export:', params);

      const startDate = new Date(params.dateFrom);
      const endDate = new Date(params.dateTo);
      const exportData = [];

      // Generate date ranges based on period
      const dateRanges = this.generateDateRanges(startDate, endDate, params.period);

      for (const range of dateRanges) {
        // Get orders for this period
        const ordersInPeriod = await db
          .select({
            total: orders.total,
            paymentStatus: orders.paymentStatus,
            paymentMethod: orders.paymentMethod,
            createdAt: orders.createdAt
          })
          .from(orders)
          .where(
            and(
              sql`${orders.createdAt} >= ${range.start}`,
              sql`${orders.createdAt} < ${range.end}`,
              eq(orders.paymentStatus, 'completed')
            )
          );

        const totalRevenue = ordersInPeriod.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const ordersCount = ordersInPeriod.length;
        const averageOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

        let periodData: any = {
          date: this.formatDateForCSV(range.start),
          period: params.period,
          totalRevenue: totalRevenue.toFixed(2),
          ordersCount,
          averageOrderValue: averageOrderValue.toFixed(2)
        };

        // Add payment method breakdown if requested
        if (params.includePaymentMethodBreakdown) {
          const paymentMethods = ordersInPeriod.reduce((acc, order) => {
            const method = order.paymentMethod || 'unknown';
            acc[method] = (acc[method] || 0) + parseFloat(order.total);
            return acc;
          }, {} as Record<string, number>);

          periodData.paymentMethods = Object.entries(paymentMethods)
            .map(([method, amount]) => `${method}: $${amount.toFixed(2)}`)
            .join('; ');
        }

        exportData.push(periodData);
      }

      console.log(`✅ Revenue analytics export generated: ${exportData.length} periods`);
      return exportData;
    } catch (error) {
      console.error('❌ Error generating revenue analytics export:', error);
      throw error;
    }
  }

  // Enhanced Customers Export with LTV and analytics
  async exportCustomersComprehensive(params: CustomerExport): Promise<any[]> {
    try {
      console.log('👥 Generating comprehensive customers export:', params);

      // Build base query
      const customersQuery = db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phoneNumber: users.phoneNumber,
          createdAt: users.createdAt
        })
        .from(users)
        .where(sql`${users.role} = 'user'`)
        .orderBy(desc(users.createdAt))
        .limit(10000);

      const customersResult = await customersQuery;
      const exportData = [];

      for (const customer of customersResult) {
        // Get customer order statistics
        const customerOrders = await db
          .select({
            total: orders.total,
            createdAt: orders.createdAt
          })
          .from(orders)
          .where(
            and(
              eq(orders.userId, customer.id),
              eq(orders.paymentStatus, 'completed')
            )
          );

        const totalOrders = customerOrders.length;
        const lifetimeValue = customerOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const averageOrderValue = totalOrders > 0 ? lifetimeValue / totalOrders : 0;
        const lastOrderDate = customerOrders.length > 0 
          ? Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime()))
          : null;

        let customerData: any = {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          phoneNumber: customer.phoneNumber || '',
          registrationDate: this.formatDateForCSV(customer.createdAt),
          totalOrders,
          lifetimeValue: lifetimeValue.toFixed(2),
          averageOrderValue: averageOrderValue.toFixed(2),
          lastOrderDate: lastOrderDate ? this.formatDateForCSV(new Date(lastOrderDate)) : ''
        };

        // Add customer segmentation
        let segment = 'new';
        if (totalOrders === 0) segment = 'inactive';
        else if (totalOrders === 1) segment = 'new';
        else if (lifetimeValue > 1000) segment = 'vip';
        else if (totalOrders > 1) segment = 'returning';

        customerData.customerSegment = segment;

        exportData.push(customerData);
      }

      console.log(`✅ Customers export generated: ${exportData.length} customers`);
      return exportData;
    } catch (error) {
      console.error('❌ Error generating customers export:', error);
      throw error;
    }
  }

  // Enhanced Inventory Export with performance metrics
  async exportInventoryComprehensive(params: InventoryExport): Promise<any[]> {
    try {
      console.log('📦 Generating comprehensive inventory export:', params);

      // Build query conditions
      const conditions: any[] = [];
      
      if (params.stockLevel !== 'all') {
        switch (params.stockLevel) {
          case 'low_stock':
            conditions.push(sql`${products.inStock} <= ${products.lowStockThreshold}`);
            break;
          case 'out_of_stock':
            conditions.push(eq(products.inStock, 0));
            break;
          case 'in_stock':
            conditions.push(sql`${products.inStock} > 0`);
            break;
          case 'reorder_point':
            conditions.push(sql`${products.inStock} <= ${products.reorderPoint}`);
            break;
        }
      }

      if (params.categories && params.categories.length > 0) {
        conditions.push(sql`${products.category} = ANY(${params.categories})`);
      }

      if (params.suppliers && params.suppliers.length > 0) {
        conditions.push(sql`${products.supplier} = ANY(${params.suppliers})`);
      }

      const inventoryQuery = db
        .select({
          productId: products.id,
          name: products.name,
          sku: products.sku,
          category: products.category,
          currentStock: products.inStock,
          lowStockThreshold: products.lowStockThreshold,
          reorderPoint: products.reorderPoint,
          maxStock: products.maxStock,
          supplier: products.supplier,
          costPrice: products.costPrice,
          retailPrice: products.price,
          updatedAt: products.updatedAt
        })
        .from(products)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(products.name);

      const inventoryResult = await inventoryQuery;
      const exportData = [];

      for (const product of inventoryResult) {
        let productData: any = {
          productId: product.productId,
          name: product.name,
          sku: product.sku || '',
          category: product.category,
          currentStock: product.currentStock,
          lowStockThreshold: product.lowStockThreshold,
          reorderPoint: product.reorderPoint,
          maxStock: product.maxStock,
          supplier: product.supplier || '',
          costPrice: parseFloat(product.costPrice || '0').toFixed(2),
          retailPrice: parseFloat(product.retailPrice).toFixed(2)
        };

        // Calculate additional metrics if requested
        if (params.includePerformanceMetrics) {
          const costPrice = parseFloat(product.costPrice || '0');
          const retailPrice = parseFloat(product.retailPrice);
          const stockValue = product.currentStock * costPrice;
          const profitMargin = costPrice > 0 ? ((retailPrice - costPrice) / retailPrice * 100) : 0;

          productData.stockValue = stockValue.toFixed(2);
          productData.profitMargin = profitMargin.toFixed(2) + '%';
          
          // Days of stock calculation (simplified)
          const daysOfStock = product.currentStock > 0 ? product.currentStock : 0;
          productData.daysOfStock = daysOfStock;
          
          // Reorder suggestion
          const needsReorder = product.currentStock <= product.reorderPoint;
          productData.reorderSuggestion = needsReorder ? 'Yes' : 'No';
        }

        productData.lastStockUpdate = this.formatDateForCSV(product.updatedAt);

        exportData.push(productData);
      }

      console.log(`✅ Inventory export generated: ${exportData.length} products`);
      return exportData;
    } catch (error) {
      console.error('❌ Error generating inventory export:', error);
      throw error;
    }
  }

  // Business Analytics Export with comprehensive KPIs
  async exportBusinessAnalytics(params: AnalyticsExport): Promise<any[]> {
    try {
      console.log('📈 Generating business analytics export:', params);

      const startDate = new Date(params.dateFrom);
      const endDate = new Date(params.dateTo);
      const exportData = [];

      // Generate date ranges based on aggregation
      const dateRanges = this.generateDateRanges(startDate, endDate, params.aggregation);

      for (const range of dateRanges) {
        // Get comprehensive metrics for this period
        const orders = await this.getOrdersForPeriod(range.start, range.end);
        const customers = await this.getCustomersForPeriod(range.start, range.end);
        
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const ordersCount = orders.length;
        const customersCount = customers.length;
        const conversionRate = customersCount > 0 ? (ordersCount / customersCount * 100) : 0;

        let analyticsData: any = {
          date: this.formatDateForCSV(range.start),
          totalRevenue: totalRevenue.toFixed(2),
          ordersCount,
          customersCount,
          conversionRate: conversionRate.toFixed(2) + '%'
        };

        // Add selected metrics
        if (params.metrics.includes('average_order_value')) {
          const aov = ordersCount > 0 ? totalRevenue / ordersCount : 0;
          analyticsData.averageOrderValue = aov.toFixed(2);
        }

        if (params.metrics.includes('retention_rate')) {
          // Simplified retention calculation
          analyticsData.retentionRate = '85%'; // Placeholder - would need more complex calculation
        }

        exportData.push(analyticsData);
      }

      console.log(`✅ Business analytics export generated: ${exportData.length} periods`);
      return exportData;
    } catch (error) {
      console.error('❌ Error generating business analytics export:', error);
      throw error;
    }
  }

  // CSV Generation Methods
  async generateOrdersCSV(data: any[], params: OrdersExport): Promise<string> {
    const headers = this.generateCSVHeaders(params.fields, 'orders');
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const csvRow = params.fields.map(field => this.escapeCSVValue(row[field] || ''));
      csvRows.push(csvRow.join(','));
    }
    
    return csvRows.join('\n');
  }

  async generateRevenueCSV(data: any[], params: RevenueExport): Promise<string> {
    const headers = this.generateCSVHeaders(params.fields, 'revenue');
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const csvRow = params.fields.map(field => this.escapeCSVValue(row[field] || ''));
      csvRows.push(csvRow.join(','));
    }
    
    return csvRows.join('\n');
  }

  async generateCustomersCSV(data: any[], params: CustomerExport): Promise<string> {
    const headers = this.generateCSVHeaders(params.fields, 'customers');
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const csvRow = params.fields.map(field => this.escapeCSVValue(row[field] || ''));
      csvRows.push(csvRow.join(','));
    }
    
    return csvRows.join('\n');
  }

  async generateInventoryCSV(data: any[], params: InventoryExport): Promise<string> {
    const headers = this.generateCSVHeaders(params.fields, 'inventory');
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const csvRow = params.fields.map(field => this.escapeCSVValue(row[field] || ''));
      csvRows.push(csvRow.join(','));
    }
    
    return csvRows.join('\n');
  }

  async generateAnalyticsCSV(data: any[], params: AnalyticsExport): Promise<string> {
    const headers = this.generateCSVHeaders(params.metrics, 'analytics');
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const csvRow = params.metrics.map(field => this.escapeCSVValue(row[field] || ''));
      csvRows.push(csvRow.join(','));
    }
    
    return csvRows.join('\n');
  }

  // Export Job Management (Simplified in-memory for now)
  private exportJobs: Map<string, ExportJob> = new Map();

  async getExportHistory(params: { adminUserId: string; type?: string; page: number; limit: number }): Promise<ExportHistory> {
    // In a real implementation, this would query a database table
    const allExports = Array.from(this.exportJobs.values())
      .filter(job => job.adminUserId === params.adminUserId)
      .filter(job => !params.type || job.type === params.type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const startIndex = (params.page - 1) * params.limit;
    const exports = allExports.slice(startIndex, startIndex + params.limit);

    return {
      exports,
      totalCount: allExports.length,
      page: params.page,
      limit: params.limit,
      hasMore: startIndex + params.limit < allExports.length
    };
  }

  async getExportJobStatus(exportId: string, adminUserId: string): Promise<ExportJob | undefined> {
    const job = this.exportJobs.get(exportId);
    return job && job.adminUserId === adminUserId ? job : undefined;
  }

  async cancelExportJob(exportId: string, adminUserId: string): Promise<boolean> {
    const job = this.exportJobs.get(exportId);
    if (job && job.adminUserId === adminUserId && job.status === 'pending') {
      job.status = 'cancelled';
      this.exportJobs.set(exportId, job);
      return true;
    }
    return false;
  }

  // Test and Development Helpers
  async generateTestExportData(type: string, sampleSize: number): Promise<any[]> {
    const testData = [];
    
    for (let i = 0; i < sampleSize; i++) {
      switch (type) {
        case 'orders':
          testData.push({
            orderId: `TEST-ORDER-${i + 1}`,
            customerName: `Test Customer ${i + 1}`,
            customerEmail: `test${i + 1}@example.com`,
            orderDate: new Date().toISOString(),
            status: 'completed',
            total: (Math.random() * 500 + 50).toFixed(2)
          });
          break;
        case 'customers':
          testData.push({
            id: `TEST-CUSTOMER-${i + 1}`,
            email: `customer${i + 1}@example.com`,
            firstName: `Customer`,
            lastName: `${i + 1}`,
            registrationDate: new Date().toISOString(),
            totalOrders: Math.floor(Math.random() * 10),
            lifetimeValue: (Math.random() * 1000).toFixed(2)
          });
          break;
        default:
          testData.push({ id: i + 1, name: `Test Item ${i + 1}` });
      }
    }
    
    return testData;
  }

  async generateTestCSV(data: any[], type: string): Promise<string> {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const csvRow = headers.map(header => this.escapeCSVValue(row[header] || ''));
      csvRows.push(csvRow.join(','));
    }
    
    return csvRows.join('\n');
  }

  // Utility CSV Helper Methods
  escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // If the value contains commas, quotes, or newlines, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  formatDateForCSV(date: Date | string, timezone = 'Asia/Kolkata'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    
    // Format as YYYY-MM-DD HH:MM:SS for CSV compatibility
    return dateObj.toISOString().slice(0, 19).replace('T', ' ');
  }

  generateCSVHeaders(fields: string[], type: string): string[] {
    // Map field names to user-friendly headers
    const headerMappings: Record<string, Record<string, string>> = {
      orders: {
        orderId: 'Order ID',
        customerName: 'Customer Name',
        customerEmail: 'Customer Email',
        orderDate: 'Order Date',
        status: 'Status',
        paymentStatus: 'Payment Status',
        total: 'Total Amount',
        items: 'Items'
      },
      customers: {
        id: 'Customer ID',
        email: 'Email',
        firstName: 'First Name',
        lastName: 'Last Name',
        registrationDate: 'Registration Date',
        totalOrders: 'Total Orders',
        lifetimeValue: 'Lifetime Value'
      },
      inventory: {
        productId: 'Product ID',
        name: 'Product Name',
        currentStock: 'Current Stock',
        lowStockThreshold: 'Low Stock Threshold',
        retailPrice: 'Retail Price'
      }
    };

    const mappings = headerMappings[type] || {};
    return fields.map(field => mappings[field] || field);
  }

  // Helper methods for analytics
  private generateDateRanges(startDate: Date, endDate: Date, period: string): Array<{ start: Date; end: Date }> {
    const ranges = [];
    let current = new Date(startDate);
    
    while (current < endDate) {
      const rangeStart = new Date(current);
      let rangeEnd = new Date(current);
      
      switch (period) {
        case 'daily':
          rangeEnd.setDate(rangeEnd.getDate() + 1);
          break;
        case 'weekly':
          rangeEnd.setDate(rangeEnd.getDate() + 7);
          break;
        case 'monthly':
          rangeEnd.setMonth(rangeEnd.getMonth() + 1);
          break;
        case 'quarterly':
          rangeEnd.setMonth(rangeEnd.getMonth() + 3);
          break;
      }
      
      if (rangeEnd > endDate) rangeEnd = new Date(endDate);
      
      ranges.push({ start: rangeStart, end: rangeEnd });
      current = new Date(rangeEnd);
    }
    
    return ranges;
  }

  private async getOrdersForPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select({ total: orders.total, createdAt: orders.createdAt })
      .from(orders)
      .where(
        and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} < ${endDate}`,
          eq(orders.paymentStatus, 'completed')
        )
      );
  }

  private async getCustomersForPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select({ id: users.id, createdAt: users.createdAt })
      .from(users)
      .where(
        and(
          sql`${users.createdAt} >= ${startDate}`,
          sql`${users.createdAt} < ${endDate}`,
          eq(users.role, 'user')
        )
      );
  }

  // ================================
  // ADMIN COMMUNICATIONS IMPLEMENTATIONS
  // ================================

  // WhatsApp Analytics Methods
  async getWhatsappAnalytics(dateRange?: {from: Date, to: Date}): Promise<WhatsappAnalytics> {
    const endDate = dateRange?.to || new Date();
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

    // Get message statistics
    const currentPeriodMessages = await db
      .select({
        count: sql<number>`count(*)`,
        status: whatsappQueue.status,
        type: whatsappQueue.type
      })
      .from(whatsappQueue)
      .where(
        and(
          sql`${whatsappQueue.createdAt} >= ${startDate}`,
          sql`${whatsappQueue.createdAt} <= ${endDate}`
        )
      )
      .groupBy(whatsappQueue.status, whatsappQueue.type);

    const previousPeriodMessages = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(whatsappQueue)
      .where(
        and(
          sql`${whatsappQueue.createdAt} >= ${previousStartDate}`,
          sql`${whatsappQueue.createdAt} < ${startDate}`
        )
      );

    // Get delivery statistics
    const deliveryStats = await db
      .select({
        count: sql<number>`count(*)`,
        status: whatsappDeliveryLogs.status
      })
      .from(whatsappDeliveryLogs)
      .where(
        and(
          sql`${whatsappDeliveryLogs.createdAt} >= ${startDate}`,
          sql`${whatsappDeliveryLogs.createdAt} <= ${endDate}`
        )
      )
      .groupBy(whatsappDeliveryLogs.status);

    // Get opt-in statistics
    const optInStats = await db
      .select({
        optedIn: sql<number>`count(*) filter (where ${whatsappPreferences.isOptedIn} = true)`,
        total: sql<number>`count(*)`
      })
      .from(whatsappPreferences);

    // Get cost statistics
    const costStats = await db
      .select({
        totalCost: sql<number>`sum(COALESCE(${whatsappDeliveryLogs.price}::numeric, 0))`,
        messageCount: sql<number>`count(*)`
      })
      .from(whatsappDeliveryLogs)
      .where(
        and(
          sql`${whatsappDeliveryLogs.createdAt} >= ${startDate}`,
          sql`${whatsappDeliveryLogs.createdAt} <= ${endDate}`
        )
      );

    // Calculate statistics
    const totalCurrentMessages = currentPeriodMessages.reduce((sum, stat) => sum + stat.count, 0);
    const totalPreviousMessages = previousPeriodMessages[0]?.count || 0;
    
    const messageChange = totalCurrentMessages - totalPreviousMessages;
    const messageChangePercent = totalPreviousMessages > 0 ? (messageChange / totalPreviousMessages) * 100 : 0;

    const messagesByType = {
      orderConfirmations: currentPeriodMessages.filter(m => m.type === 'order_confirmation').reduce((sum, m) => sum + m.count, 0),
      orderUpdates: currentPeriodMessages.filter(m => m.type === 'order_status').reduce((sum, m) => sum + m.count, 0),
      paymentConfirmations: currentPeriodMessages.filter(m => m.type === 'payment_confirmation').reduce((sum, m) => sum + m.count, 0),
      shippingNotifications: currentPeriodMessages.filter(m => m.type === 'shipping_notification').reduce((sum, m) => sum + m.count, 0),
      deliveryNotifications: currentPeriodMessages.filter(m => m.type === 'delivery_notification').reduce((sum, m) => sum + m.count, 0),
      stockAlerts: currentPeriodMessages.filter(m => m.type === 'stock_alert').reduce((sum, m) => sum + m.count, 0),
      promotional: currentPeriodMessages.filter(m => m.type === 'promotional').reduce((sum, m) => sum + m.count, 0),
      accountNotifications: currentPeriodMessages.filter(m => m.type === 'account_notification').reduce((sum, m) => sum + m.count, 0),
    };

    const messageStatusBreakdown = {
      sent: deliveryStats.filter(s => s.status === 'sent').reduce((sum, s) => sum + s.count, 0),
      delivered: deliveryStats.filter(s => s.status === 'delivered').reduce((sum, s) => sum + s.count, 0),
      read: deliveryStats.filter(s => s.status === 'read').reduce((sum, s) => sum + s.count, 0),
      failed: deliveryStats.filter(s => s.status === 'failed').reduce((sum, s) => sum + s.count, 0),
    };

    const totalSent = messageStatusBreakdown.sent + messageStatusBreakdown.delivered + messageStatusBreakdown.read;
    const deliveryRate = totalSent > 0 ? ((messageStatusBreakdown.delivered + messageStatusBreakdown.read) / totalSent) * 100 : 0;
    const readRate = messageStatusBreakdown.delivered > 0 ? (messageStatusBreakdown.read / messageStatusBreakdown.delivered) * 100 : 0;

    const totalCost = costStats[0]?.totalCost || 0;
    const totalCostMessages = costStats[0]?.messageCount || 1;

    // Get time series data
    const timeSeries = await this.getWhatsappTimeSeriesData(startDate, endDate);

    return {
      totalMessages: {
        current: totalCurrentMessages,
        previous: totalPreviousMessages,
        change: messageChange,
        changePercent: messageChangePercent,
        trend: messageChangePercent > 5 ? 'up' : messageChangePercent < -5 ? 'down' : 'stable',
      },
      deliveryRate,
      readRate,
      optInRate: optInStats[0]?.total > 0 ? (optInStats[0].optedIn / optInStats[0].total) * 100 : 0,
      optOutRate: optInStats[0]?.total > 0 ? ((optInStats[0].total - optInStats[0].optedIn) / optInStats[0].total) * 100 : 0,
      responseRate: 75, // Mock response rate - would need additional tracking
      averageResponseTime: 15, // Mock average response time in minutes
      totalOptedInUsers: optInStats[0]?.optedIn || 0,
      activeUsers: Math.floor((optInStats[0]?.optedIn || 0) * 0.7), // Mock active users
      messagesByType,
      messageStatusBreakdown,
      costAnalysis: {
        totalCost,
        costPerMessage: totalCostMessages > 0 ? totalCost / totalCostMessages : 0,
        costPerDeliveredMessage: messageStatusBreakdown.delivered > 0 ? totalCost / messageStatusBreakdown.delivered : 0,
        monthlyCostTrend: await this.getWhatsappMonthlyCostTrend(),
      },
      timeSeries,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getWhatsappTimeSeriesData(startDate: Date, endDate: Date): Promise<any[]> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const timeSeries = [];
    
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayStats = await db
        .select({
          sent: sql<number>`count(*) filter (where ${whatsappQueue.status} = 'sent')`,
          delivered: sql<number>`count(*) filter (where ${whatsappQueue.status} = 'delivered')`,
          read: sql<number>`count(*) filter (where ${whatsappQueue.readAt} is not null)`,
          failed: sql<number>`count(*) filter (where ${whatsappQueue.status} = 'failed')`,
        })
        .from(whatsappQueue)
        .where(
          and(
            sql`${whatsappQueue.createdAt} >= ${dayStart}`,
            sql`${whatsappQueue.createdAt} < ${dayEnd}`
          )
        );

      timeSeries.push({
        date: dayStart.toISOString().split('T')[0],
        sent: dayStats[0]?.sent || 0,
        delivered: dayStats[0]?.delivered || 0,
        read: dayStats[0]?.read || 0,
        failed: dayStats[0]?.failed || 0,
      });
    }
    
    return timeSeries;
  }

  private async getWhatsappMonthlyCostTrend(): Promise<Array<{month: string, cost: number}>> {
    const result = await db
      .select({
        month: sql<string>`to_char(${whatsappDeliveryLogs.createdAt}, 'YYYY-MM')`,
        cost: sql<number>`sum(COALESCE(${whatsappDeliveryLogs.price}::numeric, 0))`
      })
      .from(whatsappDeliveryLogs)
      .where(sql`${whatsappDeliveryLogs.createdAt} >= NOW() - INTERVAL '12 months'`)
      .groupBy(sql`to_char(${whatsappDeliveryLogs.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${whatsappDeliveryLogs.createdAt}, 'YYYY-MM')`);

    return result.map(row => ({
      month: row.month,
      cost: row.cost
    }));
  }

  async exportWhatsappAnalytics(filters: any): Promise<any[]> {
    const analytics = await this.getWhatsappAnalytics(filters.dateRange);
    
    return [
      { metric: 'Total Messages', value: analytics.totalMessages.current },
      { metric: 'Delivery Rate', value: `${analytics.deliveryRate.toFixed(2)}%` },
      { metric: 'Read Rate', value: `${analytics.readRate.toFixed(2)}%` },
      { metric: 'Total Cost', value: `$${analytics.costAnalysis.totalCost.toFixed(2)}` },
      { metric: 'Cost Per Message', value: `$${analytics.costAnalysis.costPerMessage.toFixed(4)}` },
      ...Object.entries(analytics.messagesByType).map(([type, count]) => ({
        metric: `${type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`,
        value: count
      }))
    ];
  }

  async getWhatsappEngagementStats(dateRange?: {from: Date, to: Date}): Promise<any> {
    const analytics = await this.getWhatsappAnalytics(dateRange);
    return {
      optInRate: analytics.optInRate,
      optOutRate: analytics.optOutRate,
      responseRate: analytics.responseRate,
      averageResponseTime: analytics.averageResponseTime,
      totalOptedInUsers: analytics.totalOptedInUsers,
      activeUsers: analytics.activeUsers,
    };
  }

  async getWhatsappMessageBreakdown(dateRange?: {from: Date, to: Date}): Promise<any> {
    const analytics = await this.getWhatsappAnalytics(dateRange);
    return {
      messagesByType: analytics.messagesByType,
      messageStatusBreakdown: analytics.messageStatusBreakdown,
    };
  }

  async getWhatsappCostAnalysis(dateRange?: {from: Date, to: Date}): Promise<any> {
    const analytics = await this.getWhatsappAnalytics(dateRange);
    return analytics.costAnalysis;
  }

  // Message Template Methods
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    return await db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));
  }

  async getMessageTemplate(id: string): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template;
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [newTemplate] = await db.insert(messageTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newTemplate;
  }

  async updateMessageTemplate(id: string, updates: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined> {
    const [updated] = await db
      .update(messageTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(messageTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteMessageTemplate(id: string): Promise<void> {
    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
  }

  async approveMessageTemplate(id: string, adminUserId: string): Promise<MessageTemplate | undefined> {
    const [updated] = await db
      .update(messageTemplates)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: adminUserId,
        updatedAt: new Date(),
      })
      .where(eq(messageTemplates.id, id))
      .returning();
    return updated;
  }

  async rejectMessageTemplate(id: string, adminUserId: string, reason: string): Promise<MessageTemplate | undefined> {
    const [updated] = await db
      .update(messageTemplates)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(messageTemplates.id, id))
      .returning();
    return updated;
  }

  // Notification Management Methods
  async getNotificationMetrics(dateRange?: {from: Date, to: Date}): Promise<NotificationMetrics> {
    const endDate = dateRange?.to || new Date();
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

    // Get notification history stats
    const currentNotifications = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationHistory)
      .where(
        and(
          sql`${notificationHistory.createdAt} >= ${startDate}`,
          sql`${notificationHistory.createdAt} <= ${endDate}`
        )
      );

    const previousNotifications = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationHistory)
      .where(
        and(
          sql`${notificationHistory.createdAt} >= ${previousStartDate}`,
          sql`${notificationHistory.createdAt} < ${startDate}`
        )
      );

    // Get email stats
    const emailStats = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailQueue)
      .where(
        and(
          sql`${emailQueue.createdAt} >= ${startDate}`,
          sql`${emailQueue.createdAt} <= ${endDate}`
        )
      );

    // Get SMS stats
    const smsStats = await db
      .select({ count: sql<number>`count(*)` })
      .from(smsQueue)
      .where(
        and(
          sql`${smsQueue.createdAt} >= ${startDate}`,
          sql`${smsQueue.createdAt} <= ${endDate}`
        )
      );

    // Get WhatsApp stats
    const whatsappStats = await db
      .select({ count: sql<number>`count(*)` })
      .from(whatsappQueue)
      .where(
        and(
          sql`${whatsappQueue.createdAt} >= ${startDate}`,
          sql`${whatsappQueue.createdAt} <= ${endDate}`
        )
      );

    // Get failed notifications
    const failedNotifications = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationHistory)
      .where(
        and(
          sql`${notificationHistory.createdAt} >= ${startDate}`,
          sql`${notificationHistory.createdAt} <= ${endDate}`,
          eq(notificationHistory.status, 'failed')
        )
      );

    const totalCurrent = currentNotifications[0]?.count || 0;
    const totalPrevious = previousNotifications[0]?.count || 0;
    const change = totalCurrent - totalPrevious;
    const changePercent = totalPrevious > 0 ? (change / totalPrevious) * 100 : 0;

    return {
      totalNotifications: {
        current: totalCurrent,
        previous: totalPrevious,
        change,
        changePercent,
        trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
      },
      emailsSent: {
        current: emailStats[0]?.count || 0,
        previous: 0, // Would need previous period calculation
        change: 0,
        changePercent: 0,
        trend: 'stable',
      },
      smsSent: {
        current: smsStats[0]?.count || 0,
        previous: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
      },
      whatsappSent: {
        current: whatsappStats[0]?.count || 0,
        previous: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
      },
      averageDeliveryRate: 92.5, // Mock delivery rate
      emailDeliveryRate: 94.2,
      smsDeliveryRate: 98.1,
      whatsappDeliveryRate: 89.7,
      queuedNotifications: 0, // Mock queued notifications
      failedNotifications: failedNotifications[0]?.count || 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getNotificationHistory(params: any): Promise<NotificationHistory[]> {
    let query = db.select().from(notificationHistory);
    
    if (params.status) {
      query = query.where(eq(notificationHistory.status, params.status));
    }
    
    if (params.channels) {
      query = query.where(sql`${notificationHistory.channels} && ${params.channels}`);
    }
    
    return await query.orderBy(desc(notificationHistory.createdAt)).limit(params.limit || 50);
  }

  async createNotificationHistory(history: InsertNotificationHistory): Promise<NotificationHistory> {
    const [newHistory] = await db.insert(notificationHistory).values({
      ...history,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newHistory;
  }

  async sendBulkNotifications(request: BulkNotificationRequest): Promise<BulkNotificationResult> {
    // Create notification history record
    const history = await this.createNotificationHistory({
      subject: request.subject,
      message: request.message,
      channels: request.channels,
      status: 'queued',
      recipientCount: 0, // Will be updated after processing
      createdBy: 'admin-user-id', // Would come from auth context
    });

    // Process recipients and queue notifications
    // This would integrate with existing email, SMS, and WhatsApp services
    const estimatedRecipients = 100; // Mock recipient count
    
    // Update notification history with recipient count
    await db
      .update(notificationHistory)
      .set({
        recipientCount: estimatedRecipients,
        status: 'sending',
        updatedAt: new Date(),
      })
      .where(eq(notificationHistory.id, history.id));

    return {
      id: history.id,
      status: 'queued',
      recipientCount: estimatedRecipients,
      successCount: 0,
      failureCount: 0,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    };
  }

  async retryNotification(id: string): Promise<NotificationHistory | undefined> {
    const [updated] = await db
      .update(notificationHistory)
      .set({
        status: 'queued',
        updatedAt: new Date(),
      })
      .where(eq(notificationHistory.id, id))
      .returning();
    return updated;
  }

  async exportNotificationsData(filters: any): Promise<any[]> {
    const notifications = await this.getNotificationHistory(filters);
    
    return notifications.map(notification => ({
      id: notification.id,
      subject: notification.subject,
      channels: notification.channels.join(', '),
      status: notification.status,
      recipientCount: notification.recipientCount,
      successCount: notification.successCount,
      failureCount: notification.failureCount,
      createdAt: this.formatDateForCSV(notification.createdAt),
      sentAt: notification.sentAt ? this.formatDateForCSV(notification.sentAt) : '',
    }));
  }

  // Recipient Groups Methods
  async getRecipientGroups(): Promise<RecipientGroup[]> {
    return await db.select().from(recipientGroups).where(eq(recipientGroups.isActive, true));
  }

  async getRecipientGroup(id: string): Promise<RecipientGroup | undefined> {
    const [group] = await db.select().from(recipientGroups).where(eq(recipientGroups.id, id));
    return group;
  }

  async createRecipientGroup(group: InsertRecipientGroup): Promise<RecipientGroup> {
    const userCount = await this.calculateRecipientGroupSize(group.criteria);
    
    const [newGroup] = await db.insert(recipientGroups).values({
      ...group,
      userCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newGroup;
  }

  async updateRecipientGroup(id: string, updates: Partial<InsertRecipientGroup>): Promise<RecipientGroup | undefined> {
    let updateData = { ...updates, updatedAt: new Date() };
    
    if (updates.criteria) {
      const userCount = await this.calculateRecipientGroupSize(updates.criteria);
      updateData.userCount = userCount;
    }
    
    const [updated] = await db
      .update(recipientGroups)
      .set(updateData)
      .where(eq(recipientGroups.id, id))
      .returning();
    return updated;
  }

  async deleteRecipientGroup(id: string): Promise<void> {
    await db
      .update(recipientGroups)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(recipientGroups.id, id));
  }

  async calculateRecipientGroupSize(criteria: any): Promise<number> {
    // Mock calculation - would implement based on actual criteria
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Math.floor((totalUsers[0]?.count || 0) * 0.3); // Mock 30% of users
  }

  // Admin Customer Management Methods
  async getAdminCustomers(query: any): Promise<any> {
    const limit = query.limit || 20;
    const offset = ((query.page || 1) - 1) * limit;
    
    // Get customers with basic analytics
    const customersResult = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phoneNumber: users.phoneNumber,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${users.createdAt} DESC`);

    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const total = totalResult[0]?.count || 0;
    
    // Get order analytics for each customer
    const customerIds = customersResult.map(c => c.id);
    const orderAnalytics = customerIds.length > 0 ? await db.select({
      userId: orders.userId,
      totalOrders: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      lastOrderDate: sql<string>`MAX(${orders.createdAt})`,
      firstOrderDate: sql<string>`MIN(${orders.createdAt})`,
    }).from(orders)
      .where(sql`${orders.userId} IN (${sql.join(customerIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(orders.userId) : [];
    
    // Create a map for quick lookup
    const analyticsMap = new Map(orderAnalytics.map(a => [a.userId, a]));
    
    // Transform to expected format
    const customers = customersResult.map(user => {
      const userAnalytics = analyticsMap.get(user.id);
      const totalOrders = userAnalytics?.totalOrders || 0;
      const totalRevenue = userAnalytics?.totalRevenue || 0;
      const lastOrderDate = userAnalytics?.lastOrderDate || null;
      const firstOrderDate = userAnalytics?.firstOrderDate || null;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate days since last order
      const daysSinceLastOrder = lastOrderDate 
        ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Determine customer segment
      let customerSegment = 'new';
      if (totalOrders === 0) {
        customerSegment = 'new';
      } else if (totalOrders >= 5 || totalRevenue >= 10000) {
        customerSegment = 'vip';
      } else if (totalOrders >= 2) {
        customerSegment = 'returning';
      } else if (daysSinceLastOrder && daysSinceLastOrder > 90) {
        customerSegment = 'inactive';
      }
      
      return {
        ...user,
        createdAt: user.createdAt?.toISOString() || '',
        updatedAt: user.updatedAt?.toISOString() || '',
        analytics: {
          lifetimeValue: totalRevenue,
          totalOrders,
          totalRevenue,
          averageOrderValue,
          firstOrderDate,
          lastOrderDate,
          daysSinceLastOrder,
          customerLifespanDays: null,
          orderFrequency: null,
          customerSegment,
          riskScore: 0,
          valueScore: 0,
          primaryCity: null,
          primaryState: null,
          preferredCategories: [],
          emailEngagementRate: null,
          lastEngagementDate: null,
        },
        recentOrders: [],
        addresses: [],
        communicationPreferences: {
          emailNotifications: {},
          smsNotifications: {},
        },
        notesCount: 0,
        hasUrgentNotes: false,
      };
    });

    return {
      customers,
      pagination: {
        page: query.page || 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: (query.page || 1) > 1,
      },
      summary: {
        totalCustomers: total,
        newCustomers: 0,
        returningCustomers: 0,
        vipCustomers: 0,
        atRiskCustomers: 0,
        inactiveCustomers: 0,
        averageLifetimeValue: 0,
      },
    };
  }

  async getAdminCustomerDetail(customerId: string): Promise<any> {
    const user = await this.getUser(customerId);
    if (!user) return undefined;

    // Get order analytics for this customer
    const [orderAnalytics] = await db.select({
      totalOrders: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      lastOrderDate: sql<string>`MAX(${orders.createdAt})`,
      firstOrderDate: sql<string>`MIN(${orders.createdAt})`,
    }).from(orders)
      .where(eq(orders.userId, customerId));
    
    const totalOrders = orderAnalytics?.totalOrders || 0;
    const totalRevenue = orderAnalytics?.totalRevenue || 0;
    const lastOrderDate = orderAnalytics?.lastOrderDate || null;
    const firstOrderDate = orderAnalytics?.firstOrderDate || null;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate days since last order
    const daysSinceLastOrder = lastOrderDate 
      ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    // Determine customer segment
    let customerSegment = 'new';
    if (totalOrders === 0) {
      customerSegment = 'new';
    } else if (totalOrders >= 5 || totalRevenue >= 10000) {
      customerSegment = 'vip';
    } else if (totalOrders >= 2) {
      customerSegment = 'returning';
    } else if (daysSinceLastOrder && daysSinceLastOrder > 90) {
      customerSegment = 'inactive';
    }

    // Get recent orders
    const recentOrders = await db.select({
      id: orders.id,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    }).from(orders)
      .where(eq(orders.userId, customerId))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(5);

    return {
      ...user,
      createdAt: user.createdAt?.toISOString() || '',
      updatedAt: user.updatedAt?.toISOString() || '',
      analytics: {
        lifetimeValue: totalRevenue,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        firstOrderDate,
        lastOrderDate,
        daysSinceLastOrder,
        customerLifespanDays: null,
        orderFrequency: null,
        customerSegment,
        riskScore: 0,
        valueScore: 0,
        primaryCity: null,
        primaryState: null,
        preferredCategories: [],
        emailEngagementRate: null,
        lastEngagementDate: null,
      },
      recentOrders: recentOrders.map(o => ({
        ...o,
        createdAt: o.createdAt?.toISOString() || '',
      })),
      addresses: [],
      communicationPreferences: {
        emailNotifications: {},
        smsNotifications: {},
      },
      notesCount: 0,
      hasUrgentNotes: false,
    };
  }

  async getCustomerOrderHistory(customerId: string, query: { page?: number; limit?: number; status?: string }): Promise<{
    orders: Array<{
      id: string;
      total: number;
      status: string;
      paymentStatus: string;
      createdAt: string;
      itemCount: number;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const limit = query.limit || 20;
    const page = query.page || 1;
    const offset = (page - 1) * limit;

    // Get orders for this customer
    const customerOrders = await db.select({
      id: orders.id,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
    }).from(orders)
      .where(eq(orders.userId, customerId))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(orders)
      .where(eq(orders.userId, customerId));
    
    const total = countResult?.count || 0;

    // Get item counts for each order
    const orderIds = customerOrders.map(o => o.id);
    const itemCounts = orderIds.length > 0 ? await db.select({
      orderId: orderItems.orderId,
      itemCount: sql<number>`COUNT(*)`
    }).from(orderItems)
      .where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(orderItems.orderId) : [];
    
    const itemCountMap = new Map(itemCounts.map(ic => [ic.orderId, ic.itemCount]));

    return {
      orders: customerOrders.map(o => ({
        id: o.id,
        total: Number(o.total) || 0,
        status: o.status || 'pending',
        paymentStatus: o.paymentStatus || 'pending',
        createdAt: o.createdAt?.toISOString() || '',
        itemCount: itemCountMap.get(o.id) || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async exportCustomerData(exportConfig: any): Promise<any[]> {
    const customersResult = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phoneNumber: users.phoneNumber,
      createdAt: users.createdAt,
    }).from(users);

    return customersResult.map(user => ({
      ID: user.id,
      Email: user.email,
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      'Phone Number': user.phoneNumber || '',
      'Registration Date': user.createdAt?.toISOString() || '',
    }));
  }

  async updateCustomerProfile(customerId: string, updates: any, adminUserId: string, ipAddress?: string, userAgent?: string): Promise<any> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, customerId))
      .returning();

    if (!updated) throw new Error('Customer not found');

    return this.getAdminCustomerDetail(customerId);
  }

  async getCustomerSegmentation(): Promise<{
    segments: Array<{
      segment: string;
      count: number;
      percentage: number;
      averageLtv: number;
      description: string;
    }>;
    totalCustomers: number;
  }> {
    // Get total customers count
    const totalCustomersResult = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(users)
      .where(eq(users.role, 'user'));
    const totalCustomers = totalCustomersResult[0]?.count || 0;

    // Get new customers (registered in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomersResult = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(users)
      .where(
        and(
          eq(users.role, 'user'),
          sql`${users.createdAt} >= ${thirtyDaysAgo}`
        )
      );
    const newCustomers = newCustomersResult[0]?.count || 0;

    // Get high value customers (top 20% by LTV) using proper subquery
    const customerLtvSubquery = db
      .select({
        userId: orders.userId,
        totalSpent: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`.as('total_spent')
      })
      .from(orders)
      .where(eq(orders.status, 'completed'))
      .groupBy(orders.userId)
      .as('customer_ltv');

    const ltvThresholdResult = await db
      .select({ 
        threshold: sql<number>`PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY ${customerLtvSubquery.totalSpent})` 
      })
      .from(customerLtvSubquery);
    
    const ltvThreshold = Math.max(ltvThresholdResult[0]?.threshold || 0, 0.01); // Ensure minimum threshold
    
    const highValueCustomersResult = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(customerLtvSubquery)
      .where(
        and(
          sql`${customerLtvSubquery.totalSpent} > 0`, // Must have positive spend
          sql`${customerLtvSubquery.totalSpent} >= ${ltvThreshold}`
        )
      );
    const highValueCustomers = highValueCustomersResult[0]?.count || 0;

    // Get at-risk customers (last order more than 90 days ago or no orders, excluding new customers)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const customerLastOrderSubquery = db
      .select({
        userId: users.id,
        createdAt: users.createdAt,
        lastOrderDate: sql<Date>`MAX(${orders.createdAt})`.as('last_order')
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .where(eq(users.role, 'user'))
      .groupBy(users.id, users.createdAt)
      .as('customer_last_order');

    const atRiskCustomersResult = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(customerLastOrderSubquery)
      .where(
        and(
          sql`${customerLastOrderSubquery.createdAt} < ${ninetyDaysAgo}`, // Exclude new customers
          or(
            sql`${customerLastOrderSubquery.lastOrderDate} < ${ninetyDaysAgo}`,
            sql`${customerLastOrderSubquery.lastOrderDate} IS NULL`
          )
        )
      );
    const atRiskCustomers = atRiskCustomersResult[0]?.count || 0;

    // Calculate segments
    const segments = [
      {
        segment: 'New Customers',
        count: newCustomers,
        percentage: totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100 * 100) / 100 : 0,
        averageLtv: 0,
        description: 'Registered in last 30 days',
      },
      {
        segment: 'High Value',
        count: highValueCustomers,
        percentage: totalCustomers > 0 ? Math.round((highValueCustomers / totalCustomers) * 100 * 100) / 100 : 0,
        averageLtv: 0,
        description: 'Top 20% by lifetime value',
      },
      {
        segment: 'At Risk',
        count: atRiskCustomers,
        percentage: totalCustomers > 0 ? Math.round((atRiskCustomers / totalCustomers) * 100 * 100) / 100 : 0,
        averageLtv: 0,
        description: 'No orders in last 90 days',
      },
    ];

    return {
      segments,
      totalCustomers,
    };
  }

  async getCustomersNeedingAttention(): Promise<{
    atRisk: any[];
    inactive: any[];
    highValue: any[];
    newCustomers: any[];
  }> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get at-risk customers (last order more than 90 days ago or never ordered, excluding new customers)
    const atRiskCustomers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
        lastOrderDate: sql<string>`MAX(${orders.createdAt})`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .where(
        and(
          eq(users.role, 'user'),
          sql`${users.createdAt} < ${ninetyDaysAgo}` // Exclude new customers from at-risk
        )
      )
      .groupBy(users.id, users.email, users.firstName, users.lastName, users.createdAt)
      .having(
        or(
          sql`MAX(${orders.createdAt}) < ${ninetyDaysAgo}`,
          sql`MAX(${orders.createdAt}) IS NULL`
        )
      )
      .limit(10);

    // Get inactive customers (last order between 60-90 days ago)
    const inactiveCustomers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        lastOrderDate: sql<string>`MAX(${orders.createdAt})`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .where(eq(users.role, 'user'))
      .groupBy(users.id, users.email, users.firstName, users.lastName)
      .having(
        and(
          sql`MAX(${orders.createdAt}) < ${sixtyDaysAgo}`,
          sql`MAX(${orders.createdAt}) >= ${ninetyDaysAgo}` // Between 60-90 days
        )
      )
      .limit(10);

    // Get high value customers (top 10 by total spent)
    const highValueCustomers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        totalSpent: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`,
      })
      .from(users)
      .leftJoin(orders, and(eq(users.id, orders.userId), eq(orders.status, 'completed')))
      .where(eq(users.role, 'user'))
      .groupBy(users.id, users.email, users.firstName, users.lastName)
      .having(sql`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0) > 0`) // Only customers who have spent
      .orderBy(sql`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0) DESC`)
      .limit(10);

    // Get new customers (registered in last 30 days)
    const newCustomersResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'user'),
          sql`${users.createdAt} >= ${thirtyDaysAgo}`
        )
      )
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(10);

    return {
      atRisk: atRiskCustomers,
      inactive: inactiveCustomers,
      highValue: highValueCustomers,
      newCustomers: newCustomersResult,
    };
  }

  // Site Settings Methods
  async getSiteSettings(): Promise<SiteSettings> {
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
    if (settings) return settings;
    // Seed a default row if none exists
    const [created] = await db.insert(siteSettings).values({ id: 1 }).returning();
    return created;
  }

  async upsertSiteSettings(data: InsertSiteSettings): Promise<SiteSettings> {
    const [result] = await db
      .insert(siteSettings)
      .values({ id: 1, ...data })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();