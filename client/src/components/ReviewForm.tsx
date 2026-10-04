import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StarRating } from "./StarRating";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProductReview } from "@shared/schema";

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5, "Rating cannot exceed 5 stars"),
  title: z.string().optional(),
  review: z.string().min(10, "Review must be at least 10 characters long").max(1000, "Review cannot exceed 1000 characters"),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  productId: string;
  existingReview?: ProductReview;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({ 
  productId, 
  existingReview, 
  onSuccess, 
  onCancel,
  className 
}: ReviewFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingReview;

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      title: existingReview?.title || "",
      review: existingReview?.review || "",
    },
  });

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        // Update existing review
        await apiRequest('PUT', `/api/reviews/${existingReview.id}`, data);
        
        toast({
          title: "Review Updated",
          description: "Your review has been updated successfully",
        });
      } else {
        // Create new review
        await apiRequest('POST', `/api/products/${productId}/reviews`, data);
        
        toast({
          title: "Review Submitted",
          description: "Thank you for your review! It has been submitted successfully",
        });
      }
      
      onSuccess?.();
      
      if (!isEditing) {
        form.reset();
      }
    } catch (error: any) {
      let errorMessage = "Failed to submit review";
      
      if (error.message?.includes("already reviewed")) {
        errorMessage = "You have already reviewed this product";
      } else if (error.message?.includes("not found")) {
        errorMessage = "Product not found";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className} data-testid="review-form">
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? "Edit Your Review" : "Write a Review"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="pt-2">
                      <StarRating
                        rating={field.value}
                        interactive
                        size="lg"
                        onRatingChange={field.onChange}
                        data-testid="rating-input"
                      />
                      {field.value > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {field.value} out of 5 stars
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summarize your experience..."
                      {...field}
                      data-testid="title-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Review Text */}
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your experience with this product..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="review-input"
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/1000 characters
                  </div>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                data-testid="submit-review"
              >
                {isSubmitting 
                  ? (isEditing ? "Updating..." : "Submitting...") 
                  : (isEditing ? "Update Review" : "Submit Review")
                }
              </Button>
              
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  data-testid="cancel-review"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}