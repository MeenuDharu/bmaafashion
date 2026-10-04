import ProductCard from '../ProductCard';
import { safeImageImport } from "@/lib/image-utils";

const nftKitImage = safeImageImport("/attached_assets/bmaafashion.jpeg");

export default function ProductCardExample() {
  //TODO: remove mock functionality
  const mockProduct = {
    id: "1",
    name: "NFT Flat Bed Kit (Medium)",
    description: "Complete hydroponic growing system perfect for leafy greens and herbs. Includes all components for immediate setup.",
    price: "25000",
    category: "Home Grower Kit",
    image: nftKitImage,
    specifications: ["ABS coated pipe", "Double layer UPVC channels"],
    planterCount: 114,
    dimensions: "9.8 x 4.2 x 2.7 ft",
    cultivableCrops: "Leafy greens",
    structureMaterial: "ABS coated pipe",
    inStock: 5,
  };

  return (
    <div className="max-w-sm">
      <ProductCard 
        product={mockProduct}
        onAddToCart={(id) => console.log('Added to cart:', id)}
        onViewDetails={(id) => console.log('View details:', id)}
      />
    </div>
  );
}