
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ProductReviews from "@/components/ProductReviews";
import ProductRecommendations from "@/components/ProductRecommendations";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Clock, Minus, Plus, ChevronLeft, Share2, Zap, X, ChevronRight, ZoomIn, ZoomOut, Move, Image as ImageIcon } from "lucide-react";
import FreeShippingBadge from "@/components/FreeShippingBadge";
import { useToast } from "@/hooks/use-toast";

interface ProductImage {
  url: string;
  is_primary?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: ProductImage[];
  category: string;
  ingredients: string[];
  weight: string;
  rating: number;
  stock_quantity: number;
  is_active?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  created_at?: string;
  updated_at?: string;
}

const ProductDetailSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-lg" />
    </div>
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-24 mb-3" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-8 w-24 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-12" />
        </div>
      </div>
    </div>
  </div>
);

const ProductDetail = () => {
  const { productName } = useParams<{ productName: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const { addToCart, updateQuantity } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const shareData = {
        title: product?.name || 'Check out this product',
        text: product?.description || 'Amazing product from Mithila Bhog Bazaar',
        url: window.location.href,
      };

      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied to clipboard!",
          description: "Share this product with your friends and family.",
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        toast({
          variant: "destructive",
          title: "Error sharing product",
          description: "Could not share the product. Please try again.",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productName) {
        setError("Product name not found");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // First, try to get the product ID from the location state
        const location = window.history.state;
        const productId = location?.state?.productId;
        
        // Check for cached product data
        const cacheKey = productId ? `product_${productId}` : `product_${productName}`;
        const cachedProduct = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
        const now = Date.now();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
        const cacheValid = cacheAge < 10 * 60 * 1000; // 10 minutes cache validity
        
        // Use cache if valid and available
        if (cachedProduct && cacheValid) {
          try {
            const parsedProduct = JSON.parse(cachedProduct);
            console.log('Using cached product data');
            setProduct(parsedProduct);
            setLoading(false);
            
            // Refresh cache in background after a short delay
            setTimeout(() => fetchFromSupabase(false), 1000);
            return;
          } catch (e) {
            console.error('Error parsing cached product:', e);
            // Continue with normal fetch if cache parsing fails
          }
        }
        
        // Set a timeout to prevent getting stuck in loading state
        const timeoutId = setTimeout(() => {
          console.log('Product fetch timeout reached');
          setLoading(false);
          toast({
            title: "Connection Issue",
            description: "Product data is taking longer than expected to load.",
            variant: "warning"
          });
        }, 4000); // 4 second timeout
        
        await fetchFromSupabase(true, timeoutId);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError("Failed to load product details");
        setLoading(false);
      }
    };
    
    // Separate function to fetch from Supabase
    const fetchFromSupabase = async (updateUI = true, timeoutId?: NodeJS.Timeout) => {
      try {
        // First, try to get the product ID from the location state
        const location = window.history.state;
        const productId = location?.state?.productId;
        
        let query = supabase
          .from('products')
          .select('*')
          .eq('is_active', true);
        
        // If we have the product ID from state, use it for more reliable lookup
        if (productId) {
          query = query.eq('id', productId);
        } else {
          // Otherwise, try to find by name (fallback)
          const decodedName = decodeURIComponent(productName).replace(/-/g, ' ');
          query = query.ilike('name', `%${decodedName}%`);
        }
        
        const { data, error } = await query.single();

        // Clear the timeout if it exists
        if (timeoutId) clearTimeout(timeoutId);

        if (error) {
          console.error('Error fetching product:', error);
          if (updateUI) {
            setError("Failed to load product details");
          }
          return;
        }
        
        if (!data) {
          if (updateUI) {
            setError("Product not found");
          }
          return;
        }
        
        // Ensure product has at least an empty array for images if not provided
        if (!data.images) {
          data.images = [];
        }
        
        // Add a fallback image if none provided
        if (!data.image_url && (!data.images || data.images.length === 0)) {
          data.image_url = "/placeholder.svg";
        }
        
        // Cache the product data
        const cacheKey = productId ? `product_${productId}` : `product_${productName}`;
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        } catch (e) {
          console.error('Error caching product:', e);
        }
        
        if (updateUI) {
          // Update the URL in the address bar to use the correct product name format
          const formattedName = data.name.toLowerCase().replace(/\s+/g, '-');
          if (formattedName !== productName) {
            window.history.replaceState(
              { ...location, productId: data.id },
              '',
              `/products/${formattedName}`
            );
          }
          
          setProduct(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchFromSupabase:', error);
        if (updateUI) {
          setError("Failed to load product details");
          setLoading(false);
        }
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    fetchProduct();
  }, [productName]);

  const handleAddToCart = async (redirectToCheckout = false) => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      // First add the item to cart
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        description: product.description,
        weight: product.weight,
      });
      
      // Then update the quantity
      if (quantity > 1) {
        updateQuantity(product.id, quantity);
      }
      
      toast({
        title: redirectToCheckout ? "Proceeding to checkout!" : "Added to cart!",
        description: redirectToCheckout 
          ? `Proceeding to checkout with ${product.name}`
          : `${product.name} has been added to your cart.`,
      });

      if (redirectToCheckout) {
        // Redirect to checkout page after a short delay to show the toast
        setTimeout(() => {
          navigate('/checkout');
        }, 1000);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${redirectToCheckout ? 'proceed to checkout' : 'add item to cart'}. Please try again.`,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart(true);
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    
    try {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
        toast({
          title: "Removed from Wishlist",
          description: `${product.name} removed from wishlist`,
        });
      } else {
        addToWishlist(product);
        toast({
          title: "Added to Wishlist",
          description: `${product.name} added to wishlist`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive"
      });
    }
  };

  // Get all product images, fallback to single image_url if images array doesn't exist
  const productImages = useMemo(() => {
    if (!product) return [];
    // Make sure we always have at least one image
    if (product.images && product.images.length > 0) {
      return product.images;
    } else if (product.image_url) {
      return [{ url: product.image_url, is_primary: true }];
    } else {
      // Fallback image if no images are available
      return [{ url: "/placeholder.svg", is_primary: true }];
    }
  }, [product]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!productImages.length) return;
      
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => (prev + 1) % productImages.length);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productImages, isFullscreen]);

  // Handle mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      setZoomLevel(prev => {
        const newZoom = e.deltaY < 0 ? prev * 1.1 : prev / 1.1;
        return Math.min(Math.max(1, newZoom), 3); // Limit zoom between 1x and 3x
      });
    }
  };

  // Handle drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    
    // Calculate new position
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Get container dimensions
    const container = imageRef.current?.parentElement;
    if (!container) return;
    
    // Calculate bounds to prevent dragging image outside container
    const containerRect = container.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();
    
    const maxX = (imgRect.width - containerRect.width) / 2;
    const maxY = (imgRect.height - containerRect.height) / 2;
    
    setPosition({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset zoom and position when changing images
  useEffect(() => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [currentImageIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary">Products</Link>
            <span>/</span>
            <Skeleton className="h-4 w-24" />
          </div>
          <ProductDetailSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error || "Product Not Found"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || "The product you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/products">
            <Button variant="default">Browse Products</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary">Products</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="relative aspect-square rounded-lg overflow-hidden bg-secondary/30 cursor-zoom-in"
              onDoubleClick={() => setIsZoomed(!isZoomed)}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {productImages.length > 0 ? (
                <>
                  <img
                    ref={imageRef}
                    src={productImages[currentImageIndex]?.url || "/placeholder.svg"}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    className={cn(
                      "w-full h-full object-contain transition-transform duration-300",
                      isZoomed && "cursor-grab active:cursor-grabbing"
                    )}
                    style={{
                      transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                      transformOrigin: 'center center',
                    }}
                    onError={(e) => {
                      console.log("Image failed to load, using fallback");
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                    loading="eager"
                  />
                  
                  {/* Navigation Arrows */}
                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(prev => (prev + 1) % productImages.length);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Zoom Controls */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomLevel(prev => Math.min(prev + 0.5, 3));
                      }}
                      className="bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors shadow-md"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomLevel(prev => Math.max(prev - 0.5, 1));
                      }}
                      className="bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors shadow-md"
                      aria-label="Zoom out"
                      disabled={zoomLevel <= 1}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomLevel(1);
                        setPosition({ x: 0, y: 0 });
                      }}
                      className="bg-white/90 text-black p-2 rounded-full hover:bg-white transition-colors shadow-md"
                      aria-label="Reset zoom"
                      disabled={zoomLevel === 1 && position.x === 0 && position.y === 0}
                    >
                      <Move className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Thumbnail Strip */}
            {productImages.length > 1 && (
              <ScrollArea className="w-full">
                <div className="flex space-x-2 pb-2">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                        currentImageIndex === index 
                          ? "border-primary" 
                          : "border-transparent hover:border-muted-foreground/30"
                      )}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={img?.url || "/placeholder.svg"}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("Thumbnail failed to load, using fallback");
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                        loading="eager"
                      />
                      {img.is_primary && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1 rounded">
                          Main
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
            
            {/* Fullscreen View */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={() => setIsFullscreen(true)}
                >
                  <ZoomIn className="mr-2 h-4 w-4" /> View Fullscreen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black">
                <div className="relative w-full h-[80vh]">
                  {productImages.length > 0 && (
                    <>
                      <img
                        src={productImages[currentImageIndex]?.url || "/placeholder.svg"}
                        alt={`${product.name} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.log("Fullscreen image failed to load, using fallback");
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                        loading="eager"
                      />
                      
                      {/* Navigation Arrows */}
                      <button
                        onClick={() => setCurrentImageIndex(prev => (prev - 1 + productImages.length) % productImages.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-8 w-8" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => (prev + 1) % productImages.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-8 w-8" />
                      </button>
                      
                      {/* Close Button */}
                      <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        aria-label="Close fullscreen"
                      >
                        <X className="h-6 w-6" />
                      </button>
                      
                      {/* Thumbnails */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <div className="flex space-x-2">
                          {productImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full ${
                                currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Badge className="mb-2 bg-accent text-accent-foreground">
                    {product.category}
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    {product.name}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center gap-1.5 text-foreground hover:text-foreground hover:bg-accent/10 active:bg-accent/20 transition-colors min-w-[80px] h-9"
                    aria-label="Share product"
                  >
                    <Share2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline-block text-sm font-medium">Share</span>
                  </Button>
                  <Button
                    variant={isInWishlist(product.id) ? "default" : "outline"}
                    size="sm"
                    className={`flex items-center gap-1.5 ${
                      isInWishlist(product.id)
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'text-foreground hover:text-foreground hover:bg-accent/10 active:bg-accent/20'
                    } transition-colors min-w-[80px] h-9`}
                    onClick={handleWishlistToggle}
                    aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`h-3.5 w-3.5 flex-shrink-0 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline-block text-sm font-medium">Wishlist</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.rating?.toFixed(1)})
                </span>
              </div>
              
              <p className="text-2xl font-bold text-primary mb-3">
                ₹{product.price.toFixed(2)}
              </p>
              
              {/* Product Details - Moved Up */}
              <div className="space-y-4 mb-4">
                {product.weight && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Weight</h3>
                    <p className="text-sm text-muted-foreground">{product.weight}</p>
                  </div>
                )}
                
                {product.ingredients && product.ingredients.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Ingredients</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {product.ingredients.map((ingredient, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add to Cart Section */}
              <div className="bg-muted/30 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-4 mb-3">
                  <label className="font-medium text-foreground">Quantity:</label>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 hover:bg-secondary transition-colors"
                      disabled={addingToCart}
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 border-x">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1.5 hover:bg-secondary transition-colors"
                      disabled={addingToCart}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 text-sm font-medium border-2 border-primary/20 text-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                    onClick={() => handleAddToCart(false)}
                    disabled={(product.stock_quantity || 0) === 0 || addingToCart}
                  >
                    {addingToCart ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2 text-primary" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    className="h-12 text-sm font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleBuyNow}
                    disabled={(product.stock_quantity || 0) === 0 || addingToCart}
                  >
                    {addingToCart ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2.5" />
                        <span>Buy Now</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {product.description}
              </p>
              
              {/* Stock Status - Moved below description */}
              <div className="mb-4">
                <p className="text-sm font-medium">
                  Status: {" "}
                  <span className={cn(
                    "font-semibold",
                    (product.stock_quantity || 0) > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {(product.stock_quantity || 0) > 0 
                      ? `In Stock (${product.stock_quantity} units available)`
                      : "Out of stock"
                    }
                  </span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Product Details - Moved Down */}

            

          </div>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card className="border-0 shadow-sm hover:shadow transition-shadow text-center p-4 h-full">
            <CardContent className="p-0">
              <div className="flex justify-center mb-2">
                <img 
                  src="/icons/Free Shipping.png" 
                  alt="Free Shipping" 
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    // Create a fallback emoji
                    const fallback = document.createElement('div');
                    fallback.className = 'h-12 w-12 flex items-center justify-center text-green-500 text-xl';
                    fallback.textContent = '🚚';
                    if (target.parentNode) {
                      target.parentNode.insertBefore(fallback, target);
                      target.style.display = 'none';
                    }
                  }}
                  loading="eager"
                />
              </div>
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">Free Shipping</h3>
              <p className="text-xs text-muted-foreground">
                Orders above ₹500
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow transition-shadow text-center p-4 h-full">
            <CardContent className="p-0">
              <div className="flex justify-center mb-2">
                <img 
                  src="/icons/guarantee.png" 
                  alt="Quality Guarantee" 
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    // Create a fallback emoji
                    const fallback = document.createElement('div');
                    fallback.className = 'h-12 w-12 flex items-center justify-center text-blue-500 text-xl';
                    fallback.textContent = '✓';
                    if (target.parentNode) {
                      target.parentNode.insertBefore(fallback, target);
                      target.style.display = 'none';
                    }
                  }}
                  loading="eager"
                />
              </div>
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">Quality</h3>
              <p className="text-xs text-muted-foreground">
                100% authentic products
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow transition-shadow text-center p-4 h-full">
            <CardContent className="p-0">
              <div className="flex justify-center mb-2">
                <img 
                  src="/icons/easy-return.png" 
                  alt="Easy Returns" 
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    // Create a fallback emoji
                    const fallback = document.createElement('div');
                    fallback.className = 'h-12 w-12 flex items-center justify-center text-purple-500 text-xl';
                    fallback.textContent = '↻';
                    if (target.parentNode) {
                      target.parentNode.insertBefore(fallback, target);
                      target.style.display = 'none';
                    }
                  }}
                  loading="eager"
                />
              </div>
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">Easy Returns</h3>
              <p className="text-xs text-muted-foreground">
                7-day return policy
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow transition-shadow text-center p-4 h-full">
            <CardContent className="p-0">
              <div className="flex justify-center mb-2">
                <img 
                  src="/icons/fresh.png" 
                  alt="Fresh & Hygienic" 
                  className="h-12 w-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    // Create a fallback emoji
                    const fallback = document.createElement('div');
                    fallback.className = 'h-12 w-12 flex items-center justify-center text-green-600 text-xl';
                    fallback.textContent = '🌿';
                    if (target.parentNode) {
                      target.parentNode.insertBefore(fallback, target);
                      target.style.display = 'none';
                    }
                  }}
                  loading="eager"
                />
              </div>
              <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">Fresh & Hygienic</h3>
              <p className="text-xs text-muted-foreground">
                Made with premium ingredients
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product Reviews */}
        <div className="mb-16">
          <ProductReviews productId={product.id} />
        </div>

        {/* Product Recommendations */}
        <div className="mb-16">
          <ProductRecommendations 
            currentProductId={product.id} 
            category={product.category} 
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
