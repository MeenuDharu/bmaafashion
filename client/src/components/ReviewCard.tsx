import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, MoreVertical, Edit, Trash2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StarRating } from "./StarRating";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProductReview } from "@shared/schema";

interface ReviewCardProps {
  review: ProductReview & {
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    } | null;
  };
  currentUserId?: string;
  currentUserRole?: string;
  onEdit?: (review: ProductReview) => void;
  onDelete?: (reviewId: string) => void;
  onHelpfulUpdate?: () => void;
}

export function ReviewCard({
  review,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
  onHelpfulUpdate
}: ReviewCardProps) {
  const { toast } = useToast();
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes);
  const [isMarkingHelpful, setIsMarkingHelpful] = useState(false);

  const isOwnReview = currentUserId === review.userId;
  const canDelete = isOwnReview || currentUserRole === 'admin';
  const canEdit = isOwnReview;

  const handleMarkHelpful = async () => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to mark reviews as helpful",
        variant: "destructive"
      });
      return;
    }

    setIsMarkingHelpful(true);
    try {
      const response = await apiRequest('POST', `/api/reviews/${review.id}/helpful`);
      const data = await response.json();
      
      setHelpfulVotes(data.helpfulVotes);
      onHelpfulUpdate?.();
      
      toast({
        title: "Thank you!",
        description: "Review marked as helpful"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark review as helpful",
        variant: "destructive"
      });
    } finally {
      setIsMarkingHelpful(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(review);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await apiRequest('DELETE', `/api/reviews/${review.id}`);
      
      onDelete?.(review.id);
      
      toast({
        title: "Success",
        description: "Review deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to delete review",
        variant: "destructive"
      });
    }
  };

  const getUserDisplayName = () => {
    if (review.user?.firstName && review.user?.lastName) {
      return `${review.user.firstName} ${review.user.lastName}`;
    } else if (review.user?.firstName) {
      return review.user.firstName;
    }
    return "Anonymous User";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full" data-testid={`review-card-${review.id}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.user?.profileImageUrl} />
              <AvatarFallback className="text-sm">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm" data-testid="reviewer-name">
                  {getUserDisplayName()}
                </span>
                {review.isVerifiedPurchase && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" data-testid="review-rating" />
                <span className="text-xs text-muted-foreground" data-testid="review-date">
                  {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'Unknown date'}
                </span>
              </div>
            </div>
          </div>
          
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="review-menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit} data-testid="edit-review">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Review
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete} 
                    className="text-destructive"
                    data-testid="delete-review"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Review
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {review.title && (
          <h4 className="font-medium mb-2" data-testid="review-title">
            {review.title}
          </h4>
        )}
        {review.review && (
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="review-text">
            {review.review}
          </p>
        )}
        
        {review.images && review.images.length > 0 && (
          <div className="flex gap-2 mt-3">
            {review.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-16 h-16 rounded-md object-cover border"
                data-testid={`review-image-${index}`}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkHelpful}
            disabled={isMarkingHelpful || !currentUserId}
            className="gap-2"
            data-testid="helpful-button"
          >
            <ThumbsUp className="h-4 w-4" />
            Helpful ({helpfulVotes})
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}