import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  decimal, 
  integer, 
  timestamp, 
  jsonb, 
  index,
  uniqueIndex,
  unique,
  boolean 
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Updated users table for JWT Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phoneNumber: varchar("phone_number"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("user"), // user, admin
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationTokenExpiry: timestamp("email_verification_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table for dynamic product categorization
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mainCategory: text("main_category").notNull().unique(),
  subcategories: text("subcategories").array().notNull().default([]),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_categories_main_category").on(table.mainCategory),
]);

// Shipping addresses for users
export const userAddresses = pgTable("user_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // e.g., "Home", "Office"
  recipientName: text("recipient_name").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("India"),
  phoneNumber: text("phone_number"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Partial unique index to ensure only one default address per user
  uniqueIndex("unique_default_address_per_user").on(table.userId).where(sql`is_default = true`),
  // Regular indexes for efficient lookups
  index("idx_user_addresses_user_id").on(table.userId),
]);

// Wishlist for users
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("per unit"), // per piece, per bunch, per 50g, per 100g, per 250g, per 500g, per kg, per tray, per pack, per bag, per unit
  size: text("size"), // Size field for clothing/fashion items (e.g., S, M, L, XL or 32, 34, 36)
  colors: text("colors"),
  mainCategory: text("main_category").notNull().default("Kits"), // Fresh Produce or Kits
  category: text("category").notNull(),
  images: text("images").array().default([]).notNull(),
  specifications: text("specifications").array().default([]),
  planterCount: integer("planter_count"),
  dimensions: text("dimensions"),
  cultivableCrops: text("cultivable_crops"),
  structureMaterial: text("structure_material"),
  inStock: integer("in_stock").notNull().default(1),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
  reorderPoint: integer("reorder_point").notNull().default(10),
  maxStock: integer("max_stock").notNull().default(100),
  sku: text("sku"),
  supplier: text("supplier"),
  shippingChargeApplicable: boolean("shipping_charge_applicable").notNull().default(false),
  shippingCharge: decimal("shipping_charge", { precision: 10, scale: 2 }).default("0"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product variants for color and size combinations
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").unique(),
  color: text("color"),
  size: text("size"),
  price: decimal("price", { precision: 10, scale: 2 }),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }), // Original price for showing discounts
  stockQuantity: integer("stock_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  weight: decimal("weight", { precision: 10, scale: 2 }), // For shipping calculations
  shippingChargeApplicable: boolean("shipping_charge_applicable").notNull().default(false),
  shippingCharge: decimal("shipping_charge", { precision: 10, scale: 2 }).default("0"), // Per-unit product shipping charge
  images: text("images").array().default([]), // Variant-specific images
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0), // For display ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_product_variants_product_id").on(table.productId),
  index("idx_product_variants_sku").on(table.sku),
  index("idx_product_variants_color").on(table.color),
  index("idx_product_variants_size").on(table.size),
  index("idx_product_variants_is_active").on(table.isActive),
  // Unique constraint for color-size combination per product
  uniqueIndex("unique_product_color_size").on(
    table.productId,
    sql`COALESCE(${table.color}, '')`,
    sql`COALESCE(${table.size}, '')`
  ),
]);

// Bulk operations tracking for inventory management
export const bulkOperations = pgTable("bulk_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationType: text("operation_type").notNull(), // bulk_adjustment, csv_upload, manual_bulk
  description: text("description"), // Human-readable description of the operation
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  totalItems: integer("total_items").notNull(), // Number of products affected
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed, partially_completed
  fileName: text("file_name"), // If uploaded via CSV
  fileSize: integer("file_size"), // File size in bytes
  errorLog: text("error_log"), // JSON string of errors if any
  metadata: jsonb("metadata"), // Additional operation metadata
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_bulk_operations_admin_user").on(table.adminUserId),
  index("idx_bulk_operations_status").on(table.status),
  index("idx_bulk_operations_type").on(table.operationType),
  index("idx_bulk_operations_created_at").on(table.createdAt),
]);

// Enhanced inventory tracking and history with batch support
export const inventoryHistory = pgTable("inventory_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  changeType: text("change_type").notNull(), // stock_in, stock_out, adjustment, order, restock, bulk_adjustment, damage, return
  quantityBefore: integer("quantity_before").notNull(),
  quantityChanged: integer("quantity_changed").notNull(), // Positive or negative
  quantityAfter: integer("quantity_after").notNull(),
  reason: text("reason"), // Manual adjustment, order fulfillment, etc.
  reference: text("reference"), // Order ID, adjustment ID, etc.
  userId: varchar("user_id").references(() => users.id),
  bulkOperationId: varchar("bulk_operation_id").references(() => bulkOperations.id), // For batch operations
  adjustmentType: text("adjustment_type"), // restock, adjustment, damage, return, correction
  notes: text("notes"), // Additional notes for the change
  isSystemChange: boolean("is_system_change").default(false), // True for automated changes
  metadata: jsonb("metadata"), // Additional change metadata
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_inventory_history_product_id").on(table.productId),
  index("idx_inventory_history_user_id").on(table.userId),
  index("idx_inventory_history_bulk_operation").on(table.bulkOperationId),
  index("idx_inventory_history_change_type").on(table.changeType),
  index("idx_inventory_history_created_at").on(table.createdAt),
  index("idx_inventory_history_adjustment_type").on(table.adjustmentType),
]);

// Stock alerts - for low stock notifications
export const stockAlerts = pgTable("stock_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // low_stock, out_of_stock, reorder_point
  currentStock: integer("current_stock").notNull(),
  threshold: integer("threshold").notNull(),
  status: text("status").default("active"), // active, resolved, dismissed
  notifiedAt: timestamp("notified_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Product reviews and ratings
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  review: text("review"),
  images: text("images").array().default([]), // Review photos
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulVotes: integer("helpful_votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint to prevent duplicate reviews per user per product
  uniqueIndex("unique_user_product_review").on(table.productId, table.userId),
  // Indexes for efficient lookups
  index("idx_product_reviews_product_id").on(table.productId),
  index("idx_product_reviews_user_id").on(table.userId),
  index("idx_product_reviews_rating").on(table.rating),
]);

// Review helpful votes - tracking which users found which reviews helpful
export const reviewHelpfulVotes = pgTable("review_helpful_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => productReviews.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraint to prevent duplicate helpful votes per user per review
  uniqueIndex("unique_user_review_helpful_vote").on(table.reviewId, table.userId),
  // Indexes for efficient lookups
  index("idx_review_helpful_votes_review_id").on(table.reviewId),
  index("idx_review_helpful_votes_user_id").on(table.userId),
]);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  notifyWhenAvailable: boolean("notify_when_available").notNull().default(true),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("unique_waitlist_email_product").on(table.email, table.productId),
  index("idx_waitlist_product_id").on(table.productId),
  index("idx_waitlist_email").on(table.email),
]);

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  size: text("size"), // Product size (e.g., S, M, L, XL, etc.)
  color: text("color"),
  sessionId: text("session_id"), // For guest users
  addedAt: timestamp("added_at").defaultNow(), // When item was first added
  updatedAt: timestamp("updated_at").defaultNow(), // Last modification time
  expiresAt: timestamp("expires_at"), // For cart cleanup (guest: 7 days, user: 90 days)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Unique constraints to prevent duplicate cart items
  uniqueIndex("unique_user_product_variant_cart").on(
    table.userId,
    table.productId,
    sql`COALESCE(${table.size}, '')`,
    sql`COALESCE(${table.color}, '')`
  ).where(sql`user_id IS NOT NULL`),
  uniqueIndex("unique_session_product_variant_cart").on(
    table.sessionId,
    table.productId,
    sql`COALESCE(${table.size}, '')`,
    sql`COALESCE(${table.color}, '')`
  ).where(sql`session_id IS NOT NULL AND user_id IS NULL`),
  
  // Indexes for efficient cart queries
  index("idx_cart_items_user_id").on(table.userId),
  index("idx_cart_items_session_id").on(table.sessionId),
  index("idx_cart_items_product_id").on(table.productId),
  index("idx_cart_items_variant_id").on(table.variantId),
  index("idx_cart_items_expires_at").on(table.expiresAt), // For cleanup operations
  index("idx_cart_items_updated_at").on(table.updatedAt), // For sync operations
  
  // Composite indexes for common query patterns
  index("idx_cart_user_updated").on(table.userId, table.updatedAt),
  index("idx_cart_session_updated").on(table.sessionId, table.updatedAt),
]);

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, shipped, delivered, cancelled
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  // Razorpay specific fields
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  paymentMethod: text("payment_method"), // razorpay, cod, etc.
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  courierName: text("courier_name"),
  invoiceNumber: text("invoice_number").unique(),
  couponDiscount: decimal("coupon_discount", { precision: 10, scale: 2 }).default("0"),
  giftCardDiscount: decimal("gift_card_discount", { precision: 10, scale: 2 }).default("0"),
  loyaltyPointsRedeemed: integer("loyalty_points_redeemed").default(0),
  referralCode: text("referral_code"),
  estimatedDelivery: timestamp("estimated_delivery"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for efficient admin order queries
  index("idx_orders_status").on(table.status),
  index("idx_orders_payment_status").on(table.paymentStatus),
  index("idx_orders_customer_email").on(table.customerEmail),
  index("idx_orders_customer_name").on(table.customerName),
  index("idx_orders_created_at").on(table.createdAt),
  index("idx_orders_total").on(table.total),
  index("idx_orders_user_id").on(table.userId),
]);

// Order status history for audit trail tracking
export const orderStatusHistory = pgTable("order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  previousStatus: text("previous_status"),
  newStatus: text("new_status").notNull(),
  changedBy: varchar("changed_by").references(() => users.id, { onDelete: "set null" }), // Admin user who made the change
  reason: text("reason"), // Optional reason for status change
  notes: text("notes"), // Additional notes from admin
  isSystemChange: boolean("is_system_change").default(false), // True for automated changes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_order_status_history_order_id").on(table.orderId),
  index("idx_order_status_history_created_at").on(table.createdAt),
  index("idx_order_status_history_changed_by").on(table.changedBy),
  index("idx_order_status_history_status").on(table.newStatus),
]);

// Order items - separate table for better querying
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  variantId: varchar("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(), // Snapshot at time of order
  productPrice: decimal("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  size: text("size"), // Product variant size at time of order
  color: text("color"), // Product variant color at time of order
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
}, (table) => [
  index("idx_order_items_variant_id").on(table.variantId),
]);

// Support tickets
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull(), // Product Inquiry, Technical Support, etc.
  message: text("message").notNull(),
  status: text("status").default("open"), // open, in_progress, resolved, closed
  priority: text("priority").default("normal"), // low, normal, high, urgent
  assignedTo: text("assigned_to"),
  response: text("response"),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email verification tokens (separate table for tracking)
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification tracking
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // email_verification, password_reset, order_status, stock_alert, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional metadata
  read: boolean("read").default(false),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Persistent email queue for production-grade email delivery
