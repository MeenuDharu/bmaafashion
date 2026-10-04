#!/usr/bin/env tsx

/**
 * Delete Non-Admin Users and Their Orders Script
 * 
 * This script deletes all non-admin users (role != 'admin') and their associated orders.
 * It also deletes all related data that cascades from users (addresses, wishlists, reviews, etc.)
 * 
 * Usage: npx tsx scripts/delete-non-admin-users.ts
 */

import { db } from '../server/db';
import { users, orders } from '../shared/schema';
import { ne, inArray, isNotNull, and, eq, sql } from 'drizzle-orm';

async function deleteNonAdminUsers() {
  try {
    console.log('🗑️  Starting deletion of non-admin users and their orders...');
    
    // First, get all non-admin users
    const nonAdminUsers = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(ne(users.role, 'admin'));
    
    if (nonAdminUsers.length === 0) {
      console.log('✅ No non-admin users found. Nothing to delete.');
      return;
    }
    
    console.log(`📋 Found ${nonAdminUsers.length} non-admin user(s) to delete:`);
    nonAdminUsers.forEach(user => {
      console.log(`   - ${user.email} (role: ${user.role})`);
    });
    
    // Extract user IDs for deletion
    const userIdsToDelete = nonAdminUsers.map(u => u.id);
    
    // Step 1: Nullify userId in inventory_history for non-admin users
    console.log('\n🔄 Nullifying user references in inventory_history...');
    await db.execute(sql`
      UPDATE inventory_history 
      SET user_id = NULL 
      WHERE user_id IN (${sql.join(userIdsToDelete.map(id => sql`${id}`), sql`, `)})
    `);
    console.log(`   ✓ Updated inventory_history records`);
    
    // Step 2: Nullify changedBy in order_status_history for non-admin users
    console.log('\n🔄 Nullifying user references in order_status_history...');
    await db.execute(sql`
      UPDATE order_status_history 
      SET changed_by = NULL 
      WHERE changed_by IN (${sql.join(userIdsToDelete.map(id => sql`${id}`), sql`, `)})
    `);
    console.log(`   ✓ Updated order_status_history records`);
    
    // Step 3: Nullify userId in support_tickets for non-admin users
    console.log('\n🔄 Nullifying user references in support_tickets...');
    await db.execute(sql`
      UPDATE support_tickets 
      SET user_id = NULL 
      WHERE user_id IN (${sql.join(userIdsToDelete.map(id => sql`${id}`), sql`, `)})
    `);
    console.log(`   ✓ Updated support_tickets records`);
    
    // Step 4: Delete orders associated with non-admin users
    console.log('\n🔄 Deleting orders associated with non-admin users...');
    await db
      .delete(orders)
      .where(
        and(
          isNotNull(orders.userId),
          inArray(orders.userId, userIdsToDelete)
        )
      );
    console.log(`   ✓ Deleted orders for ${userIdsToDelete.length} user(s)`);
    
    // Step 5: Delete non-admin users (this will cascade to related tables)
    console.log('\n🔄 Deleting non-admin users...');
    await db
      .delete(users)
      .where(inArray(users.id, userIdsToDelete));
    
    console.log(`   ✓ Deleted ${userIdsToDelete.length} non-admin user(s)`);
    console.log('\n✅ Successfully deleted all non-admin users and their associated data!');
    console.log('\nDeleted data includes:');
    console.log('   - User accounts');
    console.log('   - Orders and order items');
    console.log('   - User addresses');
    console.log('   - Wishlists');
    console.log('   - Product reviews');
    console.log('   - Cart items');
    console.log('   - Other user-related data (cascaded)');
    console.log('\nNullified references in:');
    console.log('   - Inventory history (preserved for audit trail)');
    console.log('   - Order status history (preserved for audit trail)');
    console.log('   - Support tickets (preserved for records)');
    
  } catch (error) {
    console.error('❌ Error deleting non-admin users:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Delete Non-Admin Users Script');
    console.log('================================\n');
    
    await deleteNonAdminUsers();
    
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Script execution failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { deleteNonAdminUsers };
