# Image Fallback System

## Overview

This project now includes a robust image fallback system that prevents the site from crashing when image files are missing. Instead of breaking the build, missing images are automatically replaced with placeholder images.

## How It Works

### 1. Image Utility Module

Located at [`client/src/lib/image-utils.ts`](client/src/lib/image-utils.ts), this module provides:

- **`PLACEHOLDER_IMAGE`**: A base64-encoded SVG placeholder that displays "Image Not Available"
- **`safeImageImport(path)`**: Safely imports images with automatic fallback to placeholder
- **`handleImageError(e)`**: React event handler for `<img>` tags to handle runtime load errors
- **`getImageUrl(key)`**: Get predefined common image URLs with fallback support

### 2. Usage Examples

#### Basic Image Import

```tsx
import { safeImageImport, handleImageError } from "@/lib/image-utils";

// Import with fallback
const myImage = safeImageImport("/attached_assets/my-image.jpg");

// Use in component
<img
  src={myImage}
  alt="Description"
  onError={handleImageError} // Handles runtime errors
/>;
```

#### Using Predefined Images

```tsx
import { getImageUrl, handleImageError } from "@/lib/image-utils";

const logo = getImageUrl("logo");

<img src={logo} alt="Logo" onError={handleImageError} />;
```

### 3. Predefined Image Paths

The following common images are predefined in `IMAGE_PATHS`:

- `logo`: `/attached_assets/bmaafashion.jpeg`
- `heroImage`: `/attached_assets/bmaafashion.jpeg`
- `heroicImage`: `/attached_assets/heroicimage.png`
- `banner1`: `/attached_assets/banner1.jpeg`
- `banner2`: `/attached_assets/banner2.jpeg`
- `banner3`: `/attached_assets/banner3.jpeg`

## Updated Files

The following files have been updated to use the new fallback system:

### Pages

- ✅ `client/src/pages/About.tsx`
- ✅ `client/src/pages/Login.tsx`
- ✅ `client/src/pages/Register.tsx`
- ✅ `client/src/pages/ForgotPassword.tsx`
- ✅ `client/src/pages/ResetPassword.tsx`
- ✅ `client/src/pages/VerifyEmail.tsx`
- ✅ `client/src/pages/EmailVerificationPending.tsx`

### Components

- ✅ `client/src/components/Header.tsx`
- ✅ `client/src/components/HeroSection.tsx`
- ✅ `client/src/components/examples/CategoryCard.tsx`
- ✅ `client/src/components/examples/ProductCard.tsx`
- ✅ `client/src/components/examples/ShoppingCartSlideout.tsx`

## Benefits

1. **No Build Failures**: Missing images won't break the build process
2. **Graceful Degradation**: Users see a placeholder instead of broken images
3. **Developer Friendly**: Clear console warnings when images are missing
4. **Runtime Safety**: `onError` handlers catch images that fail to load at runtime
5. **Easy Maintenance**: Centralized image management in one utility file

## Adding New Images

When adding new images to the project:

1. Place images in the `attached_assets/` directory
2. Import using `safeImageImport()`:
   ```tsx
   const newImage = safeImageImport("/attached_assets/new-image.jpg");
   ```
3. Always add `onError={handleImageError}` to `<img>` tags
4. Optionally add to `IMAGE_PATHS` if it's a commonly used image

## Troubleshooting

### Image Not Displaying

1. Check the browser console for warnings about missing images
2. Verify the image path is correct (relative to `attached_assets/`)
3. Ensure the image file exists in the `attached_assets/` directory
4. Check that `onError={handleImageError}` is added to the `<img>` tag

### Placeholder Showing Instead of Image

1. The image file doesn't exist at the specified path
2. The image path is incorrect
3. Check console warnings for the exact path being attempted

## Migration from Old System

**Before:**

```tsx
import heroImage from "@assets/IMG_0150_1762417364567_optimized.jpg";
```

**After:**

```tsx
import { safeImageImport, handleImageError } from "@/lib/image-utils";

const heroImage = safeImageImport("/attached_assets/bmaafashion.jpeg");

// In JSX:
<img src={heroImage} alt="Hero" onError={handleImageError} />;
```

## Technical Details

- The placeholder is a data URL SVG, so it requires no external files
- Images are resolved at build time when possible
- Runtime errors are caught by the `onError` handler
- Console warnings help developers identify missing images during development
