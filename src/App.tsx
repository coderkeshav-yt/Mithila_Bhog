import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ScrollToTop from "@/components/ScrollToTop";
import { checkSupabaseConnection } from "@/integrations/supabase/client";

// Configure query client with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy load pages with prefetching
const Index = lazy(() => import("@/pages/Index"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Profile = lazy(() => import("@/pages/Profile"));
const TrackOrder = lazy(() => import("@/pages/TrackOrder"));
const Contact = lazy(() => import("@/pages/Contact"));
const Blog = lazy(() => import("@/pages/Blog"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const OurStory = lazy(() => import("@/pages/OurStory"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));

// Prefetch important pages
const prefetchImportantPages = () => {
  // Prefetch these in the background after initial load
  const prefetchPages = () => {
    import("@/pages/Products");
    import("@/pages/Profile");
    import("@/pages/Cart");
  };
  
  // Use requestIdleCallback if available, otherwise setTimeout
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchPages, { timeout: 2000 });
    } else {
      setTimeout(prefetchPages, 2000);
    }
  }
};

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner className="h-16 w-16" />
  </div>
);

// Component to handle connection check and prefetching
const AppInitializer = () => {
  useEffect(() => {
    // Check connection in the background
    checkSupabaseConnection();
    
    // Prefetch important pages
    prefetchImportantPages();
  }, []);
  
  return null;
};

const App = () => {
  return (
    <div className="min-h-screen bg-background">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <AppInitializer />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/products" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Products />
                        </Suspense>
                      } />
                      <Route path="/products/:productName" element={<ProductDetail />} />
                      <Route path="/cart" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Cart />
                        </Suspense>
                      } />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/profile" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Profile />
                        </Suspense>
                      } />
                      <Route path="/track-order" element={<TrackOrder />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/admin" element={
                        <Suspense fallback={<LoadingFallback />}>
                          <Admin />
                        </Suspense>
                      } />
                      <Route path="/our-story" element={<OurStory />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
