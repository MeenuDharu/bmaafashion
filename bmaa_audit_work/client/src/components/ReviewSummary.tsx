import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./StarRating";

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  starDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  starDistribution
}: ReviewSummaryProps) {
  if (totalReviews === 0) {
    return (
      <Card data-testid="review-summary">
        <CardHeader>
          <CardTitle className="text-lg">Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to review this product
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="review-summary">
      <CardHeader>
        <CardTitle className="text-lg">Customer Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold" data-testid="average-rating">
              {averageRating.toFixed(1)}
            </div>
            <StarRating 
              rating={averageRating} 
              size="md" 
              className="justify-center mt-1"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground" data-testid="total-reviews">
              Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Star Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starDistribution[stars as keyof typeof starDistribution];
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm">{stars}</span>
                  <StarRating rating={1} maxRating={1} size="sm" />
                </div>
                <Progress 
                  value={percentage} 
                  className="flex-1 h-2"
                  data-testid={`star-${stars}-progress`}
                />
                <span className="text-sm text-muted-foreground w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">
              {Math.round((starDistribution[5] + starDistribution[4]) / totalReviews * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Recommend this</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold">
              {starDistribution[5]}
            </div>
            <p className="text-xs text-muted-foreground">5-star reviews</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}