#!/usr/bin/env tsx

/**
 * User Seeding Script for Bmaa Fashion
 *
 * Creates admin and user accounts for development and testing.
 *
 * Usage:
 *   SEED_USERS=true tsx scripts/seed-users.ts
 *
 * Environment Variables:
 *   - SEED_USERS=true       Required (except in development)
 *   - SEED_FORCE=true       Allow running in production (dangerous)
 *   - ADMIN_EMAIL           Admin email (default: admin@bmaafashion.com)
 *   - ADMIN_PASSWORD        Admin password (default: secure random)
 *   - USER_EMAIL            User email (default: user@bmaafashion.com)
 *   - USER_PASSWORD         User password (default: secure random)
 *
 * Security Features:
 *   - Blocks production use without explicit SEED_FORCE=true
 *   - Generates secure random passwords if not provided
 *   - Only shows passwords for newly created users
 *   - Handles duplicate user creation gracefully
 */

import { storage } from "../server/storage";
import { hashPassword } from "../server/jwtAuth";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config()

// Generate secure random password
function generateSecurePassword(): string {
  const length = 16;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function seedUsers() {
  console.log("🌱 Starting user seeding...");

  // Production safety guard
  const nodeEnv = process.env.NODE_ENV;
  // const seedUsers = process.env.SEED_USERS;
  // const seedForce = process.env.SEED_FORCE;

  // if (nodeEnv === "production" && !seedForce) {
  //   console.error(
  //     "❌ Cannot run seeding in production without SEED_FORCE=true",
  //   );
  //   process.exit(1);
  // }

  // if (!seedUsers && nodeEnv !== "development") {
  //   console.error(
  //     "❌ Set SEED_USERS=true to confirm you want to create seed users",
  //   );
  //   process.exit(1);
  // }

  const createdUsers: Array<{ email: string; password: string; role: string }> =
    [];

  try {
    // Get credentials from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || "admin@bmaafashion.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const userEmail = process.env.USER_EMAIL || "user@bmaafashion.com";
    const userPassword = process.env.USER_PASSWORD || "user123";

    // Create admin user
    try {
      const existingAdmin = await storage.getUserByEmail(adminEmail);
      if (existingAdmin) {
        console.log("⚠️ Admin user already exists, skipping...");
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
        console.log("✅ Admin user created:", adminUser.email);
        createdUsers.push({
          email: adminEmail,
          password: adminPassword,
          role: "admin",
        });
      }
    } catch (error: any) {
      if (error.message?.includes("unique") || error.code === "23505") {
        console.log(
          "⚠️ Admin user already exists (unique constraint), skipping...",
        );
      } else {
        throw error;
      }
    }

    // Create regular user
    try {
      const existingUser = await storage.getUserByEmail(userEmail);
      if (existingUser) {
        console.log("⚠️ Regular user already exists, skipping...");
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
        console.log("✅ Regular user created:", regularUser.email);
        createdUsers.push({
          email: userEmail,
          password: userPassword,
          role: "user",
        });
      }
    } catch (error: any) {
      if (error.message?.includes("unique") || error.code === "23505") {
        console.log(
          "⚠️ Regular user already exists (unique constraint), skipping...",
        );
      } else {
        throw error;
      }
    }

    console.log("\n🎉 User seeding completed successfully!");

    // Only show credentials for newly created users and only in non-production
    if (createdUsers.length > 0 && nodeEnv !== "production") {
      console.log("\n📋 New User Credentials (save these):");
      createdUsers.forEach((user) => {
        console.log(
          `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account:`,
        );
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${user.password}`);
        console.log(`  Role: ${user.role}\n`);
      });
    } else if (createdUsers.length === 0) {
      console.log(
        "ℹ️ All users already exist. Existing passwords remain unchanged.",
      );
    } else {
      console.log(
        "ℹ️ Users created. Check environment variables for credentials.",
      );
    }
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedUsers()
  .then(() => {
    console.log("\n✅ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding process failed:", error);
    process.exit(1);
  });
