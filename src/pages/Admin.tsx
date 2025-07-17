import { Plus, Users } from 'lucide-react';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RevenueProvider } from "@/contexts/RevenueContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdminOverview from "@/components/AdminOverview";
import { useToast } from "@/hooks/use-toast";
import { checkSupabaseConnection } from "@/integrations/supabase/client";

// Import TestUsers directly to avoid lazy loading issues
import TestUsers from "@/components/TestUsers";

// Optimized lazy loading with prefetch and error handling
const AdminProducts = lazy(() => {
  // Prefetch the component
  const prefetch = import("@/components/AdminProducts");
  // Return the promise
  return prefetch.catch(error => {
    console.error('Error loading AdminProducts:', error);
    return import("@/components/AdminSkeleton"); // Fallback component
  });
});

const CouponList = lazy(() => import("@/components/CouponList").catch(error => {
  console.error('Error loading CouponList:', error);
  return import("@/components/AdminSkeleton");
}));

const CouponForm = lazy(() => import("@/components/CouponForm").catch(error => {
  console.error('Error loading CouponForm:', error);
  return import("@/components/AdminSkeleton");
}));

const OrderHistory = lazy(() => import("@/components/OrderHistory").catch(error => {
  console.error('Error loading OrderHistory:', error);
  return import("@/components/AdminSkeleton");
}));

const AdminRevenue = lazy(() => import("@/components/AdminRevenue").catch(error => {
  console.error('Error loading AdminRevenue:', error);
  return import("@/components/AdminSkeleton");
}));

const AdminReviews = lazy(() => import("@/components/AdminReviews").catch(error => {
  console.error('Error loading AdminReviews:', error);
  return import("@/components/AdminSkeleton");
}));

const RevenueCharts = lazy(() => import("@/components/RevenueCharts").catch(error => {
  console.error('Error loading RevenueCharts:', error);
  return import("@/components/AdminSkeleton");
}));

// Preload admin components in the background
const preloadAdminComponents = () => {
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
  
  schedulePreload(() => {
    console.log('Preloading admin components...');
    // Preload in sequence with small delays to avoid overwhelming the browser
    setTimeout(() => import("@/components/AdminProducts"), 100);
    setTimeout(() => import("@/components/CouponList"), 300);
    setTimeout(() => import("@/components/OrderHistory"), 500);
    setTimeout(() => import("@/components/AdminRevenue"), 700);
    setTimeout(() => import("@/components/AdminReviews"), 900);
  });
};

// Loading component for Suspense fallback
const AdminLoading = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner className="h-12 w-12" />
  </div>
);

