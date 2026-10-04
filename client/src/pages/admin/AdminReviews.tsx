import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AdminLayout } from "@/components/AdminLayout";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Star, 
  Search, 
  Filter,
  Eye,
  Trash2,
  Flag,
  CheckCircle,
  XCircle,
  TrendingUp,
  MessageCircle,
  Calendar,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useAuthenticatedFetch } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { ProductReview } from "@shared/schema";

interface ReviewWithDetails extends ProductReview {
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    email?: string;
  };
  product?: {
    id: string;
    name: string;
    images?: string[];
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  pendingModeration: number;
  flaggedReviews: number;
  recentReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export default function AdminReviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "flagged">("all");
  const [ratingFilter, setRatingFilter] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [selectedReview, setSelectedReview] = useState<ReviewWithDetails | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  const reviewsPerPage = 20;

  // Fetch review statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ReviewStats>({
    queryKey: ['/api/admin/reviews/stats'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/admin/reviews/stats');
      if (!response.ok) throw new Error('Failed to fetch review stats');
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch reviews with filters
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/admin/reviews', currentPage, statusFilter, ratingFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: reviewsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(ratingFilter !== 'all' && { rating: ratingFilter }),
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await authenticatedFetch(`/api/admin/reviews?${params}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await authenticatedFetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete review');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews/stats'] });
      toast({ title: "Review deleted successfully" });
      setDeleteReviewId(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Flag/unflag review mutation
  const flagReviewMutation = useMutation({
    mutationFn: async ({ reviewId, flagged }: { reviewId: string; flagged: boolean }) => {
      const response = await authenticatedFetch(`/api/admin/reviews/${reviewId}/flag`, {
        method: 'PUT',
        body: JSON.stringify({ flagged }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update review');
      }
      return response.json();
    },
    onSuccess: (_, { flagged }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews/stats'] });
      toast({ 
        title: flagged ? "Review flagged" : "Review unflagged",
        description: flagged ? "Review has been flagged for moderation" : "Review flag has been removed"
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getStatusBadge = (review: ReviewWithDetails) => {
    // This would be based on your moderation system
    // For now, we'll use placeholder logic
    if (review.helpfulVotes !== null && review.helpfulVotes !== undefined && review.helpfulVotes < -5) {
      return <Badge variant="destructive">Flagged</Badge>;
    }
    if (review.isVerifiedPurchase) {
      return <Badge variant="secondary">Verified</Badge>;
    }
    return <Badge variant="outline">Public</Badge>;
  };

  const getUserDisplayName = (user?: { firstName?: string; lastName?: string }) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return user.firstName;
    }
    return "Anonymous User";
  };

  if (statsLoading || reviewsLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination || { total: 0, pages: 1 };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Review Management</h1>
            <p className="text-muted-foreground">
              Manage customer reviews and ratings
            </p>
          </div>
        </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-reviews">
                {stats.totalReviews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold" data-testid="average-rating">
                  {stats.averageRating.toFixed(1)}
                </div>
                <StarRating rating={stats.averageRating} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">
                Overall satisfaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Moderation</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="pending-reviews">
                {stats.pendingModeration}
              </div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Reviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="recent-reviews">
                {stats.recentReviews}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews, products, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-reviews"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={(value: any) => setRatingFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No customer reviews have been submitted yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: ReviewWithDetails) => (
                <div key={review.id} className="border rounded-lg p-4" data-testid={`review-${review.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.user?.profileImageUrl} />
                        <AvatarFallback>
                          {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{getUserDisplayName(review.user)}</span>
                          {getStatusBadge(review)}
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <StarRating rating={review.rating} size="sm" />
                          {review.product && (
                            <span className="text-sm text-muted-foreground">
                              for {review.product.name}
                            </span>
                          )}
                        </div>
                        
                        {review.title && (
                          <h4 className="font-medium mb-1">{review.title}</h4>
                        )}
                        
                        {review.review && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {review.review}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Helpful: {review.helpfulVotes}</span>
                          {review.user?.email && (
                            <span>{review.user.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedReview(review)}
                        data-testid={`view-review-${review.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => flagReviewMutation.mutate({ 
                          reviewId: review.id, 
                          flagged: review.helpfulVotes > -5 
                        })}
                        disabled={flagReviewMutation.isPending}
                        data-testid={`flag-review-${review.id}`}
                      >
                        <Flag className={`h-4 w-4 ${review.helpfulVotes < -5 ? 'text-red-500' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteReviewId(review.id)}
                        data-testid={`delete-review-${review.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="prev-page"
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {pagination.pages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                data-testid="next-page"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Modal */}
      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                Full review information and moderation options
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedReview.user?.profileImageUrl} />
                  <AvatarFallback>
                    {selectedReview.user?.firstName?.[0]}{selectedReview.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{getUserDisplayName(selectedReview.user)}</h3>
                  <p className="text-sm text-muted-foreground">{selectedReview.user?.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <StarRating rating={selectedReview.rating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {selectedReview.createdAt && formatDistanceToNow(new Date(selectedReview.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedReview.product && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="font-medium mb-1">Product</h4>
                  <p className="text-sm">{selectedReview.product.name}</p>
                </div>
              )}
              
              {selectedReview.title && (
                <div>
                  <h4 className="font-medium mb-1">Review Title</h4>
                  <p className="text-sm">{selectedReview.title}</p>
                </div>
              )}
              
              {selectedReview.review && (
                <div>
                  <h4 className="font-medium mb-1">Review Content</h4>
                  <p className="text-sm leading-relaxed">{selectedReview.review}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <h4 className="font-medium mb-1">Helpful Votes</h4>
                  <p className="text-sm text-muted-foreground">{selectedReview.helpfulVotes}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Verified Purchase</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedReview.isVerifiedPurchase ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReview(null)}>
                Close
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setDeleteReviewId(selectedReview.id);
                  setSelectedReview(null);
                }}
              >
                Delete Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReviewId && deleteReviewMutation.mutate(deleteReviewId)}
              disabled={deleteReviewMutation.isPending}
              data-testid="confirm-delete-review"
            >
              {deleteReviewMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}