import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showRating?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showRating = false,
  interactive = false,
  onRatingChange,
  className
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxRating; i++) {
      const filled = rating >= i;
      const halfFilled = rating >= i - 0.5 && rating < i;
      
      stars.push(
        <button
          key={i}
          type="button"
          className={cn(
            "text-muted-foreground transition-colors",
            interactive && "hover:text-yellow-400 cursor-pointer",
            !interactive && "cursor-default",
            filled && "text-yellow-400 fill-yellow-400",
            halfFilled && "text-yellow-400"
          )}
          onClick={() => handleStarClick(i)}
          disabled={!interactive}
          data-testid={`star-${i}`}
        >
          {halfFilled ? (
            <StarHalf className={sizeClasses[size]} />
          ) : (
            <Star className={cn(sizeClasses[size], filled && "fill-current")} />
          )}
        </button>
      );
    }
    
    return stars;
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showRating && (
        <span className="text-sm text-muted-foreground ml-1" data-testid="rating-value">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}