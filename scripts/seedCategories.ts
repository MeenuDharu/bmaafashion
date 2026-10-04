#!/usr/bin/env tsx

import { storage } from '../server/storage';
import type { InsertCategory } from '@shared/schema';

const sampleCategories: InsertCategory[] = [
  {
    mainCategory: "Kits",
    subcategories: [],
  },
  {
    mainCategory: "Fresh Produce",
    subcategories: [],
  },
];

async function seedCategories() {
  try {
    console.log('🔍 Checking existing categories...');
    const existingCategories = await storage.getCategories();
    const existingCategoryNames = new Set(existingCategories.map(c => c.mainCategory));
    
    let newCategoriesCount = 0;
    let skippedCategoriesCount = 0;
    
    for (const category of sampleCategories) {
      if (!existingCategoryNames.has(category.mainCategory)) {
        const created = await storage.createCategory(category);
        console.log(`✅ Created category: ${created.mainCategory}`);
        newCategoriesCount++;
      } else {
        skippedCategoriesCount++;
      }
    }
    
    console.log(`🎉 Category seeding complete!`);
    console.log(`   - New categories added: ${newCategoriesCount}`);
    console.log(`   - Categories skipped (already exist): ${skippedCategoriesCount}`);
    console.log(`   - Total categories in database: ${existingCategories.length + newCategoriesCount}`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedCategories()
  .then(() => {
    console.log('\n✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });
