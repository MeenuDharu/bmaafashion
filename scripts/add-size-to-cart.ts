import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

async function addSizeColumn() {
  try {
    console.log('🔄 Adding size column to cart_items table...');
    
    // Add size column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE cart_items 
      ADD COLUMN IF NOT EXISTS size TEXT;
    `);
    
    console.log('✅ Size column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding size column:', error);
    process.exit(1);
  }
}

addSizeColumn();