export const emailQueue = pgTable("email_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // EmailType enum values
  priority: text("priority").notNull(), // high, normal, low
  status: text("status").notNull().default("pending"), // pending, sending, sent, failed, cancelled
  to: text("to").notNull(),
  from: text("from").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  templateData: jsonb("template_data"), // Template variables and metadata
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  lastError: text("last_error"),
  messageId: text("message_id"), // SendGrid message ID for tracking
  deliveryStatus: text("delivery_status"), // sent, delivered, opened, clicked, bounced, dropped
  scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_email_queue_status").on(table.status),
  index("idx_email_queue_priority").on(table.priority),
  index("idx_email_queue_scheduled").on(table.scheduledAt),
  index("idx_email_queue_type").on(table.type),
  index("idx_email_queue_user_id").on(table.userId),
  index("idx_email_queue_message_id").on(table.messageId),
]);

// Email preferences and unsubscribe management
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(), // For guest users who don't have userId
  unsubscribeToken: text("unsubscribe_token").unique().notNull(),
  marketingEmails: boolean("marketing_emails").default(true),
  orderUpdates: boolean("order_updates").default(true),
  promotionalOffers: boolean("promotional_offers").default(true),
  newsletterSubscription: boolean("newsletter_subscription").default(true),
  stockAlerts: boolean("stock_alerts").default(true),
  accountNotifications: boolean("account_notifications").default(true),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_email_preferences_user_id").on(table.userId),
  index("idx_email_preferences_email").on(table.email),
  index("idx_email_preferences_token").on(table.unsubscribeToken),
]);

// Rate limiting tracking for email sending
export const emailRateLimits = pgTable("email_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // email address or user ID
  window: timestamp("window").notNull(), // Time window start (minute or hour)
  windowType: text("window_type").notNull(), // 'minute' or 'hour'
  priority: text("priority").notNull(), // high, normal, low
  count: integer("count").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_rate_limits_identifier").on(table.identifier),
  index("idx_email_rate_limits_window").on(table.window),
  index("idx_email_rate_limits_priority").on(table.priority),
  // Unique constraint for upsert operations
  unique("email_rate_limits_unique").on(table.identifier, table.priority, table.windowType, table.window),
]);

// =============================================================================
// SMS NOTIFICATION SYSTEM TABLES
// =============================================================================

// SMS queue for reliable SMS delivery with Twilio
export const smsQueue = pgTable("sms_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // order_confirmation, order_status, payment_confirmation, shipping_notification, etc.
  priority: text("priority").notNull(), // high, normal, low
  status: text("status").notNull().default("pending"), // pending, sending, sent, failed, cancelled
  to: text("to").notNull(), // Phone number
  from: text("from").notNull(), // Twilio phone number
  recipientName: text("recipient_name"),
  message: text("message").notNull(),
  templateData: jsonb("template_data"), // Template variables and metadata
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  lastError: text("last_error"),
  twilioSid: text("twilio_sid"), // Twilio message SID for tracking
  deliveryStatus: text("delivery_status"), // sent, delivered, failed, undelivered
  errorCode: text("error_code"), // Twilio error codes
  scheduledAt: timestamp("scheduled_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sms_queue_status").on(table.status),
  index("idx_sms_queue_priority").on(table.priority),
  index("idx_sms_queue_scheduled").on(table.scheduledAt),
  index("idx_sms_queue_type").on(table.type),
  index("idx_sms_queue_user_id").on(table.userId),
  index("idx_sms_queue_twilio_sid").on(table.twilioSid),
  index("idx_sms_queue_phone").on(table.to),
]);

// SMS preferences and opt-out management
export const smsPreferences = pgTable("sms_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(), // For guest users who don't have userId
  optInToken: text("opt_in_token").unique().notNull(),
  isOptedIn: boolean("is_opted_in").default(false),
  orderUpdates: boolean("order_updates").default(true),
  shippingNotifications: boolean("shipping_notifications").default(true),
  paymentConfirmations: boolean("payment_confirmations").default(true),
  promotionalOffers: boolean("promotional_offers").default(false),
  stockAlerts: boolean("stock_alerts").default(false),
  accountNotifications: boolean("account_notifications").default(true),
  optedInAt: timestamp("opted_in_at"),
  optedOutAt: timestamp("opted_out_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sms_preferences_user_id").on(table.userId),
  index("idx_sms_preferences_phone").on(table.phoneNumber),
  index("idx_sms_preferences_token").on(table.optInToken),
  index("idx_sms_preferences_opted_in").on(table.isOptedIn),
]);

// Rate limiting tracking for SMS sending
export const smsRateLimits = pgTable("sms_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // phone number or user ID
  window: timestamp("window").notNull(), // Time window start (minute or hour)
  windowType: text("window_type").notNull(), // 'minute' or 'hour'
  priority: text("priority").notNull(), // high, normal, low
  count: integer("count").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sms_rate_limits_identifier").on(table.identifier),
  index("idx_sms_rate_limits_window").on(table.window),
  index("idx_sms_rate_limits_priority").on(table.priority),
]);

// SMS delivery logs for detailed tracking and analytics
export const smsDeliveryLogs = pgTable("sms_delivery_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  smsQueueId: varchar("sms_queue_id").references(() => smsQueue.id, { onDelete: "cascade" }),
  twilioSid: text("twilio_sid").notNull(),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull(), // queued, sending, sent, delivered, failed, undelivered
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  price: decimal("price", { precision: 10, scale: 4 }), // SMS cost
  priceUnit: text("price_unit").default("USD"),
  direction: text("direction").default("outbound"),
  numSegments: integer("num_segments").default(1),
  numMedia: integer("num_media").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sms_delivery_logs_queue_id").on(table.smsQueueId),
  index("idx_sms_delivery_logs_twilio_sid").on(table.twilioSid),
  index("idx_sms_delivery_logs_phone").on(table.phoneNumber),
  index("idx_sms_delivery_logs_status").on(table.status),
]);

// =============================================================================
// WHATSAPP NOTIFICATION SYSTEM
// =============================================================================

// WhatsApp message queue for reliable delivery - similar to SMS queue
export const whatsappQueue = pgTable("whatsapp_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // order_confirmation, order_status, payment_confirmation, shipping_notification, etc.
  priority: text("priority").notNull().default("normal"), // high, normal, low
  status: text("status").notNull().default("pending"), // pending, sending, sent, delivered, failed, cancelled
  to: text("to").notNull(), // WhatsApp phone number in E.164 format
  from: text("from").notNull(), // Business WhatsApp number
  message: text("message").notNull(),
  mediaUrl: text("media_url"), // Optional media attachment URL
  mediaType: text("media_type"), // image, document, video, audio
  templateName: text("template_name"), // WhatsApp approved template name
  templateData: jsonb("template_data"), // Template variables
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  scheduledAt: timestamp("scheduled_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  lastError: text("last_error"),
  twilioSid: text("twilio_sid"), // Twilio message SID for tracking
  conversationId: text("conversation_id"), // WhatsApp conversation ID
  metadata: jsonb("metadata"), // Additional message metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_whatsapp_queue_status").on(table.status),
  index("idx_whatsapp_queue_priority").on(table.priority),
  index("idx_whatsapp_queue_scheduled").on(table.scheduledAt),
  index("idx_whatsapp_queue_type").on(table.type),
  index("idx_whatsapp_queue_user_id").on(table.userId),
  index("idx_whatsapp_queue_twilio_sid").on(table.twilioSid),
  index("idx_whatsapp_queue_phone").on(table.to),
  index("idx_whatsapp_queue_conversation").on(table.conversationId),
]);

// WhatsApp opt-in preferences and consent management
export const whatsappPreferences = pgTable("whatsapp_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(), // WhatsApp phone number in E.164 format
  isOptedIn: boolean("is_opted_in").default(false),
  orderConfirmation: boolean("order_confirmation").default(true),
  orderUpdates: boolean("order_updates").default(true),
  shippingNotifications: boolean("shipping_notifications").default(true),
  paymentConfirmations: boolean("payment_confirmations").default(true),
  deliveryNotifications: boolean("delivery_notifications").default(true),
  stockAlerts: boolean("stock_alerts").default(false),
  promotionalMessages: boolean("promotional_messages").default(false),
  accountNotifications: boolean("account_notifications").default(true),
  optInToken: text("opt_in_token").unique(), // For opt-in verification
  optInDate: timestamp("opt_in_date"),
  optOutDate: timestamp("opt_out_date"),
  optInMethod: text("opt_in_method"), // website, sms, whatsapp, manual
  optOutMethod: text("opt_out_method"), // website, sms, whatsapp, manual
  consentSource: text("consent_source"), // Where consent was obtained
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_whatsapp_preferences_user_id").on(table.userId),
  index("idx_whatsapp_preferences_phone").on(table.phoneNumber),
  index("idx_whatsapp_preferences_token").on(table.optInToken),
  index("idx_whatsapp_preferences_opted_in").on(table.isOptedIn),
  index("idx_whatsapp_preferences_phone_opted_in").on(table.phoneNumber, table.isOptedIn),
]);

// Rate limiting tracking for WhatsApp messaging
export const whatsappRateLimits = pgTable("whatsapp_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // phone number or user ID
  priority: text("priority").notNull(), // high, normal, low
  window: text("window").notNull(), // minute, hour, day
  count: integer("count").default(1),
  windowStart: timestamp("window_start").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_whatsapp_rate_limits_identifier").on(table.identifier),
  index("idx_whatsapp_rate_limits_window").on(table.window),
  index("idx_whatsapp_rate_limits_priority").on(table.priority),
  index("idx_whatsapp_rate_limits_window_start").on(table.windowStart),
]);

// WhatsApp delivery logs for detailed tracking and analytics
export const whatsappDeliveryLogs = pgTable("whatsapp_delivery_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whatsappQueueId: varchar("whatsapp_queue_id").references(() => whatsappQueue.id, { onDelete: "cascade" }),
  twilioSid: text("twilio_sid").notNull(),
  phoneNumber: text("phone_number").notNull(),
  status: text("status").notNull(), // queued, sending, sent, delivered, read, failed, undelivered
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  price: decimal("price", { precision: 10, scale: 4 }), // Message cost
  priceUnit: text("price_unit").default("USD"),
  direction: text("direction").default("outbound"),
  conversationId: text("conversation_id"),
  conversationType: text("conversation_type"), // user_initiated, business_initiated
  messagingProduct: text("messaging_product").default("whatsapp"),
  numMedia: integer("num_media").default(0),
  mediaType: text("media_type"), // image, document, video, audio
  templateName: text("template_name"), // If template message
  webhookData: jsonb("webhook_data"), // Raw webhook data for debugging
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_whatsapp_delivery_logs_queue_id").on(table.whatsappQueueId),
  index("idx_whatsapp_delivery_logs_twilio_sid").on(table.twilioSid),
  index("idx_whatsapp_delivery_logs_phone").on(table.phoneNumber),
  index("idx_whatsapp_delivery_logs_status").on(table.status),
  index("idx_whatsapp_delivery_logs_conversation").on(table.conversationId),
  index("idx_whatsapp_delivery_logs_template").on(table.templateName),
]);

// Site settings - singleton row for branding & appearance
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  // Branding
  storeName: text("store_name").default("Bmaafashion"),
  storeTagline: text("store_tagline"),
  logoUrl: text("logo_url"),
  fontFamily: text("font_family").notNull().default("Poppins"),
  fontColor: text("font_color").notNull().default("#1a1a1a"),
  backgroundColor: text("background_color").notNull().default("#ffffff"),
  // Homepage
  heroImage1Url: text("hero_image_1_url"),
  heroImage2Url: text("hero_image_2_url"),
  heroImage3Url: text("hero_image_3_url"),
  heroImage1Duration: integer("hero_image_1_duration"),
  heroImage2Duration: integer("hero_image_2_duration"),
  heroImage3Duration: integer("hero_image_3_duration"),
  heroSlideDuration: integer("hero_slide_duration").notNull().default(5),
  announcementBar: jsonb("announcement_bar").$type<{
    text?: string; active?: boolean; bgColor?: string; textColor?: string;
  }>(),
  featuredCategories: jsonb("featured_categories").$type<string[]>(),
  customBanners: jsonb("custom_banners").$type<Array<{
    id: string; imageUrl?: string; title?: string; subtitle?: string; buttonText?: string; buttonLink?: string;
  }>>(),
  // Policies
  policies: jsonb("policies").$type<{
    shipping?: { freeThreshold?: number; shippingCost?: number; deliveryDays?: string; text?: string; };
    returns?: { windowDays?: number; text?: string; };
    gst?: { rate?: number; text?: string; };
  }>(),
  // Contact & Social
  contactInfo: jsonb("contact_info").$type<{
    phone?: string; email?: string; address?: string; whatsapp?: string; businessHours?: string;
  }>(),
  socialLinks: jsonb("social_links").$type<{
    facebook?: string; instagram?: string; twitter?: string; youtube?: string; linkedin?: string;
  }>(),
  // SEO
  seoSettings: jsonb("seo_settings").$type<{
    home?: { title?: string; description?: string; };
    products?: { title?: string; description?: string; };
    freshProduce?: { title?: string; description?: string; };
    about?: { title?: string; description?: string; };
    contact?: { title?: string; description?: string; };
    services?: { title?: string; description?: string; };
  }>(),
  // Promotions
  promotions: jsonb("promotions").$type<Array<{
    id: string; message: string; code?: string; discountType?: "percentage" | "fixed"; discountValue?: number; expiry?: string; active: boolean; bgColor?: string; textColor?: string;
  }>>(),
  // Footer
  footerSettings: jsonb("footer_settings").$type<{
    copyright?: string;
    links?: Array<{ label: string; url: string; }>;
    newsletterEnabled?: boolean;
    showSocialLinks?: boolean;
  }>(),
  // Page Banners (inner page hero sections)
  pageBanners: jsonb("page_banners").$type<{
    about?: { imageUrl?: string; title?: string; subtitle?: string; };
    contact?: { imageUrl?: string; title?: string; subtitle?: string; };
    services?: { imageUrl?: string; title?: string; subtitle?: string; };
    products?: { imageUrl?: string; title?: string; subtitle?: string; };
    freshProduce?: { imageUrl?: string; title?: string; subtitle?: string; };
  }>(),
  // Maintenance Mode
  maintenanceMode: jsonb("maintenance_mode").$type<{
    enabled?: boolean; title?: string; message?: string;
  }>(),
  // WhatsApp Widget
  whatsappWidget: jsonb("whatsapp_widget").$type<{
    enabled?: boolean; phone?: string;
  }>(),
  // Homepage Section Visibility
  homepageSections: jsonb("homepage_sections").$type<{
    showStats?: boolean; showWhyChoose?: boolean; showTestimonials?: boolean;
    showFeaturedProducts?: boolean; showBenefits?: boolean;
  }>(),
  // Popup / Modal
  popupSettings: jsonb("popup_settings").$type<{
    enabled?: boolean; title?: string; message?: string;
    buttonText?: string; delay?: number; couponCode?: string;
  }>(),
  // Countdown Timer
  countdownTimer: jsonb("countdown_timer").$type<{
    enabled?: boolean; endsAt?: string; message?: string; bgColor?: string; textColor?: string;
  }>(),
  // Trust Badges
  trustBadges: jsonb("trust_badges").$type<Array<{
    id: string; label: string; icon: string; active: boolean;
  }>>(),
  // Product Display Settings
  productSettings: jsonb("product_settings").$type<{
    perPage?: number; defaultSort?: string; newBadgeDays?: number; lowStockThreshold?: number;
  }>(),
  // Order Settings
  orderSettings: jsonb("order_settings").$type<{
    codEnabled?: boolean; autoCancelHours?: number; deliveryMessage?: string;
  }>(),
  // Tracking
  trackingSettings: jsonb("tracking_settings").$type<{
    googleAnalyticsId?: string; facebookPixelId?: string;
  }>(),
  // Cookie Consent
  cookieConsent: jsonb("cookie_consent").$type<{
    enabled?: boolean; message?: string; acceptText?: string; declineText?: string;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User preferences for profile management
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  emailNotifications: jsonb("email_notifications").$type<{ orderUpdates?: boolean; promotions?: boolean; stockAlerts?: boolean; newsletter?: boolean; }>().default({
    orderUpdates: true,
    promotions: true,
    stockAlerts: false,
    newsletter: false,
  }),
  smsNotifications: jsonb("sms_notifications").$type<{ enabled?: boolean; orderConfirmation?: boolean; orderUpdates?: boolean; paymentConfirmation?: boolean; paymentConfirmations?: boolean; shippingUpdates?: boolean; shippingNotifications?: boolean; deliveryNotifications?: boolean; promotional?: boolean; promotionalOffers?: boolean; stockAlerts?: boolean; accountNotifications?: boolean; }>().default({
    orderUpdates: true,
    shippingNotifications: true,
    paymentConfirmations: true,
    promotionalOffers: false,
    stockAlerts: false,
    accountNotifications: true,
  }),
  whatsappNotifications: jsonb("whatsapp_notifications").$type<{ isOptedIn?: boolean; orderConfirmation?: boolean; orderUpdates?: boolean; shippingNotifications?: boolean; paymentConfirmations?: boolean; deliveryNotifications?: boolean; stockAlerts?: boolean; promotionalMessages?: boolean; accountNotifications?: boolean; }>().default({
    orderConfirmation: true,
    orderUpdates: true,
    shippingNotifications: true,
    paymentConfirmations: true,
    deliveryNotifications: true,
    stockAlerts: false,
    promotionalMessages: false,
    accountNotifications: true,
  }),
  privacySettings: jsonb("privacy_settings").$type<{ profileVisibility?: string; showOrderHistory?: boolean; shareActivityData?: boolean; }>().default({
    profileVisibility: "private",
    showOrderHistory: false,
    shareActivityData: false,
  }),
  displayPreferences: jsonb("display_preferences").default({
    theme: "system",
    language: "en",
    currency: "INR",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_preferences_user_id").on(table.userId),
]);

// Type definitions and schemas
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type UserAddress = typeof userAddresses.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InventoryHistory = typeof inventoryHistory.$inferSelect;
export type StockAlert = typeof stockAlerts.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type EmailQueue = typeof emailQueue.$inferSelect;
export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type EmailRateLimits = typeof emailRateLimits.$inferSelect;
export type SmsQueue = typeof smsQueue.$inferSelect;
export type SmsPreferences = typeof smsPreferences.$inferSelect;
export type SmsRateLimits = typeof smsRateLimits.$inferSelect;
export type SmsDeliveryLogs = typeof smsDeliveryLogs.$inferSelect;
export type WhatsappQueue = typeof whatsappQueue.$inferSelect;
export type WhatsappPreferences = typeof whatsappPreferences.$inferSelect;
export type WhatsappRateLimits = typeof whatsappRateLimits.$inferSelect;
export type WhatsappDeliveryLogs = typeof whatsappDeliveryLogs.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  images: z.array(z.string().min(1, "Image URL cannot be empty")).optional(),
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  images: z.array(z.string().min(1, "Image URL cannot be empty")).optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({
  id: true,
  createdAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulVotes: true,
}).extend({
  title: z.string().max(200, "Title must be 200 characters or less").optional(),
  review: z.string().max(2000, "Review must be 2000 characters or less").optional(),
});

export const insertReviewHelpfulVoteSchema = createInsertSchema(reviewHelpfulVotes).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntries).omit({
  id: true, createdAt: true, notifiedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryHistorySchema = createInsertSchema(inventoryHistory).omit({
  id: true,
  createdAt: true,
});

export const insertStockAlertSchema = createInsertSchema(stockAlerts).omit({
  id: true,
  notifiedAt: true,
  resolvedAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailQueueSchema = createInsertSchema(emailQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailRateLimitsSchema = createInsertSchema(emailRateLimits).omit({
  id: true,
  createdAt: true,
});

// SMS insert schemas
export const insertSmsQueueSchema = createInsertSchema(smsQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsPreferencesSchema = createInsertSchema(smsPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsRateLimitsSchema = createInsertSchema(smsRateLimits).omit({
  id: true,
  createdAt: true,
});

export const insertSmsDeliveryLogsSchema = createInsertSchema(smsDeliveryLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// WhatsApp insert schemas
export const insertWhatsappQueueSchema = createInsertSchema(whatsappQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappPreferencesSchema = createInsertSchema(whatsappPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappRateLimitsSchema = createInsertSchema(whatsappRateLimits).omit({
  id: true,
  createdAt: true,
});

export const insertWhatsappDeliveryLogsSchema = createInsertSchema(whatsappDeliveryLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = insertUserSchema.partial().extend({
  id: z.string().optional(), // Include id for upsert operations
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().optional(),
});

// Enhanced profile management schemas
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
    .regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter")
    .regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const profileImageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      "Only JPEG, PNG, and WebP images are allowed"
    ),
});

export const updateUserPreferencesSchema = z.object({
  emailNotifications: z.object({
    orderUpdates: z.boolean().default(true),
    promotions: z.boolean().default(true),
    stockAlerts: z.boolean().default(false),
    newsletter: z.boolean().default(false),
  }).optional(),
  smsNotifications: z.object({
    orderUpdates: z.boolean().default(true),
    shippingNotifications: z.boolean().default(true),
    paymentConfirmations: z.boolean().default(true),
    promotionalOffers: z.boolean().default(false),
    stockAlerts: z.boolean().default(false),
    accountNotifications: z.boolean().default(true),
  }).optional(),
  whatsappNotifications: z.object({
    orderConfirmation: z.boolean().default(true),
    orderUpdates: z.boolean().default(true),
    shippingNotifications: z.boolean().default(true),
    paymentConfirmations: z.boolean().default(true),
    deliveryNotifications: z.boolean().default(true),
    stockAlerts: z.boolean().default(false),
    promotionalMessages: z.boolean().default(false),
    accountNotifications: z.boolean().default(true),
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(["public", "private"]).default("private"),
    showOrderHistory: z.boolean().default(false),
    shareActivityData: z.boolean().default(false),
  }).optional(),
  displayPreferences: z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    language: z.enum(["en", "hi"]).default("en"),
    currency: z.enum(["INR", "USD"]).default("INR"),
  }).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to delete account"),
  confirmDeletion: z.literal("DELETE", {
    errorMap: () => ({ message: "Please type 'DELETE' to confirm account deletion" }),
  }),
});

// Phone number validation schema with international support
export const phoneNumberValidationSchema = z.object({
  phoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .transform((val) => {
      // Remove all non-digit characters except +
      const cleaned = val.replace(/[^\d+]/g, '');
      // Ensure it starts with + for international format
      return cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
    }),
});

// SMS opt-in/opt-out schemas
export const smsOptInSchema = z.object({
  phoneNumber: phoneNumberValidationSchema.shape.phoneNumber,
  userId: z.string().uuid().optional(),
});

export const smsOptOutSchema = z.object({
  phoneNumber: z.string(),
  optInToken: z.string(),
});

export const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// Inventory Management API Schemas
export const adjustStockSchema = z.object({
  productId: z.string().uuid("Valid product ID is required"),
  adjustment: z.number().int("Adjustment must be an integer"),
  reason: z.string().min(1, "Reason is required"),
  reference: z.string().optional(),
});

export const bulkUpdateStockSchema = z.object({
  updates: z.array(z.object({
    productId: z.string().uuid("Valid product ID is required"),
    newStock: z.number().int().min(0, "Stock cannot be negative"),
    reason: z.string().optional(),
  })).min(1, "At least one update is required"),
});

export const updateProductInventorySchema = z.object({
  inStock: z.number().int().min(0, "Stock cannot be negative").optional(),
  lowStockThreshold: z.number().int().min(0, "Threshold cannot be negative").optional(),
  reorderPoint: z.number().int().min(0, "Reorder point cannot be negative").optional(),
  maxStock: z.number().int().min(1, "Max stock must be positive").optional(),
  sku: z.string().optional(),
  supplier: z.string().optional(),
  costPrice: z.string().optional(),
});

// ==============================================================================
// ADMIN INVENTORY OVERSIGHT SCHEMAS (Task 15g)
// ==============================================================================

// Enhanced bulk adjustment schema with more options
export const adminBulkAdjustmentSchema = z.object({
  adjustments: z.array(z.object({
    productId: z.string().uuid("Valid product ID is required"),
    adjustmentType: z.enum(['restock', 'adjustment', 'damage', 'return', 'correction']),
    quantity: z.number().int("Quantity must be an integer"),
    reason: z.string().min(1, "Reason is required"),
    notes: z.string().optional(),
    reference: z.string().optional(),
  })).min(1, "At least one adjustment is required"),
  operationDescription: z.string().min(1, "Operation description is required"),
  bulkOperationType: z.enum(['manual_bulk', 'csv_upload']).default('manual_bulk'),
});

// Inventory overview query schema
export const inventoryOverviewQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  stockStatus: z.enum(['all', 'in-stock', 'low-stock', 'out-of-stock']).default('all'),
  sortBy: z.enum(['name', 'inStock', 'lowStockThreshold', 'category', 'costPrice', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeValue: z.coerce.boolean().default(true),
});

// Low stock alerts query schema  
export const lowStockAlertsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  urgency: z.enum(['all', 'critical', 'high', 'medium']).default('all'),
  category: z.string().optional(),
  alertType: z.enum(['all', 'out_of_stock', 'low_stock', 'reorder_point']).default('all'),
  sortBy: z.enum(['urgency', 'currentStock', 'threshold', 'productName']).default('urgency'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  includeResolved: z.coerce.boolean().default(false),
});

// Inventory audit trail query schema
export const inventoryAuditQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  productId: z.string().optional(),
  adminUserId: z.string().optional(),
  changeType: z.enum(['all', 'stock_in', 'stock_out', 'adjustment', 'order', 'restock', 'bulk_adjustment', 'damage', 'return']).default('all'),
  adjustmentType: z.enum(['all', 'restock', 'adjustment', 'damage', 'return', 'correction']).default('all'),
  bulkOperationId: z.string().optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  search: z.string().optional(), // Search in reason, notes, reference
  sortBy: z.enum(['createdAt', 'productName', 'changeType', 'quantityChanged']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeSystemChanges: z.coerce.boolean().default(true),
});

// CSV upload validation schema
export const csvUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  operationDescription: z.string().min(1, "Operation description is required"),
});

// Inventory export schema
export const inventoryExportSchema = z.object({
  format: z.enum(['csv', 'xlsx']).default('csv'),
  type: z.enum(['overview', 'audit_trail', 'low_stock_alerts']),
  filters: z.record(z.any()).optional(),
  includeMetadata: z.coerce.boolean().default(true),
  fields: z.array(z.string()).optional(),
  stockLevel: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock', 'reorder_point']).optional(),
  categories: z.array(z.string()).optional(),
  suppliers: z.array(z.string()).optional(),
  includePerformanceMetrics: z.boolean().optional(),
  fileName: z.string().optional(),
});

// Response schemas for admin inventory endpoints
export const inventoryOverviewResponseSchema = z.object({
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sku: z.string().nullable(),
    category: z.string(),
    inStock: z.number(),
    reserved: z.number().default(0), // Stock reserved for pending orders
    available: z.number(), // inStock - reserved
    lowStockThreshold: z.number(),
    reorderPoint: z.number(),
    maxStock: z.number(),
    costPrice: z.number().nullable(),
    totalValue: z.number().nullable(), // inStock * costPrice
    status: z.enum(['in-stock', 'low-stock', 'out-of-stock']),
    lastRestockDate: z.string().nullable(),
    supplier: z.string().nullable(),
    updatedAt: z.string(),
  })),
  summary: z.object({
    totalProducts: z.number(),
    inStockCount: z.number(),
    lowStockCount: z.number(),
    outOfStockCount: z.number(),
    totalInventoryValue: z.number(),
    totalUnits: z.number(),
    averageStockLevel: z.number(),
    criticalAlerts: z.number(),
  }),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const lowStockAlertsResponseSchema = z.object({
  alerts: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    productName: z.string(),
    sku: z.string().nullable(),
    category: z.string(),
    currentStock: z.number(),
    threshold: z.number(),
    alertType: z.string(),
    urgency: z.enum(['critical', 'high', 'medium', 'low']),
    daysUntilStockout: z.number().nullable(),
    supplier: z.string().nullable(),
    lastRestockDate: z.string().nullable(),
    avgDailyUsage: z.number().nullable(),
    status: z.string(),
    notifiedAt: z.string(),
    resolvedAt: z.string().nullable(),
  })),
  summary: z.object({
    totalAlerts: z.number(),
    criticalAlerts: z.number(),
    highAlerts: z.number(),
    mediumAlerts: z.number(),
    resolvedToday: z.number(),
    estimatedStockoutValue: z.number(),
  }),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const inventoryAuditResponseSchema = z.object({
  history: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    productName: z.string(),
    changeType: z.string(),
    adjustmentType: z.string().nullable(),
    quantityBefore: z.number(),
    quantityChanged: z.number(),
    quantityAfter: z.number(),
    reason: z.string().nullable(),
    notes: z.string().nullable(),
    reference: z.string().nullable(),
    userId: z.string().nullable(),
    adminUserName: z.string().nullable(),
    bulkOperationId: z.string().nullable(),
    bulkOperationDescription: z.string().nullable(),
    isSystemChange: z.boolean(),
    metadata: z.record(z.any()).nullable(),
    createdAt: z.string(),
  })),
  summary: z.object({
    totalChanges: z.number(),
    totalAdjustments: z.number(),
    totalBulkOperations: z.number(),
    netStockChange: z.number(),
    mostActiveAdmin: z.object({
      userId: z.string(),
      name: z.string(),
      changeCount: z.number(),
    }).nullable(),
  }),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const bulkOperationStatusSchema = z.object({
  id: z.string(),
  operationType: z.string(),
  description: z.string(),
  adminUserId: z.string(),
  adminUserName: z.string(),
  totalItems: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  status: z.string(),
  fileName: z.string().nullable(),
  errorLog: z.string().nullable(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  progress: z.number(), // Percentage (0-100)
  estimatedTimeRemaining: z.number().nullable(), // Seconds
});

// Guest checkout validation schemas
export const guestEmailValidationSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const guestAddressSchema = z.object({
  title: z.string().min(1, "Address title is required"),
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters"),
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country is required").default("India"),
  phoneNumber: z.string().optional(),
});

// Secure guest checkout schema - monetary fields calculated server-side
export const guestCheckoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  shippingAddress: guestAddressSchema,
  billingAddress: guestAddressSchema.optional(),
  useSameAddress: z.boolean().default(true),
  orderNotes: z.string().optional(),
  promoCode: z.string().trim().max(50).optional(),
  giftCardCode: z.string().trim().max(64).optional(),
  loyaltyPointsRedeemed: z.number().int().min(0).optional(),
  paymentMethod: z.enum(['razorpay', 'cod']).default('razorpay'),
  items: z.array(z.object({
    productId: z.string().uuid("Valid product ID is required"),
    variantId: z.string().uuid("Valid variant ID is required").nullable().optional(),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    size: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    // productName, productPrice, totalPrice calculated server-side for security
  })).min(1, "At least one item is required"),
  // subtotal, shippingCost, taxAmount, total calculated server-side for security
});

