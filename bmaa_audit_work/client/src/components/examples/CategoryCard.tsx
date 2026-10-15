import CategoryCard from '../CategoryCard';
import { safeImageImport } from "@/lib/image-utils";

const nftKitImage = safeImageImport("/attached_assets/bmaafashion.jpeg");

export default function CategoryCardExample() {
  return (
    <div className="max-w-sm">
      <CategoryCard
        title="Home Grower Kits"
        description="Complete hydroponic systems perfect for home gardening enthusiasts. Easy setup and maintenance."
        image={nftKitImage}
        productCount={8}
        onClick={() => console.log('Category clicked: Home Grower Kits')}
      />
    </div>
  );
}