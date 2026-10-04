#!/usr/bin/env tsx

/**
 * Master Seed Script for bmaafashion
 * 
 * Seeds all data in the correct order:
 * 1. Users (admin and test users)
 * 2. Categories (main categories)
 * 
 * Usage:
 *   npm run db:seed
 *   OR
 *   tsx scripts/seed-all.ts
 */

import { storage } from '../server/storage';
import { hashPassword } from '../server/jwtAuth';
import type { InsertCategory } from '@shared/schema';

// ============================================
// USER SEEDING
// ============================================
async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const createdUsers: Array<{ email: string; password: string; role: string }> = [];

  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@bmaafashion.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const userEmail = process.env.USER_EMAIL || "user@bmaafashion.com";
    const userPassword = process.env.USER_PASSWORD || "user123";

    // Create admin user
    try {
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      if (existingAdmin) {
        console.log('  ⚠️  Admin user already exists, skipping...');
      } else {
        const hashedAdminPassword = await hashPassword(adminPassword);
        const adminUser = await storage.createUser({
          email: adminEmail,
          password: hashedAdminPassword,
          firstName: "Admin",
          lastName: "User",
          phoneNumber: "+91 9876543210",
          profileImageUrl: null,
          role: "admin",
          emailVerified: true,
        });
        console.log('  ✅ Admin user created:', adminUser.email);
        createdUsers.push({ email: adminEmail, password: adminPassword, role: "admin" });
      }
    } catch (error: any) {
      if (error.message?.includes("unique") || error.code === "23505") {
        console.log('  ⚠️  Admin user already exists (unique constraint), skipping...');
      } else {
        throw error;
      }
    }

    // Create regular user
    try {
      const existingUser = await storage.getUserByEmail(userEmail);
      if (existingUser) {
        console.log('  ⚠️  Regular user already exists, skipping...');
      } else {
        const hashedUserPassword = await hashPassword(userPassword);
        const regularUser = await storage.createUser({
          email: userEmail,
          password: hashedUserPassword,
          firstName: "Test",
          lastName: "User",
          phoneNumber: "+91 9876543211",
          profileImageUrl: null,
          role: "user",
          emailVerified: true,
        });
        console.log('  ✅ Regular user created:', regularUser.email);
        createdUsers.push({ email: userEmail, password: userPassword, role: "user" });
      }
    } catch (error: any) {
      if (error.message?.includes("unique") || error.code === "23505") {
        console.log('  ⚠️  Regular user already exists (unique constraint), skipping...');
      } else {
        throw error;
      }
    }

    // Show credentials for newly created users
    if (createdUsers.length > 0 && process.env.NODE_ENV !== "production") {
      console.log('\n  📋 New User Credentials:');
      createdUsers.forEach((user) => {
        console.log(`  ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account:`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Password: ${user.password}`);
      });
      console.log('');
    }
  } catch (error) {
    console.error('  ❌ Error seeding users:', error);
    throw error;
  }
}

// ============================================
// CATEGORY SEEDING
// ============================================
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
  console.log('📁 Seeding categories...');
  
  try {
    const existingCategories = await storage.getCategories();
    const existingCategoryNames = new Set(existingCategories.map(c => c.mainCategory));
    
    let newCategoriesCount = 0;
    
    for (const category of sampleCategories) {
      if (!existingCategoryNames.has(category.mainCategory)) {
        const created = await storage.createCategory(category);
        console.log(`  ✅ Created category: ${created.mainCategory}`);
        newCategoriesCount++;
      } else {
        console.log(`  ⚠️  Category already exists: ${category.mainCategory}`);
      }
    }
    
    if (newCategoriesCount === 0) {
      console.log('  ℹ️  All categories already exist');
    }
  } catch (error) {
    console.error('  ❌ Error seeding categories:', error);
    throw error;
  }
}

// ============================================
// MAIN SEEDING FUNCTION
// ============================================
async function seedAll() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    await seedUsers();
    console.log('');
    await seedCategories();
    
    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedAll()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  });