export const guestOrderLookupSchema = z.object({
  orderId: z.string().uuid("Valid order ID is required"),
  email: z.string().email("Valid email is required"),
});

export const createAccountFromGuestSchema = z.object({
  orderId: z.string().uuid("Valid order ID is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Inferred types
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type InsertReviewHelpfulVote = z.infer<typeof insertReviewHelpfulVoteSchema>;
export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type InsertInventoryHistory = z.infer<typeof insertInventoryHistorySchema>;
export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type RegisterUser = z.infer<typeof registerSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type AdjustStock = z.infer<typeof adjustStockSchema>;
export type BulkUpdateStock = z.infer<typeof bulkUpdateStockSchema>;
export type UpdateProductInventory = z.infer<typeof updateProductInventorySchema>;

// Task 15g Admin Inventory Oversight types
export type AdminBulkAdjustment = z.infer<typeof adminBulkAdjustmentSchema>;
export type InventoryOverviewQuery = z.infer<typeof inventoryOverviewQuerySchema>;
export type LowStockAlertsQuery = z.infer<typeof lowStockAlertsQuerySchema>;
export type InventoryAuditQuery = z.infer<typeof inventoryAuditQuerySchema>;
export type CsvUpload = z.infer<typeof csvUploadSchema>;
export type InventoryExport = z.infer<typeof inventoryExportSchema>;
export type InventoryOverviewResponse = z.infer<typeof inventoryOverviewResponseSchema>;
export type LowStockAlertsResponse = z.infer<typeof lowStockAlertsResponseSchema>;
export type InventoryAuditResponse = z.infer<typeof inventoryAuditResponseSchema>;
export type BulkOperationStatus = z.infer<typeof bulkOperationStatusSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertEmailQueue = z.infer<typeof insertEmailQueueSchema>;
export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type InsertEmailRateLimits = z.infer<typeof insertEmailRateLimitsSchema>;
export type InsertSmsQueue = z.infer<typeof insertSmsQueueSchema>;
export type InsertSmsPreferences = z.infer<typeof insertSmsPreferencesSchema>;
export type InsertSmsRateLimits = z.infer<typeof insertSmsRateLimitsSchema>;
export type InsertSmsDeliveryLogs = z.infer<typeof insertSmsDeliveryLogsSchema>;
export type InsertWhatsappQueue = z.infer<typeof insertWhatsappQueueSchema>;
export type InsertWhatsappPreferences = z.infer<typeof insertWhatsappPreferencesSchema>;
export type InsertWhatsappRateLimits = z.infer<typeof insertWhatsappRateLimitsSchema>;
export type InsertWhatsappDeliveryLogs = z.infer<typeof insertWhatsappDeliveryLogsSchema>;

// Enhanced profile management types
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type ProfileImageUpload = z.infer<typeof profileImageUploadSchema>;
export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
export type DeleteAccount = z.infer<typeof deleteAccountSchema>;

// Guest checkout types
export type GuestEmailValidation = z.infer<typeof guestEmailValidationSchema>;
export type GuestAddress = z.infer<typeof guestAddressSchema>;
export type GuestCheckout = z.infer<typeof guestCheckoutSchema>;
export type CreateAccountFromGuest = z.infer<typeof createAccountFromGuestSchema>;

// =============================================================================
// ADMIN METRICS SYSTEM - Business Analytics & Reporting
// =============================================================================

// Core metrics data types
export const timeSeriesPointSchema = z.object({
  date: z.string(), // ISO date string
  value: z.number(),
  label: z.string().optional(),
});

export const topEntitySchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  percentage: z.number().optional(),
  trend: z.number().optional(), // Growth percentage
  metadata: z.record(z.any()).optional(), // Additional context data
});

export const metricsSummarySchema = z.object({
  current: z.number(),
  previous: z.number(),
  change: z.number(), // Absolute change
  changePercent: z.number(), // Percentage change
  trend: z.enum(['up', 'down', 'stable']),
});

// Admin Overview Metrics Response
export const adminOverviewMetricsSchema = z.object({
  // Revenue metrics
  grossMerchandiseValue: metricsSummarySchema,
  totalRevenue: metricsSummarySchema,
  averageOrderValue: metricsSummarySchema,
  
  // Order metrics
  totalOrders: metricsSummarySchema,
  pendingOrders: z.number(),
  completedOrders: z.number(),
  cancelledOrders: z.number(),
  
  // Customer metrics
  totalCustomers: metricsSummarySchema,
  newCustomers: metricsSummarySchema,
  returningCustomers: metricsSummarySchema,
  customerRetentionRate: z.number(),
  
  // Product & Inventory metrics
  totalProducts: z.number(),
  lowStockProducts: z.number(),
  outOfStockProducts: z.number(),
  topSellingCategory: z.string(),
  
  // Performance indicators
  conversionRate: z.number().optional(),
  refundRate: z.number(),
  averageFulfillmentTime: z.number(), // in hours
  
  // Metadata
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
  lastUpdated: z.string(),
});

// Revenue Analytics Response
export const revenueAnalyticsSchema = z.object({
  timeSeries: z.array(timeSeriesPointSchema),
  revenueByCategory: z.array(topEntitySchema),
  revenueBreakdown: z.object({
    totalRevenue: z.number(),
    productRevenue: z.number(),
    shippingRevenue: z.number(),
    taxRevenue: z.number(),
  }),
  trends: z.object({
    dailyGrowth: z.number(),
    weeklyGrowth: z.number(),
    monthlyGrowth: z.number(),
  }),
  projections: z.object({
    nextMonth: z.number(),
    nextQuarter: z.number(),
  }).optional(),
  previousPeriod: z.object({
    timeSeries: z.array(timeSeriesPointSchema),
    revenueBreakdown: z.object({
      totalRevenue: z.number(),
      productRevenue: z.number(),
      shippingRevenue: z.number(),
      taxRevenue: z.number(),
    }),
    trends: z.object({
      dailyGrowth: z.number(),
      weeklyGrowth: z.number(),
      monthlyGrowth: z.number(),
    }),
  }).optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

// Order Analytics Response
export const orderAnalyticsSchema = z.object({
  timeSeries: z.array(timeSeriesPointSchema),
  ordersByStatus: z.array(z.object({
    status: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
  orderValueDistribution: z.array(z.object({
    range: z.string(), // e.g., "0-500", "500-1000"
    count: z.number(),
    percentage: z.number(),
  })),
  peakHours: z.array(z.object({
    hour: z.number(), // 0-23
    count: z.number(),
  })),
  trends: z.object({
    orderGrowth: z.number(),
    averageOrderValue: z.number(),
    conversionRate: z.number(),
  }),
  previousPeriod: z.object({
    timeSeries: z.array(timeSeriesPointSchema),
    ordersByStatus: z.array(z.object({
      status: z.string(),
      count: z.number(),
      percentage: z.number(),
    })),
    trends: z.object({
      orderGrowth: z.number(),
      averageOrderValue: z.number(),
      conversionRate: z.number(),
    }),
  }).optional(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

// Customer Analytics Response
export const customerAnalyticsSchema = z.object({
  customerAcquisition: z.array(timeSeriesPointSchema),
  customerSegments: z.array(z.object({
    segment: z.string(), // new, returning, vip
    count: z.number(),
    percentage: z.number(),
    averageOrderValue: z.number(),
  })),
  topCustomers: z.array(z.object({
    customerId: z.string(),
    customerName: z.string(),
    totalOrders: z.number(),
    totalSpent: z.number(),
    averageOrderValue: z.number(),
    lastOrderDate: z.string(),
  })),
  customerLifetimeValue: z.object({
    average: z.number(),
    median: z.number(),
    percentiles: z.object({
      p25: z.number(),
      p75: z.number(),
      p90: z.number(),
    }),
  }),
  geographicDistribution: z.array(z.object({
    state: z.string(),
    customerCount: z.number(),
    percentage: z.number(),
    totalRevenue: z.number(),
  })),
  retentionMetrics: z.object({
    monthlyRetentionRate: z.number(),
    averageCustomerLifespan: z.number(), // in months
    churnRate: z.number(),
  }),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

// Top Products Response
export const topProductsSchema = z.object({
  topByRevenue: z.array(topEntitySchema),
  topByUnits: z.array(topEntitySchema),
  topByMargin: z.array(topEntitySchema),
  categoryPerformance: z.array(z.object({
    category: z.string(),
    revenue: z.number(),
    unitsSold: z.number(),
    averagePrice: z.number(),
    margin: z.number(),
    growthRate: z.number(),
  })),
  productTrends: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    timeSeries: z.array(timeSeriesPointSchema),
  })),
  inventoryTurnover: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    turnoverRate: z.number(),
    daysToSellOut: z.number(),
  })),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

// Low Stock Inventory Response
export const lowStockInventorySchema = z.object({
  lowStockProducts: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    category: z.string(),
    currentStock: z.number(),
    lowStockThreshold: z.number(),
    reorderPoint: z.number(),
    daysUntilStockout: z.number().optional(),
    supplier: z.string().optional(),
    lastRestock: z.string().optional(),
    urgency: z.enum(['critical', 'high', 'medium', 'low']),
  })),
  outOfStockProducts: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    category: z.string(),
    stockoutDate: z.string(),
    daysOutOfStock: z.number(),
    lostSales: z.number().optional(), // estimated
  })),
  stockAlerts: z.array(z.object({
    alertId: z.string(),
    productId: z.string(),
    productName: z.string(),
    alertType: z.string(),
    currentStock: z.number(),
    threshold: z.number(),
    status: z.string(),
    createdAt: z.string(),
  })),
  inventorySummary: z.object({
    totalProducts: z.number(),
    lowStockCount: z.number(),
    outOfStockCount: z.number(),
    totalInventoryValue: z.number(),
    averageStockLevel: z.number(),
  }),
});

// Specific Top Products Response Schemas for Task 15e
export const topProductsByRevenueSchema = z.object({
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
    category: z.string(),
    revenue: z.number(),
    unitsSold: z.number(),
    averagePricePerUnit: z.number(),
    growthPercent: z.number().optional(),
    orderCount: z.number(),
  })),
  totalProducts: z.number(),
  totalRevenue: z.number(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
  previousPeriod: z.object({
    totalRevenue: z.number(),
    growthPercent: z.number(),
  }).optional(),
});

