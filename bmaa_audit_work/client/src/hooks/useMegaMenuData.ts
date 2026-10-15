import { useQuery } from "@tanstack/react-query";
import type { MegaMenuCategory } from "@/components/MegaMenu";

interface Category {
  id: string;
  mainCategory: string;
  subcategories: string[];
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Product {
  id: string;
  name: string;
  mainCategory: string;
  category: string;
  price: number;
  images?: string[];
}

/**
 * Custom hook to fetch and transform categories and products into mega menu format
 */
export function useMegaMenuData() {
  // Fetch categories from the database
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch products from the database
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Transform database data into mega menu format
  const megaMenuCategories: MegaMenuCategory[] = categories.map((category) => {
    // Create featured section if category has image
    const featured = category.imageUrl
      ? {
          title: `Explore ${category.mainCategory}`,
          subtitle: category.description || `Discover our ${category.mainCategory.toLowerCase()} collection`,
          image: category.imageUrl,
          link: `/products?category=${encodeURIComponent(category.mainCategory)}`,
        }
      : undefined;

    return {
      name: category.mainCategory,
      path: `/products?category=${encodeURIComponent(category.mainCategory)}`,
      subcategories: category.subcategories.length > 0 ? category.subcategories : undefined,
      featured,
    };
  });

  // Add "Offers" category at the end
  megaMenuCategories.push({
    name: "Offers",
    path: "/products?sale=true",
  });

  return {
    categories: megaMenuCategories,
    isLoading: categoriesLoading || productsLoading,
  };
}
