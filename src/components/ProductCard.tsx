
import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { slugify } from "@/lib/utils";

interface ProductImage {
  url: string;
  is_primary?: boolean;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  rating?: number | null;
  category: string;
  description?: string | null;
  weight?: string | null;
  is_bestseller?: boolean | null;
  is_new?: boolean | null;
  stock_quantity?: number | null;
  ingredients?: string[] | null;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean | null;
}

interface ProductCardProps {
  product?: Product;
  id?: string;
  name?: string;
  image_url?: string;
  price?: number;
  rating?: number;
  category?: string;
  description?: string;
  weight?: string;
  is_bestseller?: boolean;
  is_new?: boolean;
}

const ProductCardComponent = (props: ProductCardProps) => {
  // Handle both product object and individual props
  const product = props.product || {
    id: props.id || '',
    name: props.name || '',
    image_url: props.image_url || '',
    price: props.price || 0,
    rating: props.rating || 0,
    category: props.category || '',
    description: props.description || '',
    weight: props.weight || '',
    is_bestseller: props.is_bestseller || false,
    is_new: props.is_new || false
  };
  const { toast } = useToast();

  const {
    id,
    name,
    image_url,
    price,
    rating = 0,
    category,
    description,
    weight,
    is_bestseller = false,
    is_new = false,
  } = product;

  // Create images array from props, falling back to the single image_url
  const defaultImage = '/placeholder.svg';
  const images = [{ url: image_url || defaultImage, is_primary: true }];
    
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const hasMultipleImages = images.length > 1;
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isCartHovered, setIsCartHovered] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(id);

  const handleAddToCart = async () => {
    if (!id || !name) {
      console.error('Cannot add to cart: Missing product ID or name');
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
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
    
    // Show success animation
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
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
    if (!id || !name) {
      console.error('Cannot toggle wishlist: Missing product ID or name');
      return;
    }
    
    if (isWishlisted) {
      removeFromWishlist(id);
    } else {
      addToWishlist({ 
        id, 
        name, 
        image_url: images[0].url, 
        price, 
        rating, 
        category,
        description,
        weight
      });
    }
  };

  // If we don't have a valid product, don't render anything
  if (!id || !name) {
    console.warn('ProductCard received invalid product data', props);
    return null;
  }

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
            to={`/products/${slugify(name)}`}
            state={{ productId: id }}
            className="block relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="aspect-square overflow-hidden bg-secondary/30 relative">
              {/* Main Image - Always visible */}
              <img
                src={images[0]?.url || defaultImage}
                alt={name}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300 absolute inset-0",
                  isHovered && hasMultipleImages ? "opacity-0" : "opacity-100"
                )}
                onError={(e) => {
                  e.currentTarget.src = defaultImage;
                }}
                loading="lazy"
                decoding="async"
              />
              
              {/* Secondary Image - Only shown on hover if exists */}
              {hasMultipleImages && (
                <img
                  src={images[1]?.url || images[0]?.url || defaultImage}
                  alt={`${name} - Alternate view`}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300 absolute inset-0",
                    isHovered ? "opacity-100" : "opacity-0"
                  )}
                  onError={(e) => {
                    e.currentTarget.src = defaultImage;
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
                "h-5 w-5",
                isWishlisted ? "fill-current" : ""
              )} 
            />
          </button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Product Name */}
        <Link 
          to={`/products/${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`}
          state={{ productId: id }}
          className="block"
        >
          <h3 className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors mb-1">
            {name}
          </h3>
        </Link>
        
        {/* Category */}
        <div className="text-xs text-muted-foreground mb-2">
          {category}
        </div>
        
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between mt-auto gap-3">
          <div className="flex flex-col">
            <div className="font-bold text-lg text-foreground">₹{price.toFixed(0)}</div>
            {weight && (
              <div className="text-xs text-muted-foreground">{weight}</div>
            )}
          </div>
          
          <div className="relative">
            <Button 
              size="sm" 
              variant={isAdded ? "default" : "outline"}
              className={cn(
                "relative overflow-hidden transition-all duration-300 group font-medium",
                isAdded 
                  ? "bg-green-500 text-white border-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25" 
                  : isLoading 
                  ? "bg-primary/5 text-primary border-primary/30 cursor-not-allowed" 
                  : "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-lg hover:shadow-primary/25 border-2 px-4 py-2 rounded-lg transform hover:scale-105 active:scale-95"
              )}
              onClick={handleAddToCart}
              disabled={isLoading || isAdded}
              onMouseEnter={() => setIsCartHovered(true)}
              onMouseLeave={() => setIsCartHovered(false)}
            >
              {/* Background gradient overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 transition-opacity duration-300",
                isCartHovered && !isLoading && !isAdded ? "opacity-100" : "opacity-0"
              )} />
              
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center gap-2 relative z-10">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Adding...</span>
                </div>
              )}
              
              {/* Success State */}
              {isAdded && (
                <div className="flex items-center gap-2 relative z-10">
                  <Check className="h-4 w-4 animate-in zoom-in-50 duration-300" />
                  <span className="text-sm font-medium">Added!</span>
                </div>
              )}
              
              {/* Default State */}
              {!isLoading && !isAdded && (
                <div className="flex items-center gap-2 relative z-10">
                  <ShoppingCart className={cn(
                    "h-4 w-4 transition-all duration-200",
                    isCartHovered ? "scale-110" : "scale-100"
                  )} />
                  <span className="text-sm font-medium transition-all duration-200">
                    {isCartHovered ? "Add Now" : "Add to Cart"}
                  </span>
                </div>
              )}
              
              {/* Shimmer effect on hover */}
              {isCartHovered && !isLoading && !isAdded && (
                <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] animate-shimmer" />
              )}
            </Button>
            
            {/* Success pulse effect */}
            {isAdded && (
              <div className="absolute inset-0 rounded-lg bg-green-500/30 animate-ping" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductCard = memo(ProductCardComponent);

export default ProductCard;
