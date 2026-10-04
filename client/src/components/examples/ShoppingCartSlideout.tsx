import { useState } from 'react';
import ShoppingCartSlideout from '../ShoppingCartSlideout';
import { Button } from "@/components/ui/button";
import nftKitImage from "@assets/IMG_0204_1762416716371.jpg";
import dutchBucketImage from "@assets/IMG_0237_1762416768011.jpg";

export default function ShoppingCartSlideoutExample() {
  const [isOpen, setIsOpen] = useState(false);
  //TODO: remove mock functionality
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: "NFT Flat Bed Kit (Medium)",
      description: "Complete hydroponic growing system",
      price: "25000",
      category: "Home Grower Kit",
      image: nftKitImage,
      specifications: [],
      planterCount: 114,
      dimensions: "9.8 x 4.2 x 2.7 ft",
      cultivableCrops: "Leafy greens",
      structureMaterial: "ABS coated pipe",
      inStock: 5,
      quantity: 2,
    },
    {
      id: "2",
      name: "Dutch Bucket Kit (Medium)",
      description: "Perfect for vine crops and vegetables",
      price: "15000",
      category: "Home Grower Kit",
      image: dutchBucketImage,
      specifications: [],
      planterCount: 10,
      dimensions: "4 x 2 x 0.8 ft",
      cultivableCrops: "Vegetables, vine crops",
      structureMaterial: "MS tube",
      inStock: 3,
      quantity: 1,
    }
  ]);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(items => items.filter(item => item.id !== productId));
    } else {
      setCartItems(items => 
        items.map(item => 
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(items => items.filter(item => item.id !== productId));
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Open Cart Example
      </Button>
      
      <ShoppingCartSlideout
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => console.log('Checkout clicked')}
      />
    </div>
  );
}