
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

interface ProductImage {
  url: string;
  is_primary?: boolean;
}

interface ProductCardProps {
  id: string;
  name: string;
  image_url: string;
  images?: ProductImage[];
  price: number;
  rating?: number;
  category: string;
  description?: string;
  weight?: string;
  is_bestseller?: boolean;
  is_new?: boolean;
}

const ProductCard = ({
  id,
  name,
  image_url,
  images: propImages,
  price,
  rating = 0,
  category,
  description,
  weight,
  is_bestseller = false,
  is_new = false,
}: ProductCardProps) => {
  // Create images array from props, falling back to the single image_url
  const images = propImages && propImages.length > 0 
    ? propImages 
    : [{ url: image_url, is_primary: true }];
    
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const hasMultipleImages = images.length > 1;
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(id);

  const handleAddToCart = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    addToCart({ 
      id, 
      name, 
      image_url: images[0].url, // Use the first image as the main image
      price, 
      rating, 
      category,
      description,
      weight
    });
    setIsLoading(false);
  };
  
  // Handle hover effect
  useEffect(() => {
    if (!hasMultipleImages) return;
    
    if (isHovered) {
      // Switch to second image on hover
      setCurrentImageIndex(1);
    } else {
      // Reset to first image when mouse leaves
      setCurrentImageIndex(0);
    }
  }, [isHovered, hasMultipleImages]);

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(id);
    } else {
      addToWishlist({ 
        id, 
        name, 
        image_url, 
        price, 
        rating, 
        category,
        description,
        weight
      });
    }
  };

  return (
    <Card className="group relative overflow-hidden border-0 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 bg-card hover:shadow-lg">
      <div className="relative overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {is_bestseller && (
            <Badge className="bg-accent text-accent-foreground px-2 py-1 text-xs font-semibold">
              Bestseller
            </Badge>
          )}
          {is_new && (
            <Badge className="bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold">
              New
            </Badge>
          )}
        </div>

        {/* Product Image */}
        <div className="relative">
          <Link 
            to={`/products/${id}`}
            className="block relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="aspect-square overflow-hidden bg-secondary/30 relative">
              {/* Main Image - Always visible */}
              <img
                src={images[0]?.url || '/placeholder-product.png'}
                alt={name}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300 absolute inset-0",
                  isHovered && hasMultipleImages ? "opacity-0" : "opacity-100"
                )}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-product.png";
                }}
              />
              
              {/* Secondary Image - Only shown on hover if exists */}
              {hasMultipleImages && (
                <img
                  src={images[1]?.url || images[0]?.url || '/placeholder-product.png'}
                  alt={`${name} - Alternate view`}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300 absolute inset-0",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-product.png";
                  }}
                />
              )}
              
              {/* Image Navigation Dots (if 2 or more images) */}
              {hasMultipleImages && images.length >= 2 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1.5">
                  {images.slice(0, 2).map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex 
                          ? 'bg-primary w-4' 
                          : 'bg-muted-foreground/30 w-1.5'
                      }`}
                      aria-label={`View image ${index + 1}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Link>
          
          {/* Wishlist Button - Mobile/Tablet */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist();
            }}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 md:hidden",
              isWishlisted 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "bg-white/90 text-gray-700 hover:bg-white hover:text-red-500"
            )}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              className={cn(
                "h-5 w-5",
                isWishlisted ? "fill-current" : ""
              )} 
            />
          </button>

          {/* Wishlist Button - Desktop */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist();
            }}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 hidden md:block opacity-0 group-hover:opacity-100 bg-background/80 backdrop-blur-sm hover:bg-background",
              isWishlisted ? "text-red-500" : "text-muted-foreground"
            )}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              className={cn(
                "h-4 w-4",
                isWishlisted ? "fill-current" : ""
              )} 
            />
          </button>
        </div>

        {/* Quick Add to Cart - Shows on Hover */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="cta"
            size="sm"
            className="w-full"
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isLoading ? 'Adding...' : 'Quick Add'}
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {category}
          </p>

          {/* Product Name */}
          <Link to={`/products/${id}`}>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
              {name}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= rating ? 'text-accent' : 'text-muted-foreground'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">₹{price}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
