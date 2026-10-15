/**
 * Image utility functions for handling missing images gracefully
 */

// Fallback placeholder image - using data URL to ensure it always works
export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect fill='%23f3f4f6' width='800' height='600'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EImage Not Available%3C/text%3E%3C/svg%3E";

/**
 * Safely import an image with fallback to placeholder
 * @param path - Path to the image (e.g., "/attached_assets/image.jpg")
 * @returns Image URL or placeholder
 */
export function safeImageImport(path: string): string {
  try {
    // Try to resolve the image from public/attached_assets
    return new URL(path, import.meta.url).href;
  } catch (e) {
    console.warn(`Image not found: ${path}, using placeholder`);
    return PLACEHOLDER_IMAGE;
  }
}

/**
 * Handle image load errors by replacing with placeholder
 * @param e - React synthetic event
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  e.currentTarget.src = PLACEHOLDER_IMAGE;
}

/**
 * Common image paths mapped to their fallback locations
 */
export const IMAGE_PATHS = {
  logo: "/attached_assets/bmaafashion.jpeg",
  heroImage: "/attached_assets/bmaafashion.jpeg",
  heroicImage: "/attached_assets/heroicimage.png",
  banner1: "/attached_assets/banner1.jpeg",
  banner2: "/attached_assets/banner2.jpeg",
  banner3: "/attached_assets/banner3.jpeg",
} as const;

/**
 * Get a safe image URL from the common paths
 */
export function getImageUrl(key: keyof typeof IMAGE_PATHS): string {
  return safeImageImport(IMAGE_PATHS[key]);
}
