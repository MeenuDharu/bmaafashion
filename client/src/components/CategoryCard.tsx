import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  productCount: number;
  onClick?: () => void;
}

export default function CategoryCard({ title, description, image, productCount, onClick }: CategoryCardProps) {
  return (
    <Card 
      className="hover-elevate group cursor-pointer overflow-hidden transition-all duration-300"
      onClick={onClick}
      data-testid={`card-category-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
        
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-primary font-medium">
            {productCount} Products
          </span>
        </div>
      </CardContent>
    </Card>
  );
}