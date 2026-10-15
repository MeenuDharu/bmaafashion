/**
 * Utility functions for product size handling
 */

// Categories that require size selection
export const SIZE_REQUIRED_CATEGORIES = [
  "Kurti Set",
  "Short Kurti",
  "Traditional Kurti",
  "Cotton Kurti",
  "Coord Set",
  "Maxi",
  "Skirt",
  "Party Wear",
  "Plus Size Collection",
  "Dress",
  "Gown",
  "Lehenga",
  "Saree Blouse",
  "Top",
  "Bottom",
  "Jumpsuit",
  "Romper",
];

/**
 * Check if a product category requires size selection
 * @param category - Product category name
 * @returns true if size is required for this category
 */
export const isSizeRequired = (category: string): boolean => {
  if (!category) return false;
  return SIZE_REQUIRED_CATEGORIES.some(cat => 
    category.toLowerCase().includes(cat.toLowerCase())
  );
};

/**
 * Parse size string from product into array of available sizes
 * @param sizeString - Size string from product (e.g., "S, M, L, XL" or "32, 34, 36")
 * @returns Array of size options
 */
export const parseSizes = (sizeString: string | null | undefined): string[] => {
  if (!sizeString || sizeString.trim() === '') {
    return [];
  }
  
  // Split by common delimiters: comma, slash, pipe, or dash
  return sizeString
    .split(/[,/|\-]/)
    .map(size => size.trim())
    .filter(size => size.length > 0);
};

/**
 * Get default/fallback sizes for clothing products
 * @returns Array of standard clothing sizes
 */
export const getDefaultSizes = (): string[] => {
  return ["S", "M", "L", "XL", "XXL"];
};

/**
 * Validate if a size selection is valid for a product
 * @param product - Product object
 * @param selectedSize - Selected size string
 * @returns Validation result with error message if invalid
 */
export const validateSizeSelection = (
  product: { category: string; size?: string | null },
  selectedSize: string | undefined
): { valid: boolean; error?: string } => {
  const sizeRequired = isSizeRequired(product.category);
  
  if (!sizeRequired) {
    return { valid: true };
  }
  
  if (!selectedSize || selectedSize.trim() === '') {
    return {
      valid: false,
      error: 'Please select a size before adding to cart'
    };
  }
  
  return { valid: true };
};
