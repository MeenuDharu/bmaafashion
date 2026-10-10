import type { Express, Request, Response } from "express";
import { and, asc, desc, eq, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "./db";
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from "./jwtAuth";
import { products, productVariants, supportTickets, users, orders, siteSettings } from "@shared/schema";
import {
  coupons, couponUsages, supportTicketMessages, returnRequests, recentlyViewedProducts, compareItems,
  abandonedCarts, loyaltyAccounts, loyaltyTransactions, referralCodes, referralUses,
  giftCards, giftCardTransactions, adminPermissions, adminAuditLogs, shippingCarriers, shippingRules,
  couponValidateSchema, supportMessageSchema, abandonedCartTrackSchema,
} from "@shared/commerceFeatures";
import { z } from "zod";
import { sendEmail } from "./emailService";

const authUser = (req: Request) => (req as AuthenticatedRequest).user;

async function audit(req: Request, action: string, entityType: string, entityId?: string, beforeData?: unknown, afterData?: unknown) {
  const user = authUser(req);
  if (!user) return;
  await db.insert(adminAuditLogs).values({
    adminUserId: user.id,
    action,
    entityType,
    entityId,
    beforeData: beforeData as any,
    afterData: afterData as any,
    ipAddress: req.ip,
  });
}

function discountForCoupon(coupon: any, subtotal: number) {
  if (coupon.discountType === "fixed") return Math.min(subtotal, Number(coupon.discountValue));
  const raw = subtotal * Number(coupon.discountValue) / 100;
  const cap = coupon.maximumDiscountAmount == null ? raw : Math.min(raw, Number(coupon.maximumDiscountAmount));
  return Math.min(subtotal, cap);
}

export function registerCommerceFeatureRoutes(app: Express) {
  // ---------- Search / recommendations ----------
  app.get("/api/products/search", async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || "").trim();
      const category = String(req.query.category || "").trim();
      const size = String(req.query.size || "").trim();
      const color = String(req.query.color || "").trim();
      const minPrice = Number(req.query.minPrice);
      const maxPrice = Number(req.query.maxPrice);
      const conditions: any[] = [];
      if (q) conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.description, `%${q}%`), ilike(products.sku, `%${q}%`), ilike(products.category, `%${q}%`)));
      if (category) conditions.push(or(eq(products.category, category), eq(products.mainCategory, category)));
      if (size) conditions.push(ilike(products.size, `%${size}%`));
      if (color) conditions.push(ilike(products.colors, `%${color}%`));
      if (Number.isFinite(minPrice)) conditions.push(sql`${products.price}::numeric >= ${minPrice}`);
      if (Number.isFinite(maxPrice)) conditions.push(sql`${products.price}::numeric <= ${maxPrice}`);
      const rows = await db.select().from(products).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(products.createdAt)).limit(Math.min(Number(req.query.limit) || 30, 100));
      res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ error: "Search failed" }); }
  });

  app.get("/api/products/:id/recommendations", async (req: Request, res: Response) => {
    try {
      const product = await db.select().from(products).where(eq(products.id, req.params.id)).limit(1);
      if (!product[0]) return res.status(404).json({ error: "Product not found" });
      const p = product[0];
      const rows = await db.select().from(products)
        .where(and(eq(products.mainCategory, p.mainCategory), sql`${products.id} <> ${p.id}`))
        .orderBy(desc(products.createdAt)).limit(8);
      res.json(rows);
    } catch (error) { res.status(500).json({ error: "Failed to load recommendations" }); }
  });

  // ---------- Recently viewed ----------
  app.post("/api/recently-viewed/:productId", async (req: Request, res: Response) => {
    try {
      const user = authUser(req);
      const sessionId = String(req.headers["x-session-id"] || req.body?.sessionId || "");
      if (!user && !sessionId) return res.status(400).json({ error: "Session is required" });
      if (user) await db.delete(recentlyViewedProducts).where(and(eq(recentlyViewedProducts.userId, user.id), eq(recentlyViewedProducts.productId, req.params.productId)));
      else await db.delete(recentlyViewedProducts).where(and(eq(recentlyViewedProducts.sessionId, sessionId), eq(recentlyViewedProducts.productId, req.params.productId)));
      await db.insert(recentlyViewedProducts).values({ userId: user?.id, sessionId: user ? undefined : sessionId, productId: req.params.productId });
      res.status(201).json({ success: true });
    } catch (error) { res.status(500).json({ error: "Failed to save recently viewed product" }); }
  });

  app.get("/api/recently-viewed", async (req: Request, res: Response) => {
    try {
      const user = authUser(req);
      const sessionId = String(req.headers["x-session-id"] || req.query.sessionId || "");
      const rows = user
        ? await db.select({ id: recentlyViewedProducts.id, product: products }).from(recentlyViewedProducts).innerJoin(products, eq(products.id, recentlyViewedProducts.productId)).where(eq(recentlyViewedProducts.userId, user.id)).orderBy(desc(recentlyViewedProducts.viewedAt)).limit(12)
        : await db.select({ id: recentlyViewedProducts.id, product: products }).from(recentlyViewedProducts).innerJoin(products, eq(products.id, recentlyViewedProducts.productId)).where(eq(recentlyViewedProducts.sessionId, sessionId)).orderBy(desc(recentlyViewedProducts.viewedAt)).limit(12);
      res.json(rows.map(r => r.product));
    } catch (error) { res.status(500).json({ error: "Failed to load recently viewed products" }); }
  });

  // ---------- Compare ----------
  app.get("/api/compare", async (req: Request, res: Response) => {
    try {
      const user = authUser(req); const sessionId = String(req.headers["x-session-id"] || req.query.sessionId || "");
      const where = user ? eq(compareItems.userId, user.id) : eq(compareItems.sessionId, sessionId);
      const rows = await db.select({ product: products }).from(compareItems).innerJoin(products, eq(products.id, compareItems.productId)).where(where).orderBy(asc(compareItems.createdAt)).limit(4);
      res.json(rows.map(r => r.product));
    } catch (error) { res.status(500).json({ error: "Failed to load comparison" }); }
  });
  app.post("/api/compare/:productId", async (req: Request, res: Response) => {
    try {
      const user = authUser(req); const sessionId = String(req.headers["x-session-id"] || req.body?.sessionId || "");
      const where = user ? eq(compareItems.userId, user.id) : eq(compareItems.sessionId, sessionId);
      const existing = await db.select().from(compareItems).where(and(where, eq(compareItems.productId, req.params.productId))).limit(1);
      if (existing[0]) return res.json(existing[0]);
      const count = await db.select({ count: sql<number>`count(*)` }).from(compareItems).where(where);
      if (Number(count[0]?.count || 0) >= 4) return res.status(400).json({ error: "You can compare up to 4 products" });
      const [row] = await db.insert(compareItems).values({ userId: user?.id, sessionId: user ? undefined : sessionId, productId: req.params.productId }).returning();
      res.status(201).json(row);
    } catch (error) { res.status(500).json({ error: "Failed to add product to comparison" }); }
  });
  app.delete("/api/compare/:productId", async (req: Request, res: Response) => {
    const user = authUser(req); const sessionId = String(req.headers["x-session-id"] || req.query.sessionId || "");
    await db.delete(compareItems).where(and(user ? eq(compareItems.userId, user.id) : eq(compareItems.sessionId, sessionId), eq(compareItems.productId, req.params.productId)));
    res.json({ success: true });
  });

  // ---------- Shipping quote (country/state + product rules; no pincode serviceability) ----------
  app.post("/api/shipping/quote", async (req: Request, res: Response) => {
    try {
      const { country, state, subtotal = 0, items = [] } = req.body || {};
      const countryName = String(country || "India").trim();
      const stateName = String(state || "").trim();
      const itemList = Array.isArray(items) ? items : [];
      const productIds = itemList.map((item: any) => String(item.productId || "")).filter(Boolean);
      const productsForShipping = productIds.length ? await db.select({ id: products.id, shippingChargeApplicable: products.shippingChargeApplicable, shippingCharge: products.shippingCharge }).from(products).where(inArray(products.id, productIds)) : [];
      const productMap = new Map(productsForShipping.map(p => [p.id, p]));
      const rules = await db.select().from(shippingRules).where(eq(shippingRules.active, true)).orderBy(asc(shippingRules.priority));
      const normalizedCountry = countryName.toLowerCase();
      const normalizedState = stateName.toLowerCase();
      const matching = rules.find(rule => {
        const countryMatches = !rule.country || rule.country.trim().toLowerCase() === normalizedCountry;
        const stateMatches = !rule.state || rule.state.trim().toLowerCase() === normalizedState;
        return countryMatches && stateMatches;
      });
      const siteConfig = (await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1))[0];
      const policy = siteConfig?.policies?.shipping || {};
      const baseCharge = matching ? Number(matching.shippingCharge || 0) : Math.max(0, Number(policy.shippingCost || 0));
      const freeThreshold = matching?.freeShippingThreshold != null ? Number(matching.freeShippingThreshold) : Math.max(0, Number(policy.freeThreshold || 0));
      const merchandiseSubtotal = Math.max(0, Number(subtotal || 0));
      const normalShipping = freeThreshold > 0 && merchandiseSubtotal >= freeThreshold ? 0 : baseCharge;
      const productShipping = itemList.reduce((sum: number, item: any) => {
        const product = productMap.get(String(item.productId));
        if (!product?.shippingChargeApplicable) return sum;
        return sum + Math.max(0, Number(product.shippingCharge || 0)) * Math.max(0, Number(item.quantity || 0));
      }, 0);
      const shipping = Number((normalShipping + productShipping).toFixed(2));
      res.json({ shipping, baseShipping: Number(normalShipping.toFixed(2)), productShipping: Number(productShipping.toFixed(2)), freeShippingApplied: normalShipping === 0 && freeThreshold > 0 && merchandiseSubtotal >= freeThreshold, country: countryName, state: stateName, ruleId: matching?.id || null });
    } catch (error) {
      console.error("Shipping quote failed:", error);
      res.status(400).json({ error: "Unable to calculate shipping" });
    }
  });

  // ---------- Coupons ----------
  app.post("/api/coupons/validate", async (req: Request, res: Response) => {
    try {
      const data = couponValidateSchema.parse(req.body);
      const user = authUser(req);
      const [coupon] = await db.select().from(coupons).where(eq(coupons.code, data.code.trim().toUpperCase())).limit(1);
      if (!coupon || !coupon.active) return res.status(400).json({ error: "Invalid coupon code" });
      const now = new Date();
      if (coupon.startsAt && coupon.startsAt > now) return res.status(400).json({ error: "Coupon is not active yet" });
      if (coupon.endsAt && coupon.endsAt < now) return res.status(400).json({ error: "Coupon has expired" });
      if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return res.status(400).json({ error: "Coupon usage limit reached" });
      if (Number(coupon.minimumOrderAmount || 0) > data.subtotal) return res.status(400).json({ error: `Minimum order amount is ₹${Number(coupon.minimumOrderAmount).toFixed(2)}` });
      if (coupon.firstOrderOnly && user) {
        const previous = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, user.id)).limit(1);
        if (previous.length) return res.status(400).json({ error: "Coupon is valid only on your first order" });
      }
      if (coupon.applicableProductIds?.length && !data.productIds.some(id => coupon.applicableProductIds.includes(id))) return res.status(400).json({ error: "Coupon does not apply to these products" });
      if (coupon.applicableCategories?.length && !data.categories.some(c => coupon.applicableCategories.includes(c))) return res.status(400).json({ error: "Coupon does not apply to these categories" });
      if (user && coupon.perCustomerLimit != null) {
        const uses = await db.select({ count: sql<number>`count(*)` }).from(couponUsages).where(and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.userId, user.id)));
        if (Number(uses[0]?.count || 0) >= coupon.perCustomerLimit) return res.status(400).json({ error: "You have already used this coupon" });
      }
      const discount = discountForCoupon(coupon, data.subtotal);
      res.json({ valid: true, couponId: coupon.id, code: coupon.code, discountAmount: Number(discount.toFixed(2)), discountType: coupon.discountType, discountValue: Number(coupon.discountValue) });
    } catch (error) { res.status(400).json({ error: "Unable to validate coupon" }); }
  });

  app.get("/api/admin/coupons", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(coupons).orderBy(desc(coupons.createdAt))));
  app.post("/api/admin/coupons", [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try { const user = authUser(req); const data = { ...req.body, code: String(req.body.code).trim().toUpperCase(), createdBy: user?.id }; const [row] = await db.insert(coupons).values(data).returning(); await audit(req, "create", "coupon", row.id, undefined, row); res.status(201).json(row); }
    catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create coupon" }); }
  });
  app.patch("/api/admin/coupons/:id", [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    const [before] = await db.select().from(coupons).where(eq(coupons.id, req.params.id)).limit(1); if (!before) return res.status(404).json({ error: "Coupon not found" });
    const [row] = await db.update(coupons).set({ ...req.body, updatedAt: new Date() }).where(eq(coupons.id, req.params.id)).returning(); await audit(req, "update", "coupon", row.id, before, row); res.json(row);
  });
  app.delete("/api/admin/coupons/:id", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { await db.delete(coupons).where(eq(coupons.id, req.params.id)); await audit(req, "delete", "coupon", req.params.id); res.json({ success: true }); });

  // Customer support ticket creation
  app.post("/api/support/tickets", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = authUser(req)!;
      const subject = String(req.body.subject || "").trim();
      const category = String(req.body.category || "General Support").trim();
      const message = String(req.body.message || "").trim();
      if (!subject || !message) return res.status(400).json({ error: "Subject and message are required" });
      const [ticket] = await db.insert(supportTickets).values({ userId: user.id, customerEmail: user.email, customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email, subject, category, message, status: "open", priority: "normal" }).returning();
      await db.insert(supportTicketMessages).values({ ticketId: ticket.id, senderUserId: user.id, senderType: "customer", message });
      res.status(201).json(ticket);
    } catch (error) { res.status(400).json({ error: "Unable to create support ticket" }); }
  });
  // ---------- Support ----------
  app.get("/api/support/tickets", authenticateToken, async (req: Request, res: Response) => {
    const user = authUser(req); const rows = await db.select().from(supportTickets).where(eq(supportTickets.userId, user!.id)).orderBy(desc(supportTickets.createdAt)); res.json(rows);
  });
  app.get("/api/support/tickets/:id/messages", authenticateToken, async (req: Request, res: Response) => {
    const user = authUser(req); const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, req.params.id)).limit(1);
    if (!ticket || (ticket.userId !== user?.id && user?.role !== "admin")) return res.status(404).json({ error: "Ticket not found" });
    res.json(await db.select().from(supportTicketMessages).where(eq(supportTicketMessages.ticketId, req.params.id)).orderBy(asc(supportTicketMessages.createdAt)));
  });
  app.post("/api/support/tickets/:id/messages", authenticateToken, async (req: Request, res: Response) => {
    const user = authUser(req); const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, req.params.id)).limit(1);
    if (!ticket || (ticket.userId !== user?.id && user?.role !== "admin")) return res.status(404).json({ error: "Ticket not found" });
    const { message } = supportMessageSchema.parse(req.body);
    const [row] = await db.insert(supportTicketMessages).values({ ticketId: ticket.id, senderUserId: user!.id, senderType: user!.role === "admin" ? "admin" : "customer", message }).returning();
    await db.update(supportTickets).set({ response: user!.role === "admin" ? message : ticket.response, status: user!.role === "admin" ? "in_progress" : ticket.status, updatedAt: new Date() }).where(eq(supportTickets.id, ticket.id));
    res.status(201).json(row);
  });
  app.get("/api/admin/support/tickets", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt))));
  app.patch("/api/admin/support/tickets/:id", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [row] = await db.update(supportTickets).set({ ...req.body, updatedAt: new Date() }).where(eq(supportTickets.id, req.params.id)).returning(); if (!row) return res.status(404).json({ error: "Ticket not found" }); await audit(req, "update", "support_ticket", row.id, undefined, row); res.json(row); });

  // ---------- Returns / refunds ----------
  app.post("/api/returns", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = authUser(req); const [order] = await db.select().from(orders).where(and(eq(orders.id, req.body.orderId), eq(orders.userId, user!.id))).limit(1);
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (!["delivered", "processing", "shipped"].includes(order.status)) return res.status(400).json({ error: "This order cannot currently be returned" });
      const [existing] = await db.select().from(returnRequests).where(eq(returnRequests.orderId, order.id)).limit(1);
      if (existing) return res.status(409).json({ error: "A return request already exists for this order" });
      const [row] = await db.insert(returnRequests).values({ ...req.body, userId: user!.id, customerEmail: user!.email }).returning(); res.status(201).json(row);
    } catch (error) { res.status(400).json({ error: "Invalid return request" }); }
  });
  app.get("/api/returns", authenticateToken, async (req: Request, res: Response) => res.json(await db.select().from(returnRequests).where(eq(returnRequests.userId, authUser(req)!.id)).orderBy(desc(returnRequests.createdAt))));
  app.get("/api/admin/returns", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(returnRequests).orderBy(desc(returnRequests.createdAt))));
  app.patch("/api/admin/returns/:id", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [row] = await db.update(returnRequests).set({ ...req.body, updatedAt: new Date() }).where(eq(returnRequests.id, req.params.id)).returning(); if (!row) return res.status(404).json({ error: "Return not found" }); await audit(req, "update", "return_request", row.id, undefined, row); res.json(row); });

  // ---------- Abandoned carts ----------
  app.post("/api/abandoned-cart/track", async (req: Request, res: Response) => {
    try {
      const data = abandonedCartTrackSchema.parse(req.body); const user = authUser(req); const sessionId = data.sessionId || String(req.headers["x-session-id"] || "");
      const [existing] = await db.select().from(abandonedCarts).where(user ? eq(abandonedCarts.userId, user.id) : eq(abandonedCarts.sessionId, sessionId)).limit(1);
      if (existing) { const [row] = await db.update(abandonedCarts).set({ items: data.items, cartTotal: String(data.cartTotal), customerEmail: data.customerEmail || user?.email, customerName: data.customerName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(), status: "active", lastSeenAt: new Date(), updatedAt: new Date() }).where(eq(abandonedCarts.id, existing.id)).returning(); return res.json(row); }
      const [row] = await db.insert(abandonedCarts).values({ userId: user?.id, sessionId: user ? undefined : sessionId, customerEmail: data.customerEmail || user?.email, customerName: data.customerName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(), items: data.items, cartTotal: String(data.cartTotal) }).returning(); res.status(201).json(row);
    } catch (error) { res.status(400).json({ error: "Unable to track cart" }); }
  });
  app.get("/api/admin/abandoned-carts", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(abandonedCarts).orderBy(desc(abandonedCarts.lastSeenAt)).limit(500)));

  // ---------- Loyalty ----------
  app.get("/api/loyalty", authenticateToken, async (req: Request, res: Response) => {
    const user = authUser(req)!; let [account] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, user.id)).limit(1);
    if (!account) [account] = await db.insert(loyaltyAccounts).values({ userId: user.id }).returning();
    const transactions = await db.select().from(loyaltyTransactions).where(eq(loyaltyTransactions.userId, user.id)).orderBy(desc(loyaltyTransactions.createdAt)).limit(50); res.json({ account, transactions });
  });
  app.post("/api/admin/loyalty/adjust", [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    const userId = String(req.body.userId); const points = Number(req.body.points); if (!Number.isInteger(points) || points === 0) return res.status(400).json({ error: "Points must be a non-zero integer" });
    let [account] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, userId)).limit(1); if (!account) [account] = await db.insert(loyaltyAccounts).values({ userId }).returning();
    const next = Math.max(0, account.pointsBalance + points); [account] = await db.update(loyaltyAccounts).set({ pointsBalance: next, lifetimePoints: Math.max(0, account.lifetimePoints + Math.max(points, 0)), updatedAt: new Date() }).where(eq(loyaltyAccounts.id, account.id)).returning();
    await db.insert(loyaltyTransactions).values({ userId, points, type: "admin_adjustment", description: req.body.description || "Admin adjustment" }); await audit(req, "adjust", "loyalty", userId, undefined, { points }); res.json(account);
  });

  // ---------- Referrals ----------
  app.get("/api/referrals", authenticateToken, async (req: Request, res: Response) => {
    const user = authUser(req)!; let [row] = await db.select().from(referralCodes).where(eq(referralCodes.userId, user.id)).limit(1);
    if (!row) { const code = `BMAA-${user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; [row] = await db.insert(referralCodes).values({ userId: user.id, code }).returning(); }
    const uses = await db.select().from(referralUses).where(eq(referralUses.referralCodeId, row.id)).orderBy(desc(referralUses.createdAt)); res.json({ code: row, uses });
  });
  app.post("/api/referrals/apply", authenticateToken, async (req: Request, res: Response) => {
    const user = authUser(req)!; const code = String(req.body.code || "").trim().toUpperCase(); const [ref] = await db.select().from(referralCodes).where(and(eq(referralCodes.code, code), eq(referralCodes.active, true))).limit(1);
    if (!ref || ref.userId === user.id) return res.status(400).json({ error: "Invalid referral code" });
    const [existing] = await db.select().from(referralUses).where(eq(referralUses.referredUserId, user.id)).limit(1); if (existing) return res.status(400).json({ error: "Referral already applied" });
    await db.insert(referralUses).values({ referralCodeId: ref.id, referredUserId: user.id }); res.json({ success: true, rewardPoints: ref.rewardPoints });
  });

  // ---------- Gift cards ----------
  app.post("/api/gift-cards/check", async (req: Request, res: Response) => { const code = String(req.body.code || "").trim().toUpperCase(); const [card] = await db.select().from(giftCards).where(eq(giftCards.code, code)).limit(1); if (!card || !card.active || (card.expiresAt && card.expiresAt < new Date())) return res.status(400).json({ error: "Invalid or expired gift card" }); res.json({ valid: true, code: card.code, remainingAmount: Number(card.remainingAmount) }); });
  app.get("/api/admin/gift-cards", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(giftCards).orderBy(desc(giftCards.createdAt))));
  app.post("/api/admin/gift-cards", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const code = String(req.body.code || `BMAA-GC-${cryptoRandom(10)}`).trim().toUpperCase(); const amount = Number(req.body.initialAmount); if (!(amount > 0)) return res.status(400).json({ error: "Gift card amount must be positive" }); const [row] = await db.insert(giftCards).values({ ...req.body, code, initialAmount: String(amount), remainingAmount: String(amount) }).returning(); await audit(req, "create", "gift_card", row.id, undefined, row); res.status(201).json(row); });
  app.patch("/api/admin/gift-cards/:id", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [row] = await db.update(giftCards).set({ ...req.body, updatedAt: new Date() }).where(eq(giftCards.id, req.params.id)).returning(); if (!row) return res.status(404).json({ error: "Gift card not found" }); await audit(req, "update", "gift_card", row.id, undefined, row); res.json(row); });

  // ---------- Admin pincode / carriers / permissions / audit ----------
  app.get("/api/admin/shipping-rules", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(shippingRules).orderBy(asc(shippingRules.priority), asc(shippingRules.name))));
  app.post("/api/admin/shipping-rules", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [row] = await db.insert(shippingRules).values({ ...req.body, shippingCharge: String(Math.max(0, Number(req.body.shippingCharge || 0))), freeShippingThreshold: req.body.freeShippingThreshold == null || req.body.freeShippingThreshold === "" ? null : String(Math.max(0, Number(req.body.freeShippingThreshold))) }).returning(); await audit(req, "create", "shipping_rule", row.id, undefined, row); res.status(201).json(row); });
  app.patch("/api/admin/shipping-rules/:id", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [before] = await db.select().from(shippingRules).where(eq(shippingRules.id, req.params.id)).limit(1); if (!before) return res.status(404).json({ error: "Shipping rule not found" }); const [row] = await db.update(shippingRules).set({ ...req.body, shippingCharge: req.body.shippingCharge == null ? undefined : String(Math.max(0, Number(req.body.shippingCharge))), freeShippingThreshold: req.body.freeShippingThreshold == null || req.body.freeShippingThreshold === "" ? null : String(Math.max(0, Number(req.body.freeShippingThreshold))), updatedAt: new Date() }).where(eq(shippingRules.id, req.params.id)).returning(); await audit(req, "update", "shipping_rule", row.id, before, row); res.json(row); });
  app.delete("/api/admin/shipping-rules/:id", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { await db.delete(shippingRules).where(eq(shippingRules.id, req.params.id)); await audit(req, "delete", "shipping_rule", req.params.id); res.json({ success: true }); });
  app.get("/api/admin/carriers", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(shippingCarriers).orderBy(asc(shippingCarriers.name))));
  app.post("/api/admin/carriers", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [row] = await db.insert(shippingCarriers).values(req.body).returning(); res.status(201).json(row); });
  app.patch("/api/admin/orders/:orderId/shipping", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [row] = await db.update(orders).set({ trackingNumber: req.body.trackingNumber, estimatedDelivery: req.body.estimatedDelivery ? new Date(req.body.estimatedDelivery) : undefined, updatedAt: new Date() }).where(eq(orders.id, req.params.orderId)).returning(); if (!row) return res.status(404).json({ error: "Order not found" }); await audit(req, "update_shipping", "order", row.id, undefined, req.body); res.json(row); });
  app.get("/api/admin/audit-logs", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => res.json(await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(500)));
  app.get("/api/admin/permissions/:userId", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const [row] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, req.params.userId)).limit(1); res.json(row || { userId: req.params.userId, permissions: [] }); });
  app.put("/api/admin/permissions/:userId", [authenticateToken, requireAdmin], async (req: Request, res: Response) => { const permissions = Array.isArray(req.body.permissions) ? req.body.permissions.map(String) : []; const [existing] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, req.params.userId)).limit(1); const [row] = existing ? await db.update(adminPermissions).set({ permissions, updatedAt: new Date() }).where(eq(adminPermissions.id, existing.id)).returning() : await db.insert(adminPermissions).values({ userId: req.params.userId, permissions }).returning(); await audit(req, "update", "admin_permissions", req.params.userId, existing, row); res.json(row); });

  // Lightweight scheduled cleanup endpoint for cron/PM2. It never deletes orders or customer data.
  app.post("/api/admin/commerce/maintenance", [authenticateToken, requireAdmin], async (_req: Request, res: Response) => {
    const stale = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await db.delete(recentlyViewedProducts).where(lt(recentlyViewedProducts.viewedAt, stale));
    const cartCutoff = new Date(Date.now() - 60 * 60 * 1000);
    const carts = await db.select().from(abandonedCarts).where(and(eq(abandonedCarts.status, "active"), lt(abandonedCarts.lastSeenAt, cartCutoff)));
    let reminders = 0;
    const from = process.env.SMTP_EMAIL || process.env.ADMIN_EMAIL;
    if (from) {
      for (const cart of carts) {
        if (!cart.customerEmail || cart.reminderSentAt) continue;
        try {
          const sent = await sendEmail({ to: cart.customerEmail, from, subject: "You left something behind – BMAA Fashion", text: `Hi ${cart.customerName || "there"}, your BMAA Fashion cart is waiting for you.`, html: `<p>Hi ${cart.customerName || "there"},</p><p>Your BMAA Fashion cart is still waiting for you. Come back to complete your purchase.</p><p><a href="${process.env.DOMAIN || "http://localhost:5000"}/checkout">Return to checkout</a></p>` });
          if (sent) { await db.update(abandonedCarts).set({ reminderSentAt: new Date(), updatedAt: new Date() }).where(eq(abandonedCarts.id, cart.id)); reminders++; }
        } catch (error) { console.error("Abandoned cart email failed", cart.id, error); }
      }
    }
    res.json({ success: true, cleanedRecentlyViewed: result.rowCount ?? 0, abandonedCartRemindersSent: reminders });
  });
}