export const topProductsByUnitsSchema = z.object({
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().optional(),
    category: z.string(),
    unitsSold: z.number(),
    revenue: z.number(),
    averagePricePerUnit: z.number(),
    growthPercent: z.number().optional(),
    orderCount: z.number(),
  })),
  totalProducts: z.number(),
  totalUnitsSold: z.number(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
  previousPeriod: z.object({
    totalUnitsSold: z.number(),
    growthPercent: z.number(),
  }).optional(),
});

export const topCategoriesSchema = z.object({
  categories: z.array(z.object({
    category: z.string(),
    revenue: z.number(),
    unitsSold: z.number(),
    averageOrderValue: z.number(),
    productCount: z.number(),
    orderCount: z.number(),
    marketSharePercent: z.number(),
    growthPercent: z.number().optional(),
  })),
  totalCategories: z.number(),
  totalRevenue: z.number(),
  totalUnitsSold: z.number(),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
  previousPeriod: z.object({
    totalRevenue: z.number(),
    totalUnitsSold: z.number(),
    growthPercent: z.number(),
  }).optional(),
});

// Query parameter validation schemas
export const metricsDateRangeSchema = z.object({
  period: z.enum(['7d', '30d', '90d', '1y', 'custom']).default('30d'),
  startDate: z.string().optional(), // ISO date for custom range
  endDate: z.string().optional(),   // ISO date for custom range
  timezone: z.string().default('Asia/Kolkata'),
});

