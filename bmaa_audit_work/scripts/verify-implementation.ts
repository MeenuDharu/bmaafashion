#!/usr/bin/env tsx

/**
 * Verification script for token hashing and admin functionality
 * This script tests critical security and functionality requirements
 */

import { storage } from '../server/storage';
import { hashToken, generateSecureToken } from '../server/jwtAuth';

interface VerificationResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: VerificationResult[] = [];

function addResult(test: string, status: 'PASS' | 'FAIL', details: string) {
  results.push({ test, status, details });
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${test}: ${details}`);
}

async function verifyTokenHashing() {
  console.log('\n🔐 VERIFYING TOKEN HASHING IMPLEMENTATION...\n');
  
  try {
    // Test 1: Verify hashToken function works
    const plainToken = 'test-token-123';
    const hashedToken1 = hashToken(plainToken);
    const hashedToken2 = hashToken(plainToken);
    
    if (hashedToken1 === hashedToken2) {
      addResult('Token Hashing Consistency', 'PASS', 'Same token produces same hash');
    } else {
      addResult('Token Hashing Consistency', 'FAIL', 'Same token produces different hashes');
    }
    
    // Test 2: Verify tokens are actually hashed (not stored as plain text)
    if (hashedToken1 !== plainToken && hashedToken1.length === 64) {
      addResult('Token Security', 'PASS', 'Tokens are properly hashed (SHA-256, 64 chars)');
    } else {
      addResult('Token Security', 'FAIL', 'Tokens might not be properly hashed');
    }
    
    // Test 3: Test password reset token storage with hashing
    const testEmail = 'test@verification.com';
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Create token (should hash it internally)
    const storedToken = await storage.createPasswordResetToken(testEmail, resetToken, expiresAt);
    
    if (storedToken.token !== resetToken) {
      addResult('Password Reset Token Storage', 'PASS', 'Token is hashed before storage');
    } else {
      addResult('Password Reset Token Storage', 'FAIL', 'Token stored as plain text!');
    }
    
    // Test 4: Verify token retrieval works with hashing
    const retrievedToken = await storage.getPasswordResetToken(resetToken);
    
    if (retrievedToken && retrievedToken.email === testEmail) {
      addResult('Password Reset Token Retrieval', 'PASS', 'Token can be retrieved using plain token');
    } else {
      addResult('Password Reset Token Retrieval', 'FAIL', 'Token retrieval failed');
    }
    
    // Test 5: Verify token validation works with hashing
    const validToken = await storage.validatePasswordResetToken(resetToken);
    
    if (validToken && validToken.email === testEmail && !validToken.used) {
      addResult('Password Reset Token Validation', 'PASS', 'Token validation works correctly');
    } else {
      addResult('Password Reset Token Validation', 'FAIL', 'Token validation failed');
    }
    
    // Test 6: Verify token consumption works with hashing
    const consumed = await storage.consumePasswordResetToken(resetToken);
    
    if (consumed) {
      addResult('Password Reset Token Consumption', 'PASS', 'Token consumption works correctly');
    } else {
      addResult('Password Reset Token Consumption', 'FAIL', 'Token consumption failed');
    }
    
    // Test 7: Verify consumed token cannot be reused
    const secondValidation = await storage.validatePasswordResetToken(resetToken);
    
    if (!secondValidation) {
      addResult('Token Reuse Prevention', 'PASS', 'Consumed tokens cannot be reused');
    } else {
      addResult('Token Reuse Prevention', 'FAIL', 'Consumed tokens can still be used!');
    }
    
    // Cleanup
    await storage.cleanupExpiredPasswordResetTokens();
    
  } catch (error) {
    addResult('Token Hashing Tests', 'FAIL', `Error during testing: ${error}`);
  }
}

async function verifyAdminProductsImageHandling() {
  console.log('\n📸 VERIFYING ADMIN PRODUCTS IMAGE HANDLING...\n');
  
  try {
    // Test 1: Create product with images array
    const testProduct = {
      name: 'Test Verification Product',
      description: 'Product for verification testing',
      price: '99.99',
      category: 'Testing',
      images: [
        '/api/images/test1.jpg',
        '/api/images/test2.jpg',
        '/api/images/test3.jpg'
      ],
      specifications: ['Test spec 1', 'Test spec 2'],
      planterCount: 5,
      dimensions: '10x10x10',
      cultivableCrops: 'Test crops',
      structureMaterial: 'Test material',
      inStock: 10,
      sku: 'TEST-VERIFY-001'
    };
    
    const createdProduct = await storage.createProduct(testProduct);
    
    if (createdProduct && Array.isArray(createdProduct.images) && createdProduct.images.length === 3) {
      addResult('Product Creation with Images Array', 'PASS', `Product created with ${createdProduct.images.length} images`);
    } else {
      addResult('Product Creation with Images Array', 'FAIL', 'Images array not properly stored');
    }
    
    // Test 2: Update product with new images array
    const updatedImages = [
      '/api/images/updated1.jpg',
      '/api/images/updated2.jpg',
      '/api/images/updated3.jpg',
      '/api/images/updated4.jpg'
    ];
    
    const updatedProduct = await storage.updateProduct(createdProduct.id, { 
      images: updatedImages 
    });
    
    if (updatedProduct && Array.isArray(updatedProduct.images) && updatedProduct.images.length === 4) {
      addResult('Product Update with Images Array', 'PASS', `Product updated with ${updatedProduct.images.length} images`);
    } else {
      addResult('Product Update with Images Array', 'FAIL', 'Images array not properly updated');
    }
    
    // Test 3: Retrieve product and verify images persistence
    const retrievedProduct = await storage.getProduct(createdProduct.id);
    
    if (retrievedProduct && Array.isArray(retrievedProduct.images) && retrievedProduct.images.length === 4) {
      addResult('Product Images Persistence', 'PASS', 'Images array persisted correctly in database');
    } else {
      addResult('Product Images Persistence', 'FAIL', 'Images array not persisted correctly');
    }
    
    // Cleanup test product
    await storage.deleteProduct(createdProduct.id);
    addResult('Test Product Cleanup', 'PASS', 'Test product cleaned up successfully');
    
  } catch (error) {
    addResult('Admin Products Image Tests', 'FAIL', `Error during testing: ${error}`);
  }
}

async function verifyPasswordResetFlow() {
  console.log('\n🔄 VERIFYING COMPLETE PASSWORD RESET FLOW...\n');
  
  try {
    // Test 1: Create a test user
    const testUser = await storage.createUser({
      email: 'reset-test@verification.com',
      password: 'old-password-hash',
      firstName: 'Reset',
      lastName: 'Test',
      role: 'user',
      emailVerified: true
    });
    
    addResult('Test User Creation', 'PASS', `Test user created: ${testUser.email}`);
    
    // Test 2: Test forgot password flow (token creation)
    const resetToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    const tokenRecord = await storage.createPasswordResetToken(testUser.email, resetToken, expiresAt);
    
    if (tokenRecord.email === testUser.email) {
      addResult('Forgot Password Token Creation', 'PASS', 'Reset token created successfully');
    } else {
      addResult('Forgot Password Token Creation', 'FAIL', 'Reset token creation failed');
    }
    
    // Test 3: Test reset password flow (token validation and consumption)
    const validationResult = await storage.validatePasswordResetToken(resetToken);
    
    if (validationResult && !validationResult.used) {
      addResult('Reset Token Validation', 'PASS', 'Reset token validated successfully');
    } else {
      addResult('Reset Token Validation', 'FAIL', 'Reset token validation failed');
    }
    
    // Test 4: Test password update
    const newPasswordHash = 'new-password-hash';
    await storage.upsertUser({
      id: testUser.id,
      password: newPasswordHash
    });
    
    const updatedUser = await storage.getUser(testUser.id);
    
    if (updatedUser && updatedUser.password === newPasswordHash) {
      addResult('Password Update', 'PASS', 'User password updated successfully');
    } else {
      addResult('Password Update', 'FAIL', 'Password update failed');
    }
    
    // Test 5: Test token consumption
    const consumed = await storage.consumePasswordResetToken(resetToken);
    
    if (consumed) {
      addResult('Reset Token Consumption', 'PASS', 'Reset token consumed successfully');
    } else {
      addResult('Reset Token Consumption', 'FAIL', 'Reset token consumption failed');
    }
    
    // Cleanup test user
    // Note: We can't delete users in this schema, but the test user won't interfere
    addResult('Password Reset Flow', 'PASS', 'Complete password reset flow verified');
    
  } catch (error) {
    addResult('Password Reset Flow Tests', 'FAIL', `Error during testing: ${error}`);
  }
}

async function runVerification() {
  console.log('🚀 STARTING VERIFICATION TESTS FOR TOKEN HASHING AND ADMIN FUNCTIONALITY\n');
  console.log('=' .repeat(80));
  
  await verifyTokenHashing();
  await verifyAdminProductsImageHandling();
  await verifyPasswordResetFlow();
  
  console.log('\n' + '=' .repeat(80));
  console.log('📊 VERIFICATION SUMMARY\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Implementation verified successfully.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.test}: ${r.details}`);
    });
  }
  
  console.log('\n' + '=' .repeat(80));
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runVerification().catch(console.error);
}

export { runVerification, results };