export async function awardLoyaltyForCompletedOrder(order: { id: string; userId?: string | null; total: string; referralCode?: string | null }) {
  if (!order.userId) return;
  const points = Math.max(0, Math.floor(Number(order.total)));
  if (!points) return;
  let [account] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, order.userId)).limit(1);
  if (!account) [account] = await db.insert(loyaltyAccounts).values({ userId: order.userId }).returning();
  const existing = await db.select({ id: loyaltyTransactions.id }).from(loyaltyTransactions).where(and(eq(loyaltyTransactions.userId, order.userId), eq(loyaltyTransactions.orderId, order.id), eq(loyaltyTransactions.type, "purchase"))).limit(1);
  if (!existing.length) {
    await db.update(loyaltyAccounts).set({ pointsBalance: account.pointsBalance + points, lifetimePoints: account.lifetimePoints + points, updatedAt: new Date() }).where(eq(loyaltyAccounts.id, account.id));
    await db.insert(loyaltyTransactions).values({ userId: order.userId, points, type: "purchase", description: `Points earned for order ${order.id.slice(-8).toUpperCase()}`, orderId: order.id });
  }
  const [referral] = await db.select().from(referralUses).where(eq(referralUses.referredUserId, order.userId)).limit(1);
  if (referral && !referral.orderId) {
    await db.update(referralUses).set({ orderId: order.id }).where(eq(referralUses.id, referral.id));
    const [code] = await db.select().from(referralCodes).where(eq(referralCodes.id, referral.referralCodeId)).limit(1);
    if (code) {
      let [referrerAccount] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, code.userId)).limit(1);
      if (!referrerAccount) [referrerAccount] = await db.insert(loyaltyAccounts).values({ userId: code.userId }).returning();
      await db.update(loyaltyAccounts).set({ pointsBalance: referrerAccount.pointsBalance + code.rewardPoints, lifetimePoints: referrerAccount.lifetimePoints + code.rewardPoints, updatedAt: new Date() }).where(eq(loyaltyAccounts.id, referrerAccount.id));
      await db.insert(loyaltyTransactions).values({ userId: code.userId, points: code.rewardPoints, type: "referral", description: `Referral reward for order ${order.id.slice(-8).toUpperCase()}`, orderId: order.id });
    }
  }
}

function cryptoRandom(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = ""; for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]; return out;
}