const Admin = () => {
  const { user, isAdmin, adminCheckComplete, forceAdminCheck } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [forceAdmin, setForceAdmin] = useState(false);
  const [adminCheckTimeout, setAdminCheckTimeout] = useState(false);

  // Set a timeout to prevent getting stuck in loading state and check connection
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('Admin page timeout reached');
      setAdminCheckTimeout(true);
      setLoading(false);
      toast({
        title: "Connection Issue",
        description: "Admin panel is taking longer than expected to load. Some features may be limited.",
        variant: "warning"
      });
    }, 5000); // Reduced from 10s to 5s timeout
    
    // Check Supabase connection status
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.log('Supabase connection check failed');
        setAdminCheckTimeout(true);
        setLoading(false);
        toast({
          title: "Connection Issue",
          description: "Could not connect to the database. Some features may be limited.",
          variant: "destructive"
        });
      }
    };
    
    checkConnection();
    
    // Start preloading admin components in the background
    preloadAdminComponents();
    
    return () => clearTimeout(timeoutId);
  }, [toast]);

  // Handle coupon form success
  const handleCouponFormSuccess = () => {
    setShowCouponForm(false);
  };

  // Force admin access for testing
  const handleForceAdmin = async () => {
    if (user) {
      toast({
        title: "Admin Check",
        description: "Rechecking admin status...",
      });
      
      try {
        await forceAdminCheck();
        
        // If still not admin after check, force it for testing
        if (!isAdmin) {
          setForceAdmin(true);
          toast({
            title: "Admin Access",
            description: "Showing admin features in test mode. Some features may be limited.",
            variant: "warning"
          });
        } else {
          toast({
            title: "Admin Access",
            description: "Admin access confirmed.",
          });
        }
      } catch (error) {
        console.error('Error during admin check:', error);
        setForceAdmin(true);
        toast({
          title: "Admin Check Failed",
          description: "Showing admin features in test mode. Some features may be limited.",
          variant: "destructive"
        });
      }
      
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only check admin access after admin status check is complete or timeout
    if (!adminCheckComplete && !adminCheckTimeout) {
      return;
    }
    
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (!isAdmin && !forceAdmin) {
        navigate('/');
        return;
      }

      setLoading(false);
    };

    checkAdminAccess();
  }, [user, navigate, isAdmin, adminCheckComplete, adminCheckTimeout, forceAdmin]);

  // Show loading state with force admin option
  if ((!adminCheckComplete && !adminCheckTimeout) || (loading && !adminCheckTimeout)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p>Checking admin access...</p>
            <Button onClick={handleForceAdmin} className="mt-4">
              Force Admin Access
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show access denied if not admin and not forcing admin
  if ((!user || (!isAdmin && !forceAdmin))) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
            <Button onClick={handleForceAdmin} className="mt-4">
              Force Admin Access
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show admin dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your store, products, and orders</p>
          {(adminCheckTimeout || forceAdmin) && !adminCheckComplete && (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              Note: Admin check timed out or forced. Some features may be limited.
            </div>
          )}
          {forceAdmin && (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              Warning: You are in forced admin mode. This is for testing only.
            </div>
          )}
        </div>
        <ErrorBoundary>
          <RevenueProvider>
            <Tabs defaultValue="overview" onValueChange={(value) => setActiveTab(value)}>
              <div className="flex justify-between items-center mb-6">
                <TabsList className="bg-muted/60">
                  <TabsTrigger value="overview" className={activeTab === "overview" ? "font-medium" : ""}>Overview</TabsTrigger>
                  <TabsTrigger value="products" className={activeTab === "products" ? "font-medium" : ""}>Products</TabsTrigger>
                  <TabsTrigger value="orders" className={activeTab === "orders" ? "font-medium" : ""}>Orders</TabsTrigger>
                  <TabsTrigger value="coupons" className={activeTab === "coupons" ? "font-medium" : ""}>Coupons</TabsTrigger>
                  <TabsTrigger value="reviews" className={activeTab === "reviews" ? "font-medium" : ""}>Reviews</TabsTrigger>
                  <TabsTrigger value="users" className={activeTab === "users" ? "font-medium" : ""}>
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </TabsTrigger>
                </TabsList>
                {activeTab === "coupons" && (
                  <Button 
                    onClick={() => setShowCouponForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Coupon
                  </Button>
                )}
              </div>
              
              <TabsContent value="overview" className="mt-0">
                <Suspense fallback={<AdminLoading />}>
                  <AdminOverview />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="products" className="space-y-6 mt-0">
                <Suspense fallback={<AdminLoading />}>
                  <AdminProducts />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="orders" className="space-y-6 mt-0">
                <Suspense fallback={<AdminLoading />}>
                  <OrderHistory user={user} />
                  {orderHistoryError && (
                    <div className="mt-4 text-center">
                      <p className="text-destructive mb-2">{orderHistoryError}</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setOrderHistoryError(null);
                          setLoading(true);
                          setTimeout(() => setLoading(false), 100);
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="coupons" className="space-y-6 mt-0">
                <Suspense fallback={<AdminLoading />}>
                  <div className="bg-card p-6 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-semibold">Coupon Management</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Create and manage discount coupons for your customers.
                    </p>
                    <CouponList />
                  </div>
                  {showCouponForm && (
                    <CouponForm 
                      open={showCouponForm}
                      onClose={() => setShowCouponForm(false)}
                      onSuccess={handleCouponFormSuccess}
                    />
                  )}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-6 mt-0">
                <Suspense fallback={<AdminLoading />}>
                  <AdminReviews />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="users" className="space-y-6 mt-0">
                <TestUsers />
              </TabsContent>
            </Tabs>
          </RevenueProvider>
        </ErrorBoundary>
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