export const metricsPaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const metricsFilterSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(['date', 'value', 'name']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const topProductsQuerySchema = z.object({
  ...metricsDateRangeSchema.shape,
  ...metricsPaginationSchema.shape,
  metric: z.enum(['revenue', 'units', 'margin']).default('revenue'),
  category: z.string().optional(),
  includeOutOfStock: z.coerce.boolean().default(false),
});

export const revenueQuerySchema = z.object({
  ...metricsDateRangeSchema.shape,
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  includeForecast: z.coerce.boolean().default(false),
  category: z.string().optional(),
});

export const orderAnalyticsQuerySchema = z.object({
  ...metricsDateRangeSchema.shape,
  includeStatusBreakdown: z.coerce.boolean().default(true),
  includeHourlyPatterns: z.coerce.boolean().default(true),
});

export const customerAnalyticsQuerySchema = z.object({
  ...metricsDateRangeSchema.shape,
  ...metricsPaginationSchema.shape,
  segment: z.enum(['all', 'new', 'returning', 'vip']).default('all'),
  includeGeographic: z.coerce.boolean().default(true),
});

export const lowStockQuerySchema = z.object({
  urgency: z.enum(['all', 'critical', 'high', 'medium', 'low']).default('all'),
  category: z.string().optional(),
  includeOutOfStock: z.coerce.boolean().default(true),
  sortBy: z.enum(['urgency', 'stockLevel', 'daysUntilStockout']).default('urgency'),
});

// Specific query schemas for Task 15e endpoints
export const topProductsByRevenueQuerySchema = z.object({
  ...metricsDateRangeSchema.shape,
  ...metricsPaginationSchema.shape,
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['revenue', 'unitsSold', 'averagePricePerUnit', 'name']).default('revenue'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeGrowth: z.coerce.boolean().default(true),
});

export const topProductsByUnitsQuerySchema = z.object({
  ...metricsDateRangeSchema.shape,
  ...metricsPaginationSchema.shape,
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['unitsSold', 'revenue', 'averagePricePerUnit', 'name']).default('unitsSold'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeGrowth: z.coerce.boolean().default(true),
});

export const topCategoriesQuerySchema = z.object({
  ...metricsDateRangeSchema.shape,
  ...metricsPaginationSchema.shape,
  sortBy: z.enum(['revenue', 'unitsSold', 'averageOrderValue', 'marketSharePercent']).default('revenue'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeGrowth: z.coerce.boolean().default(true),
});

// ==============================================================================
// ADMIN ORDERS MANAGEMENT SCHEMAS (Task 15f)
// ==============================================================================

// Admin orders filtering and pagination schemas
export const adminOrdersQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'total', 'status', 'customerName', 'customerEmail', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Filtering
  status: z.enum(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']).default('all'),
  paymentStatus: z.enum(['all', 'pending', 'completed', 'failed', 'refunded']).default('all'),
  
  // Date range filtering
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  
  // Customer search
  search: z.string().optional(), // Search in customer name, email, order ID
  customerEmail: z.string().optional(),
  customerName: z.string().optional(),
  
  // Amount range filtering
  totalMin: z.coerce.number().min(0).optional(),
  totalMax: z.coerce.number().min(0).optional(),
  
  // Additional filters
  paymentMethod: z.string().optional(),
  hasTracking: z.coerce.boolean().optional(),
  includeItems: z.coerce.boolean().default(false), // Include order items in response
  includeHistory: z.coerce.boolean().default(false), // Include status history
});

// Order status update schema with validation
export const orderStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  reason: z.string().optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().optional(), // ISO date string
  notifyCustomer: z.boolean().default(true),
});

// Order status history response schema
export const orderStatusHistorySchema = z.object({
  id: z.string(),
  orderId: z.string(),
  previousStatus: z.string().nullable(),
  newStatus: z.string(),
  changedBy: z.string().nullable(), // Admin user ID
  changedByName: z.string().optional(), // Admin user name for display
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  isSystemChange: z.boolean(),
  createdAt: z.string(), // ISO date string
});

// Extended order response with history and items
export const adminOrderDetailSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string().nullable(),
  shippingAddress: z.string(),
  subtotal: z.number(),
  shippingCost: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  status: z.string(),
  paymentStatus: z.string(),
  razorpayOrderId: z.string().nullable(),
  razorpayPaymentId: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  estimatedDelivery: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // Extended fields for admin view
  items: z.array(z.object({
    id: z.string(),
    productId: z.string(),
    productName: z.string(),
    productPrice: z.number(),
    quantity: z.number(),
    totalPrice: z.number(),
    productImage: z.string().optional(), // First product image
  })).optional(),
  
  statusHistory: z.array(orderStatusHistorySchema).optional(),
  
  // Customer info summary
  customerOrderCount: z.number().optional(),
  customerTotalSpent: z.number().optional(),
});

// Admin orders list response schema
export const adminOrdersListSchema = z.object({
  orders: z.array(adminOrderDetailSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  summary: z.object({
    totalOrders: z.number(),
    pendingOrders: z.number(),
    processingOrders: z.number(),
    shippedOrders: z.number(),
    deliveredOrders: z.number(),
    cancelledOrders: z.number(),
    totalRevenue: z.number(),
    averageOrderValue: z.number(),
  }),
  filters: z.object({
    appliedFilters: z.record(z.any()),
    availableStatuses: z.array(z.string()),
    availablePaymentMethods: z.array(z.string()),
    dateRange: z.object({
      earliest: z.string().optional(),
      latest: z.string().optional(),
    }),
    amountRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }),
  }),
});

// Order export schema for CSV/Excel export
export const orderExportSchema = z.object({
  ...adminOrdersQuerySchema.omit({ page: true, limit: true }).shape,
  format: z.enum(['csv', 'xlsx']).default('csv'),
  fields: z.array(z.enum([
    'orderId', 'customerName', 'customerEmail', 'customerPhone',
    'total', 'status', 'paymentStatus', 'paymentMethod',
    'shippingAddress', 'trackingNumber', 'createdAt', 'updatedAt'
  ])).default(['orderId', 'customerName', 'customerEmail', 'total', 'status', 'createdAt']),
});

// Bulk order operations schema
export const bulkOrderOperationsSchema = z.object({
  orderIds: z.array(z.string()).min(1).max(100),
  operation: z.enum(['updateStatus', 'export', 'addTracking']),
  data: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
    trackingNumbers: z.record(z.string()).optional(), // orderId -> trackingNumber mapping
    notifyCustomers: z.boolean().default(true),
  }).optional(),
});

// Exported types for TypeScript usage
export type TimeSeriesPoint = z.infer<typeof timeSeriesPointSchema>;
export type TopEntity = z.infer<typeof topEntitySchema>;
export type MetricsSummary = z.infer<typeof metricsSummarySchema>;
export type AdminOverviewMetrics = z.infer<typeof adminOverviewMetricsSchema>;
export type RevenueAnalytics = z.infer<typeof revenueAnalyticsSchema>;
export type OrderAnalytics = z.infer<typeof orderAnalyticsSchema>;
export type CustomerAnalytics = z.infer<typeof customerAnalyticsSchema>;
export type TopProducts = z.infer<typeof topProductsSchema>;
export type LowStockInventory = z.infer<typeof lowStockInventorySchema>;

// Query parameter types
export type MetricsDateRange = z.infer<typeof metricsDateRangeSchema>;
export type MetricsPagination = z.infer<typeof metricsPaginationSchema>;
export type MetricsFilter = z.infer<typeof metricsFilterSchema>;
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
export type OrderAnalyticsQuery = z.infer<typeof orderAnalyticsQuerySchema>;
export type CustomerAnalyticsQuery = z.infer<typeof customerAnalyticsQuerySchema>;
export type LowStockQuery = z.infer<typeof lowStockQuerySchema>;

// Task 15e specific types
export type TopProductsByRevenue = z.infer<typeof topProductsByRevenueSchema>;
export type TopProductsByUnits = z.infer<typeof topProductsByUnitsSchema>;
export type TopCategories = z.infer<typeof topCategoriesSchema>;
export type TopProductsByRevenueQuery = z.infer<typeof topProductsByRevenueQuerySchema>;
export type TopProductsByUnitsQuery = z.infer<typeof topProductsByUnitsQuerySchema>;
export type TopCategoriesQuery = z.infer<typeof topCategoriesQuerySchema>;

// Task 15f Admin Orders Management types
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type OrderStatusUpdate = z.infer<typeof orderStatusUpdateSchema>;
export type OrderStatusHistoryItem = z.infer<typeof orderStatusHistorySchema>;
export type AdminOrderDetail = z.infer<typeof adminOrderDetailSchema>;
export type AdminOrdersList = z.infer<typeof adminOrdersListSchema>;
export type OrderExport = z.infer<typeof orderExportSchema>;
export type BulkOrderOperations = z.infer<typeof bulkOrderOperationsSchema>;

// Insert schemas for order status history
export const insertOrderStatusHistorySchema = createInsertSchema(orderStatusHistory).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for bulk operations
export const insertBulkOperationSchema = createInsertSchema(bulkOperations).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderStatusHistory = z.infer<typeof insertOrderStatusHistorySchema>;
export type InsertBulkOperation = z.infer<typeof insertBulkOperationSchema>;

// Additional table types for new inventory tables
export type BulkOperation = typeof bulkOperations.$inferSelect;

// =============================================================================
// CUSTOMER MANAGEMENT SYSTEM TABLES (Task 15h)
// =============================================================================

// Customer communication history for tracking admin interactions
export const customerCommunicationHistory = pgTable("customer_communication_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
  communicationType: text("communication_type").notNull(), // email, sms, phone, note, system_message
  channel: text("channel"), // sendgrid, twilio, in_app, manual
  subject: text("subject"),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Additional data like email template, SMS details, etc.
  priority: text("priority").default("normal"), // low, normal, high, urgent
  status: text("status").default("sent"), // sent, delivered, opened, clicked, bounced, failed
  responseRequired: boolean("response_required").default(false),
  respondedAt: timestamp("responded_at"),
  tags: text("tags").array().default([]), // communication tags for categorization
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_customer_comm_history_customer_id").on(table.customerId),
  index("idx_customer_comm_history_admin_user").on(table.adminUserId),
  index("idx_customer_comm_history_type").on(table.communicationType),
  index("idx_customer_comm_history_created_at").on(table.createdAt),
  index("idx_customer_comm_history_status").on(table.status),
]);

// Customer profile modification audit trail
export const customerProfileAuditLog = pgTable("customer_profile_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminUserId: varchar("admin_user_id").references(() => users.id, { onDelete: "set null" }),
  changeType: text("change_type").notNull(), // profile_update, status_change, preferences_update, note_added, tag_added
  fieldName: text("field_name"), // Which field was changed
  oldValue: text("old_value"), // Previous value (JSON string if complex)
  newValue: text("new_value"), // New value (JSON string if complex)
  reason: text("reason"), // Admin-provided reason for the change
  notes: text("notes"), // Additional context or notes
  isSystemChange: boolean("is_system_change").default(false), // True for automated changes
  ipAddress: text("ip_address"), // IP address of the admin making the change
  userAgent: text("user_agent"), // Browser info for security audit
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_customer_audit_customer_id").on(table.customerId),
  index("idx_customer_audit_admin_user").on(table.adminUserId),
  index("idx_customer_audit_change_type").on(table.changeType),
  index("idx_customer_audit_created_at").on(table.createdAt),
  index("idx_customer_audit_field_name").on(table.fieldName),
]);

