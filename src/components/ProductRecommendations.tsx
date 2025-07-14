
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Product {
  id: string;
  name: string;
  image_url: string;
  price: number;
  rating?: number;
  category: string;
  description?: string;
  weight?: string;
  is_bestseller?: boolean;
  is_new?: boolean;
}

interface ProductRecommendationsProps {
  currentProductId: string;
  category: string;
}

const ProductRecommendations = ({ currentProductId, category }: ProductRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [currentProductId, category]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // First try to get products from the same category
      let { data: categoryProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(8);

      if (error) throw error;

      // If we don't have enough products from the same category, get more from other categories
      if (!categoryProducts || categoryProducts.length < 4) {
        const { data: moreProducts, error: moreError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', currentProductId)
          .neq('category', category)
          .limit(8 - (categoryProducts?.length || 0));

        if (moreError) throw moreError;
        
        categoryProducts = [...(categoryProducts || []), ...(moreProducts || [])];
      }

      // Shuffle the array to show different products each time
      const shuffled = categoryProducts?.sort(() => 0.5 - Math.random()) || [];
      setRecommendations(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You May Also Like</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>You May Also Like</CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            align: "start",
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent>
            {recommendations.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    image_url={product.image_url}
                    price={product.price}
                    rating={product.rating}
                    category={product.category}
                    description={product.description}
                    weight={product.weight}
                    is_bestseller={product.is_bestseller}
                    is_new={product.is_new}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </Card>
  );
};

export default ProductRecommendations;
