import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { ReviewSummary } from "./ReviewSummary";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Plus } from "lucide-react";
import type { ProductReview } from "@shared/schema";

interface ProductReviewsProps {
  productId: string;
  currentUserId?: string;
  currentUserRole?: string;
}

type SortOption = "newest" | "oldest" | "highest" | "lowest" | "helpful";

export function ProductReviews({ productId, currentUserId, currentUserRole }: ProductReviewsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  
  const reviewsPerPage = 5;

  // Fetch reviews
  const { 
    data: reviewsData, 
    isLoading: reviewsLoading, 
    error: reviewsError 
  } = useQuery({
    queryKey: ['/api/products', productId, 'reviews', currentPage, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: reviewsPerPage.toString(),
        sort: sortBy
      });
      
      const response = await fetch(`/api/products/${productId}/reviews?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
  });

  // Fetch rating summary
  const { 
    data: ratingData, 
    isLoading: ratingLoading, 
    error: ratingError 
  } = useQuery({
    queryKey: ['/api/products', productId, 'rating'],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/rating`);
      if (!response.ok) throw new Error('Failed to fetch rating');
      return response.json();
    },
  });

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    
    // Invalidate and refetch reviews and rating data
    queryClient.invalidateQueries({ 
      queryKey: ['/api/products', productId, 'reviews'] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['/api/products', productId, 'rating'] 
    });
  };

  const handleEditReview = (review: ProductReview) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ 
      queryKey: ['/api/products', productId, 'reviews'] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['/api/products', productId, 'rating'] 
    });
  };

  const handleHelpfulUpdate = () => {
    // Refetch reviews to update helpful counts
    queryClient.invalidateQueries({ 
      queryKey: ['/api/products', productId, 'reviews'] 
    });
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleCancelForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  // Check if user has already reviewed this product
  const userHasReviewed = reviewsData?.reviews?.some(
    (review: any) => review.userId === currentUserId
  );

  const canWriteReview = currentUserId && !userHasReviewed && !showReviewForm;

  if (reviewsError || ratingError) {
    return (
      <div className="space-y-6" data-testid="product-reviews">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load reviews. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="product-reviews">
      {/* Rating Summary */}
      <div>
        {ratingLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : ratingData ? (
          <ReviewSummary
            averageRating={ratingData.averageRating}
            totalReviews={ratingData.totalReviews}
            starDistribution={ratingData.starDistribution}
          />
        ) : null}
      </div>

      <Separator />

      {/* Write Review Button / Form */}
      {showReviewForm ? (
        <ReviewForm
          productId={productId}
          existingReview={editingReview || undefined}
          onSuccess={handleReviewSuccess}
          onCancel={handleCancelForm}
        />
      ) : canWriteReview ? (
        <div className="text-center py-6">
          <Button 
            onClick={() => setShowReviewForm(true)}
            className="gap-2"
            data-testid="write-review-button"
          >
            <Plus className="h-4 w-4" />
            Write a Review
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Share your experience with this product
          </p>
        </div>
      ) : currentUserId && userHasReviewed ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            You have already reviewed this product
          </p>
        </div>
      ) : !currentUserId ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">
            Please log in to write a review
          </p>
        </div>
      ) : null}

      {/* Reviews Section */}
      {reviewsData?.reviews && reviewsData.reviews.length > 0 && (
        <>
          <Separator />
          
          {/* Sort Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Reviews ({reviewsData.pagination.total})
            </h3>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40" data-testid="sort-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewsLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                </div>
              ))
            ) : (
              reviewsData.reviews.map((review: any) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                  onHelpfulUpdate={handleHelpfulUpdate}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {reviewsData.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || reviewsLoading}
                data-testid="prev-page"
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-2" data-testid="page-info">
                Page {currentPage} of {reviewsData.pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(reviewsData.pagination.pages, prev + 1))}
                disabled={currentPage === reviewsData.pagination.pages || reviewsLoading}
                data-testid="next-page"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {reviewsData?.reviews && reviewsData.reviews.length === 0 && !showReviewForm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No reviews yet for this product
          </p>
          {canWriteReview && (
            <Button 
              onClick={() => setShowReviewForm(true)}
              className="gap-2"
              data-testid="first-review-button"
            >
              <Plus className="h-4 w-4" />
              Be the First to Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}