// Customer analytics cache for performance optimization
export const customerAnalyticsCache = pgTable("customer_analytics_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // LTV Calculations
  lifetimeValue: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0"),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  
  // Behavioral Metrics
  firstOrderDate: timestamp("first_order_date"),
  lastOrderDate: timestamp("last_order_date"),
  daysSinceLastOrder: integer("days_since_last_order"),
  customerLifespanDays: integer("customer_lifespan_days"),
  orderFrequency: decimal("order_frequency", { precision: 5, scale: 2 }), // orders per month
  
  // Segmentation
  customerSegment: text("customer_segment"), // new, returning, vip, at_risk, inactive
  riskScore: integer("risk_score").default(0), // 0-100, higher = more at risk
  valueScore: integer("value_score").default(0), // 0-100, higher = more valuable
  
  // Geographic and Preferences
  primaryCity: text("primary_city"),
  primaryState: text("primary_state"),
  preferredCategories: text("preferred_categories").array().default([]),
  favoriteProducts: text("favorite_products").array().default([]), // product IDs
  
  // Engagement Metrics
  emailEngagementRate: decimal("email_engagement_rate", { precision: 5, scale: 2 }),
  smsEngagementRate: decimal("sms_engagement_rate", { precision: 5, scale: 2 }),
  lastEngagementDate: timestamp("last_engagement_date"),
  
  // Metadata
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customer_analytics_customer_id").on(table.customerId),
  index("idx_customer_analytics_segment").on(table.customerSegment),
  index("idx_customer_analytics_lifetime_value").on(table.lifetimeValue),
  index("idx_customer_analytics_last_order").on(table.lastOrderDate),
  index("idx_customer_analytics_risk_score").on(table.riskScore),
  index("idx_customer_analytics_value_score").on(table.valueScore),
  index("idx_customer_analytics_calculated_at").on(table.calculatedAt),
]);

// Customer notes and tags for admin management
export const customerNotes = pgTable("customer_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id, { onDelete: "set null" }),
  noteType: text("note_type").notNull(), // general, support, sales, billing, complaint, compliment
  title: text("title"),
  content: text("content").notNull(),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  tags: text("tags").array().default([]), // Custom tags for organization
  isPrivate: boolean("is_private").default(true), // Private notes only visible to admins
  reminderDate: timestamp("reminder_date"), // Optional reminder for follow-up
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customer_notes_customer_id").on(table.customerId),
  index("idx_customer_notes_admin_user").on(table.adminUserId),
  index("idx_customer_notes_type").on(table.noteType),
  index("idx_customer_notes_created_at").on(table.createdAt),
  index("idx_customer_notes_reminder_date").on(table.reminderDate),
]);

// =============================================================================
// CUSTOMER MANAGEMENT API SCHEMAS
// =============================================================================

// Customer listing query parameters
export const customersListQuerySchema = z.object({
  ...metricsPaginationSchema.shape,
  
  // Search and filtering
  search: z.string().optional(), // Search by name, email, phone
  email: z.string().optional(),
  phoneNumber: z.string().optional(),
  
  // Registration date filtering
  registrationFrom: z.string().optional(), // ISO date
  registrationTo: z.string().optional(), // ISO date
  
  // LTV filtering
  ltvMin: z.coerce.number().min(0).optional(),
  ltvMax: z.coerce.number().min(0).optional(),
  
  // Order count filtering
  orderCountMin: z.coerce.number().min(0).optional(),
  orderCountMax: z.coerce.number().min(0).optional(),
  
  // Activity filtering
  lastActivityDays: z.coerce.number().min(0).optional(), // Last activity within N days
  segment: z.enum(['all', 'new', 'returning', 'vip', 'at_risk', 'inactive']).default('all'),
  
  // Geographic filtering
  city: z.string().optional(),
  state: z.string().optional(),
  
  // Sorting
  sortBy: z.enum(['name', 'email', 'registrationDate', 'totalOrders', 'lifetimeValue', 'lastOrderDate']).default('registrationDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Include options
  includeAnalytics: z.coerce.boolean().default(true),
  includeOrderSummary: z.coerce.boolean().default(true),
});

// Customer details response schema
export const customerDetailSchema = z.object({
  // Basic user info
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  role: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  
  // Analytics and LTV data
  analytics: z.object({
    lifetimeValue: z.number(),
    totalOrders: z.number(),
    totalRevenue: z.number(),
    averageOrderValue: z.number(),
    firstOrderDate: z.string().nullable(),
    lastOrderDate: z.string().nullable(),
    daysSinceLastOrder: z.number().nullable(),
    customerLifespanDays: z.number().nullable(),
    orderFrequency: z.number().nullable(), // orders per month
    customerSegment: z.string().nullable(),
    riskScore: z.number(),
    valueScore: z.number(),
    primaryCity: z.string().nullable(),
    primaryState: z.string().nullable(),
    preferredCategories: z.array(z.string()),
    emailEngagementRate: z.number().nullable(),
    lastEngagementDate: z.string().nullable(),
  }),
  
  // Recent orders summary
  recentOrders: z.array(z.object({
    id: z.string(),
    total: z.number(),
    status: z.string(),
    paymentStatus: z.string(),
    createdAt: z.string(),
    itemCount: z.number(),
  })),
  
  // Addresses
  addresses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    recipientName: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    isDefault: z.boolean(),
  })),
  
  // Communication preferences
  communicationPreferences: z.object({
    emailNotifications: z.record(z.boolean()),
    smsNotifications: z.record(z.boolean()),
  }),
  
  // Admin notes count
  notesCount: z.number(),
  hasUrgentNotes: z.boolean(),
});

// Customer list response schema
export const customersListResponseSchema = z.object({
  customers: z.array(customerDetailSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  summary: z.object({
    totalCustomers: z.number(),
    newCustomers: z.number(), // registered in last 30 days
    returningCustomers: z.number(),
    vipCustomers: z.number(),
    atRiskCustomers: z.number(),
    inactiveCustomers: z.number(),
    averageLifetimeValue: z.number(),
    totalRevenue: z.number(),
  }),
  segmentation: z.object({
    byValue: z.array(z.object({
      segment: z.string(),
      count: z.number(),
      percentage: z.number(),
      averageLtv: z.number(),
    })),
    byActivity: z.array(z.object({
      segment: z.string(),
      count: z.number(),
      percentage: z.number(),
      averageDaysSinceLastOrder: z.number().nullable(),
    })),
  }),
});

// Customer analytics response schema  
export const customerAnalyticsResponseSchema = z.object({
  customerId: z.string(),
  
  // Purchase behavior over time
  purchaseHistory: z.array(z.object({
    date: z.string(),
    orderCount: z.number(),
    revenue: z.number(),
    averageOrderValue: z.number(),
  })),
  
  // Category preferences
  categoryBreakdown: z.array(z.object({
    category: z.string(),
    orderCount: z.number(),
    revenue: z.number(),
    percentage: z.number(),
  })),
  
  // Product preferences
  topProducts: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    orderCount: z.number(),
    totalQuantity: z.number(),
    revenue: z.number(),
  })),
  
  // Seasonal patterns
  seasonalTrends: z.array(z.object({
    month: z.string(),
    year: z.number(),
    orderCount: z.number(),
    revenue: z.number(),
  })),
  
  // Engagement metrics
  engagementMetrics: z.object({
    emailOpenRate: z.number().nullable(),
    emailClickRate: z.number().nullable(),
    smsResponseRate: z.number().nullable(),
    lastEngagementType: z.string().nullable(),
    lastEngagementDate: z.string().nullable(),
  }),
  
  // Predictive metrics
  predictions: z.object({
    nextOrderProbability: z.number(), // 0-1
    churnRisk: z.number(), // 0-1
    projectedLifetimeValue: z.number(),
    recommendedActions: z.array(z.string()),
  }),
  
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

// Customer communication schemas
export const customerCommunicationSchema = z.object({
  customerId: z.string(),
  communicationType: z.enum(['email', 'sms', 'note']),
  subject: z.string().optional(),
  content: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  tags: z.array(z.string()).default([]),
  scheduleFor: z.string().optional(), // ISO date for scheduled sending
});

// Customer profile update schema
export const customerProfileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  emailVerified: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  segment: z.enum(['new', 'returning', 'vip', 'at_risk', 'inactive']).optional(),
  // Admin can't change email directly for security reasons
});

// Export schemas for customer data
export const customerExportSchema = z.object({
  ...customersListQuerySchema.omit({ page: true, limit: true }).shape,
  format: z.enum(['csv', 'xlsx']).default('csv'),
  fields: z.array(z.enum([
    'id', 'email', 'firstName', 'lastName', 'phoneNumber', 
    'registrationDate', 'totalOrders', 'lifetimeValue', 'lastOrderDate',
    'customerSegment', 'primaryCity', 'primaryState'
  ])).default(['email', 'firstName', 'lastName', 'totalOrders', 'lifetimeValue', 'registrationDate']),
  includeAnalytics: z.coerce.boolean().default(true),
  includeOrderHistory: z.coerce.boolean().default(false),
  fileName: z.string().optional(),
});

