import { db } from "../server/db";
import { siteSettings } from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateStoreName() {
  try {
    console.log("Updating store name to 'Bmaafashion'...");
    
    const result = await db
      .update(siteSettings)
      .set({ storeName: "Bmaafashion" })
      .where(eq(siteSettings.id, 1))
      .returning();
    
    if (result.length > 0) {
      console.log("✅ Store name updated successfully!");
      console.log("Current store name:", result[0].storeName);
    } else {
      console.log("⚠️ No site settings found. Creating default...");
      const created = await db
        .insert(siteSettings)
        .values({ id: 1, storeName: "Bmaafashion" })
        .returning();
      console.log("✅ Site settings created with store name:", created[0].storeName);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating store name:", error);
    process.exit(1);
  }
}

updateStoreName();
