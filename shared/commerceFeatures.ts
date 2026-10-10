import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, jsonb, index, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";
import { products } from "./schema";
import { orders } from "./schema";

export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: decimal("minimum_order_amount", { precision: 10, scale: 2 }).default("0"),
  maximumDiscountAmount: decimal("maximum_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  perCustomerLimit: integer("per_customer_limit").default(1),
  firstOrderOnly: boolean("first_order_only").notNull().default(false),
  applicableProductIds: text("applicable_product_ids").array().default([]).notNull(),
  applicableCategories: text("applicable_categories").array().default([]).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  active: boolean("active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_coupons_active").on(t.active), index("idx_coupons_ends_at").on(t.endsAt)]);

export const couponUsages = pgTable("coupon_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  customerEmail: text("customer_email"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_coupon_usages_coupon").on(t.couponId), index("idx_coupon_usages_user").on(t.userId)]);

export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  senderUserId: varchar("sender_user_id").references(() => users.id, { onDelete: "set null" }),
  senderType: text("sender_type").notNull().default("customer"),
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_support_ticket_messages_ticket").on(t.ticketId)]);

export const returnRequests = pgTable("return_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  customerEmail: text("customer_email").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  items: jsonb("items").notNull(),
  status: text("status").notNull().default("requested"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).default("0"),
  adminNotes: text("admin_notes"),
  pickupTrackingNumber: text("pickup_tracking_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_returns_order").on(t.orderId), index("idx_returns_status").on(t.status)]);

export const recentlyViewedProducts = pgTable("recently_viewed_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
}, (t) => [index("idx_recent_viewed_user").on(t.userId), index("idx_recent_viewed_session").on(t.sessionId), index("idx_recent_viewed_product").on(t.productId)]);

export const compareItems = pgTable("compare_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_compare_user").on(t.userId), index("idx_compare_session").on(t.sessionId), index("idx_compare_product").on(t.productId)]);

export const shippingRules = pgTable("shipping_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  country: text("country"),
  state: text("state"),
  shippingCharge: decimal("shipping_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }),
  active: boolean("active").notNull().default(true),
  priority: integer("priority").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_shipping_rules_active_priority").on(t.active, t.priority), index("idx_shipping_rules_country_state").on(t.country, t.state)]);

export const abandonedCarts = pgTable("abandoned_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  items: jsonb("items").notNull(),
  cartTotal: decimal("cart_total", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  reminderSentAt: timestamp("reminder_sent_at"),
  recoveredOrderId: varchar("recovered_order_id").references(() => orders.id, { onDelete: "set null" }),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_abandoned_carts_status").on(t.status), index("idx_abandoned_carts_last_seen").on(t.lastSeenAt)]);

export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  pointsBalance: integer("points_balance").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_loyalty_transactions_user").on(t.userId)]);

export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  rewardPoints: integer("reward_points").notNull().default(100),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralUses = pgTable("referral_uses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("unique_referral_referred_user").on(t.referredUserId)]);

export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 32 }).notNull().unique(),
  initialAmount: decimal("initial_amount", { precision: 10, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  purchaserUserId: varchar("purchaser_user_id").references(() => users.id, { onDelete: "set null" }),
  recipientEmail: text("recipient_email"),
  message: text("message"),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: varchar("gift_card_id").notNull().references(() => giftCards.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminPermissions = pgTable("admin_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  permissions: text("permissions").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  beforeData: jsonb("before_data"),
  afterData: jsonb("after_data"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_admin_audit_created").on(t.createdAt), index("idx_admin_audit_admin").on(t.adminUserId)]);

export const shippingCarriers = pgTable("shipping_carriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  trackingUrlTemplate: text("tracking_url_template"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, usageCount: true, createdAt: true, updatedAt: true });
export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGiftCardSchema = createInsertSchema(giftCards).omit({ id: true, remainingAmount: true, createdAt: true, updatedAt: true });

export const couponValidateSchema = z.object({ code: z.string().min(1).max(64), subtotal: z.coerce.number().min(0), productIds: z.array(z.string()).default([]), categories: z.array(z.string()).default([]) });
export const supportMessageSchema = z.object({ message: z.string().min(1).max(5000) });
export const abandonedCartTrackSchema = z.object({ sessionId: z.string().optional(), customerEmail: z.string().email().optional(), customerName: z.string().optional(), items: z.array(z.any()).min(1), cartTotal: z.coerce.number().min(0) });

export type Coupon = typeof coupons.$inferSelect;
export type ReturnRequest = typeof returnRequests.$inferSelect;
export type ShippingRule = typeof shippingRules.$inferSelect;
export type GiftCard = typeof giftCards.$inferSelect;
export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;