// Insert schemas for customer management tables
export const insertCustomerCommunicationHistorySchema = createInsertSchema(customerCommunicationHistory).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerProfileAuditLogSchema = createInsertSchema(customerProfileAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerAnalyticsCacheSchema = createInsertSchema(customerAnalyticsCache).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerNotesSchema = createInsertSchema(customerNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for customer management
export type CustomerCommunicationHistory = typeof customerCommunicationHistory.$inferSelect;
export type CustomerProfileAuditLog = typeof customerProfileAuditLog.$inferSelect;
export type CustomerAnalyticsCache = typeof customerAnalyticsCache.$inferSelect;
export type CustomerNotes = typeof customerNotes.$inferSelect;

export type InsertCustomerCommunicationHistory = z.infer<typeof insertCustomerCommunicationHistorySchema>;
export type InsertCustomerProfileAuditLog = z.infer<typeof insertCustomerProfileAuditLogSchema>;
export type InsertCustomerAnalyticsCache = z.infer<typeof insertCustomerAnalyticsCacheSchema>;
export type InsertCustomerNotes = z.infer<typeof insertCustomerNotesSchema>;

// ================================
// COMPREHENSIVE ADMIN EXPORT SCHEMAS
// ================================

// Orders Export Schema
export const ordersExportSchema = z.object({
  // Date filtering
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  
  // Status filtering
  status: z.array(z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])).optional(),
  
  // Customer filtering
  customerId: z.string().optional(),
  customerEmail: z.string().optional(),
  
  // Format and fields
  format: z.enum(['csv', 'xlsx']).default('csv'),
  fields: z.array(z.enum([
    'orderId', 'orderNumber', 'customerName', 'customerEmail', 'customerPhone',
    'orderDate', 'status', 'paymentStatus', 'paymentMethod', 'total', 'tax',
    'shippingAddress', 'billingAddress', 'items', 'quantities', 'itemPrices',
    'fulfillmentStatus', 'trackingNumber', 'shippingDate', 'deliveryDate',
    'razorpayOrderId', 'razorpayPaymentId', 'notes', 'updatedAt'
  ])).default([
    'orderId', 'customerName', 'customerEmail', 'orderDate', 'status',
    'paymentStatus', 'total', 'items', 'quantities'
  ]),
  
  // Include related data
  includeItems: z.boolean().default(true),
  includePaymentDetails: z.boolean().default(true),
  includeShippingDetails: z.boolean().default(true),
  
  // File options
  fileName: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

// Revenue Export Schema
export const revenueExportSchema = z.object({
  // Date range
  dateFrom: z.string(),
  dateTo: z.string(),
  
  // Aggregation period
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('daily'),
  
  // Category filtering
  categories: z.array(z.string()).optional(),
  
  // Format and fields
  format: z.enum(['csv', 'xlsx']).default('csv'),
  fields: z.array(z.enum([
    'date', 'period', 'totalRevenue', 'ordersCount', 'averageOrderValue',
    'grossRevenue', 'netRevenue', 'refunds', 'taxes', 'shipping',
    'topProducts', 'topCategories', 'paymentMethods', 'geographicData',
    'customerSegments', 'newCustomerRevenue', 'returningCustomerRevenue'
  ])).default([
    'date', 'totalRevenue', 'ordersCount', 'averageOrderValue', 'topProducts'
  ]),
  
  // Analytics options
  includeProductBreakdown: z.boolean().default(true),
  includeCategoryBreakdown: z.boolean().default(true),
  includePaymentMethodBreakdown: z.boolean().default(false),
  includeGeographicBreakdown: z.boolean().default(false),
  
  // File options
  fileName: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

// Export Job Tracking Schema  
export const exportJobSchema = z.object({
  id: z.string(),
  type: z.enum(['orders', 'revenue', 'customers', 'inventory', 'analytics']),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(100).default(0),
  totalRecords: z.number().optional(),
  processedRecords: z.number().default(0),
  fileName: z.string().optional(),
  downloadUrl: z.string().optional(),
  fileSize: z.number().optional(),
  config: z.record(z.any()),
  error: z.string().optional(),
  adminUserId: z.string(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

// Export History Schema
export const exportHistorySchema = z.object({
  exports: z.array(exportJobSchema),
  totalCount: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

// Export Request Schema
export const exportRequestSchema = z.object({
  type: z.enum(['orders', 'revenue', 'customers', 'inventory', 'analytics']),
  parameters: z.record(z.any()),
  fileName: z.string().optional(),
});

// CSV Configuration Schema
export const csvConfigSchema = z.object({
  delimiter: z.string().default(','),
  quote: z.string().default('"'),
  escape: z.string().default('"'),
  lineTerminator: z.string().default('\n'),
  header: z.boolean().default(true),
  encoding: z.string().default('utf8'),
  dateFormat: z.string().default('YYYY-MM-DD'),
  timeFormat: z.string().default('HH:mm:ss'),
  timezone: z.string().default('Asia/Kolkata'),
});

// Export Status Update Schema
export const exportStatusUpdateSchema = z.object({
  exportId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(100).optional(),
  processedRecords: z.number().optional(),
  error: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSize: z.number().optional(),
});

// Analytics Export Schema (missing from original)
export const analyticsExportSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  metrics: z.array(z.enum([
    'revenue', 'orders', 'customers', 'conversionRate', 'retentionRate',
    'averageOrderValue', 'lifetimeValue'
  ])).default(['revenue', 'orders', 'customers', 'conversionRate']),
  format: z.enum(['csv', 'xlsx']).default('csv'),
  aggregation: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  fileName: z.string().optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

// Type exports for admin exports
export type ExportJob = z.infer<typeof exportJobSchema>;
export type ExportHistory = z.infer<typeof exportHistorySchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type CsvConfig = z.infer<typeof csvConfigSchema>;
export type ExportStatusUpdate = z.infer<typeof exportStatusUpdateSchema>;
export type AnalyticsExport = z.infer<typeof analyticsExportSchema>;
export type OrdersExport = z.infer<typeof ordersExportSchema>;
export type RevenueExport = z.infer<typeof revenueExportSchema>;

// =============================================================================
// MESSAGE TEMPLATES SYSTEM
// =============================================================================

// Message templates for WhatsApp, Email, and SMS notifications
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // order_confirmation, order_update, payment_confirmation, etc.
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"), // draft, pending_approval, approved, rejected
  language: text("language").notNull().default("en"),
  variables: text("variables").array().default([]).notNull(), // Template variables like {{customerName}}
  performance: jsonb("performance"), // Usage statistics
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_message_templates_category").on(table.category),
  index("idx_message_templates_status").on(table.status),
  index("idx_message_templates_language").on(table.language),
]);

// Notification history for tracking bulk notifications across all channels
export const notificationHistory = pgTable("notification_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  channels: text("channels").array().notNull(), // email, sms, whatsapp
  status: text("status").notNull().default("queued"), // queued, sending, sent, partially_failed, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").notNull(),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  deliveryStats: jsonb("delivery_stats"), // Channel-specific delivery statistics
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_history_status").on(table.status),
  index("idx_notification_history_created_by").on(table.createdBy),
  index("idx_notification_history_scheduled").on(table.scheduledAt),
  index("idx_notification_history_sent").on(table.sentAt),
]);

// Recipient groups for bulk notifications
export const recipientGroups = pgTable("recipient_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(), // Query criteria for selecting users
  userCount: integer("user_count").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_recipient_groups_created_by").on(table.createdBy),
  index("idx_recipient_groups_active").on(table.isActive),
]);

// Type exports for message templates and notifications
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type RecipientGroup = typeof recipientGroups.$inferSelect;

// Insert schemas
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  approvedBy: true,
});

export const insertNotificationHistorySchema = createInsertSchema(notificationHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipientGroupSchema = createInsertSchema(recipientGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Analytics and metrics schemas
export const whatsappAnalyticsSchema = z.object({
  totalMessages: z.object({
    current: z.number(),
    previous: z.number(),
    change: z.number(),
    changePercent: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  }),
  deliveryRate: z.number(),
  readRate: z.number(),
  optInRate: z.number(),
  optOutRate: z.number(),
  responseRate: z.number(),
  averageResponseTime: z.number(),
  totalOptedInUsers: z.number(),
  activeUsers: z.number(),
  messagesByType: z.object({
    orderConfirmations: z.number(),
    orderUpdates: z.number(),
    paymentConfirmations: z.number(),
    shippingNotifications: z.number(),
    deliveryNotifications: z.number(),
    stockAlerts: z.number(),
    promotional: z.number(),
    accountNotifications: z.number(),
  }),
  messageStatusBreakdown: z.object({
    sent: z.number(),
    delivered: z.number(),
    read: z.number(),
    failed: z.number(),
  }),
  costAnalysis: z.object({
    totalCost: z.number(),
    costPerMessage: z.number(),
    costPerDeliveredMessage: z.number(),
    monthlyCostTrend: z.array(z.object({
      month: z.string(),
      cost: z.number(),
    })),
  }),
  timeSeries: z.array(z.object({
    date: z.string(),
    sent: z.number(),
    delivered: z.number(),
    read: z.number(),
    failed: z.number(),
  })),
  dateRange: z.object({
    from: z.string(),
    to: z.string(),
  }),
  lastUpdated: z.string(),
});

export const notificationMetricsSchema = z.object({
  totalNotifications: z.object({
    current: z.number(),
    previous: z.number(),
    change: z.number(),
    changePercent: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  }),
  emailsSent: z.object({
    current: z.number(),
    previous: z.number(),
    change: z.number(),
    changePercent: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  }),
  smsSent: z.object({
    current: z.number(),
    previous: z.number(),
    change: z.number(),
    changePercent: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  }),
  whatsappSent: z.object({
    current: z.number(),
    previous: z.number(),
    change: z.number(),
    changePercent: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  }),
  averageDeliveryRate: z.number(),
  emailDeliveryRate: z.number(),
  smsDeliveryRate: z.number(),
  whatsappDeliveryRate: z.number(),
  queuedNotifications: z.number(),
  failedNotifications: z.number(),
  lastUpdated: z.string(),
});

export const bulkNotificationRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message content is required"),
  channels: z.array(z.enum(['email', 'sms', 'whatsapp'])).min(1, "At least one channel is required"),
  recipientGroups: z.array(z.string()).min(1, "At least one recipient group is required"),
  scheduleAt: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const bulkNotificationResultSchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'sending', 'sent', 'partially_failed', 'failed']),
  recipientCount: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  estimatedDeliveryTime: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

// Message template validation schemas
export const messageTemplateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.enum(['order_confirmation', 'order_update', 'payment_confirmation', 'shipping_notification', 'delivery_notification', 'stock_alert', 'promotional', 'account_notification']),
  content: z.string().min(1, "Template content is required").max(1024, "Template content must be less than 1024 characters"),
  language: z.string().min(1, "Language is required"),
  variables: z.string().optional(),
});

export const templateApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

// Type exports for analytics and requests
export type WhatsappAnalytics = z.infer<typeof whatsappAnalyticsSchema>;
export type NotificationMetrics = z.infer<typeof notificationMetricsSchema>;
export type BulkNotificationRequest = z.infer<typeof bulkNotificationRequestSchema>;
export type BulkNotificationResult = z.infer<typeof bulkNotificationResultSchema>;
export type MessageTemplateForm = z.infer<typeof messageTemplateFormSchema>;
export type TemplateApproval = z.infer<typeof templateApprovalSchema>;

// Insert types
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type InsertNotificationHistory = z.infer<typeof insertNotificationHistorySchema>;
export type InsertRecipientGroup = z.infer<typeof insertRecipientGroupSchema>;

// API response types
export type CustomersListQuery = z.infer<typeof customersListQuerySchema>;
export type CustomerDetail = z.infer<typeof customerDetailSchema>;
export type CustomersListResponse = z.infer<typeof customersListResponseSchema>;
export type CustomerAnalyticsResponse = z.infer<typeof customerAnalyticsResponseSchema>;
export type CustomerCommunication = z.infer<typeof customerCommunicationSchema>;
export type CustomerProfileUpdate = z.infer<typeof customerProfileUpdateSchema>;
export type CustomerExport = z.infer<typeof customerExportSchema>;
// Production commerce extensions (kept in a separate module for safe incremental migrations)
export * from "./commerceFeatures";
