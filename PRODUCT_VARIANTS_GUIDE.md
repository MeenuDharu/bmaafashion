# Product Variants System Guide

## Overview

This guide explains the product variants system that allows managing products with multiple color and size combinations, each with individual stock levels and prices.

## Database Schema

### Product Variants Table

The `product_variants` table stores individual variants of a product:

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  sku VARCHAR UNIQUE,
  color VARCHAR,
  size VARCHAR,
  price DECIMAL(10,2),
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Key Features

1. **Individual Stock Management**: Each variant has its own stock quantity
2. **Flexible Pricing**: Variants can have different prices (e.g., XL might cost more)
3. **Unique SKUs**: Each variant gets a unique SKU for inventory tracking
4. **Active Status**: Variants can be enabled/disabled without deletion

## How It Works

### Product Creation

1. Create a base product with general information
2. Add variants with specific color/size combinations
3. Each variant gets its own stock and price

### Stock Management

- Stock is tracked at the variant level
- Cart items reference specific variants
- Orders track which variant was purchased

### Pricing

- Base product price is used as default
- Variants can override with custom prices
- Useful for size-based pricing (S/M/L same price, XL/XXL higher)

## API Endpoints

### Get Product Variants

```
GET /api/products/:productId/variants
```

### Create Variant

```
POST /api/admin/products/:productId/variants
Body: { color, size, price, stockQuantity, sku }
```

### Update Variant

```
PUT /api/admin/products/variants/:variantId
Body: { price, stockQuantity, isActive }
```

### Delete Variant

```
DELETE /api/admin/products/variants/:variantId
```

## Frontend Usage

### Admin Panel

- Manage variants in the product edit dialog
- Add/edit/delete variants
- View stock levels per variant
- Bulk operations for variants

### Product Detail Page

- Display available colors and sizes
- Show stock status per variant
- Update price when variant is selected
- Add specific variant to cart

### Cart

- Store variant information with cart items
- Display color/size in cart
- Validate stock at variant level

## Migration from Current System

If you have existing products with `size` and `colors` fields:

1. Products without variants continue to work as before
2. When variants are added, they take precedence
3. Legacy size/color fields can be used as templates for creating variants

## Best Practices

1. **SKU Format**: Use format like `PROD-COLOR-SIZE` (e.g., `DRESS-001-RED-M`)
2. **Stock Alerts**: Set low stock thresholds per variant
3. **Pricing Strategy**: Keep consistent pricing within size groups
4. **Images**: Consider variant-specific images for different colors
5. **Availability**: Mark variants as inactive instead of deleting

## Example Workflow

### Creating a Dress with Variants

1. Create base product:
   - Name: "Summer Floral Dress"
   - Description: "Beautiful summer dress"
   - Base Price: ₹1,999

2. Add variants:
   - Red, S: ₹1,999, Stock: 10
   - Red, M: ₹1,999, Stock: 15
   - Red, L: ₹1,999, Stock: 12
   - Blue, S: ₹1,999, Stock: 8
   - Blue, M: ₹1,999, Stock: 20
   - Blue, L: ₹1,999, Stock: 10

3. Customer selects:
   - Color: Blue
   - Size: M
   - Adds to cart: Blue-M variant with stock check

## Future Enhancements

- Variant-specific images
- Bulk variant creation from CSV
- Variant performance analytics
- Automatic SKU generation
- Size charts per product category
