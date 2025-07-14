
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Star, User, Package } from "lucide-react";

interface Review {
  id: string;
  comment: string;
  rating: number;
  created_at: string;
  is_verified_buyer: boolean;
  product_id: string;
  user_id: string;
  products?: {
    name: string;
  };
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          products:product_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reviews:', error);
        return;
      }

      // Fetch profile information separately for each review
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          if (review.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('user_id', review.user_id)
              .single();
            
            return {
              ...review,
              profiles: profileData
            };
          }
          return review;
        })
      );

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error in loadReviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setDeleting(reviewId);
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        console.error('Error deleting review:', error);
        toast({
          title: "Error",
          description: "Failed to delete review. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setReviews(prev => prev.filter(review => review.id !== reviewId));
      toast({
        title: "Success",
        description: "Review deleted successfully!"
      });
    } catch (error) {
      console.error('Error in handleDeleteReview:', error);
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Reviews...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
          <Star className="h-5 w-5" />
          Product Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm font-medium">({review.rating}/5)</span>
                      {review.is_verified_buyer && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Buyer
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {review.profiles?.first_name || 'Anonymous'} {review.profiles?.last_name || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{review.products?.name || 'Unknown Product'}</span>
                      </div>
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={deleting === review.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
                
                {review.profiles?.email && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact: {review.profiles.email}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminReviews;
