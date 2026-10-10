import { and, eq, lt } from "drizzle-orm";
import { db, pool } from "../server/db";
import { abandonedCarts, recentlyViewedProducts } from "@shared/commerceFeatures";
import { sendEmail } from "../server/emailService";

async function run() {
  const oldViewed = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await db.delete(recentlyViewedProducts).where(lt(recentlyViewedProducts.viewedAt, oldViewed));
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const carts = await db.select().from(abandonedCarts).where(and(eq(abandonedCarts.status, "active"), lt(abandonedCarts.lastSeenAt, cutoff)));
  const from = process.env.SMTP_EMAIL || process.env.ADMIN_EMAIL;
  let sent = 0;
  if (from) for (const cart of carts) {
    if (!cart.customerEmail || cart.reminderSentAt) continue;
    const ok = await sendEmail({ to: cart.customerEmail, from, subject: "You left something behind – BMAA Fashion", text: `Hi ${cart.customerName || "there"}, your BMAA Fashion cart is waiting for you.`, html: `<p>Hi ${cart.customerName || "there"},</p><p>Your BMAA Fashion cart is still waiting for you.</p><p><a href="${process.env.DOMAIN || "http://localhost:5000"}/checkout">Return to checkout</a></p>` });
    if (ok) { await db.update(abandonedCarts).set({ reminderSentAt: new Date(), updatedAt: new Date() }).where(eq(abandonedCarts.id, cart.id)); sent++; }
  }
  console.log(JSON.stringify({ cleanedRecentlyViewed: result.rowCount ?? 0, abandonedCartRemindersSent: sent }));
  await pool.end();
}
run().catch(async error => { console.error(error); await pool.end(); process.exit(1); });
