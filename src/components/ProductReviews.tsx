
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, User, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  user_id: string | null;
  product_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  is_verified_buyer: boolean;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ""
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // First, get the reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then, get user profiles for those reviews that have user_id
      const reviewsWithUserInfo = await Promise.all(
        (reviewsData || []).map(async (review) => {
          let user_name = 'Guest User';
          
          if (review.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', review.user_id)
              .single();
            
            if (profileData?.first_name) {
              user_name = `${profileData.first_name} ${profileData.last_name || ''}`.trim();
            }
          }
          
          return {
            ...review,
            user_name
          };
        })
      );

      setReviews(reviewsWithUserInfo);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!newReview.comment.trim()) {
      toast({
        title: "Error",
        description: "Please write a review comment",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Check if user has purchased this product before
      let isVerifiedBuyer = false;
      if (user) {
        const { data: orderData } = await supabase
          .from('order_items')
          .select('id, orders!inner(user_id)')
          .eq('product_id', productId)
          .eq('orders.user_id', user.id)
          .limit(1);
        
        isVerifiedBuyer = (orderData && orderData.length > 0);
      }

      const reviewData = {
        product_id: productId,
        user_id: user?.id || null,
        rating: newReview.rating,
        comment: newReview.comment,
        is_verified_buyer: isVerifiedBuyer
      };

      const { error } = await supabase
        .from('product_reviews')
        .insert([reviewData]);

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your review!",
      });

      setNewReview({ rating: 5, comment: "" });
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 cursor-pointer transition-colors ${
              star <= rating
                ? "fill-accent text-accent"
                : "text-muted-foreground hover:text-accent"
            }`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/4 mb-2"></div>
                <div className="h-12 bg-secondary rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Customer Reviews
          <Badge variant="secondary">{reviews.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Write Review Section */}
        <div className="space-y-4">
          <h4 className="font-semibold">Write a Review</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Rating:</span>
              {renderStars(newReview.rating, true, (rating) => 
                setNewReview(prev => ({ ...prev, rating }))
              )}
            </div>
            <Textarea
              placeholder="Share your experience with this product..."
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              className="min-h-[100px]"
            />
            <Button 
              onClick={submitReview}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="space-y-3 pb-4 border-b last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {review.user_name}
                        </span>
                        {review.is_verified_buyer && (
                          <Badge variant="secondary" className="text-xs">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified Buyer
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed ml-11">
                  {review.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductReviews;
