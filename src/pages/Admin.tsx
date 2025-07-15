import { Plus } from 'lucide-react';
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

// Lazy load admin components
const AdminProducts = React.lazy(() => import("@/components/AdminProducts"));
const CouponList = React.lazy(() => import("@/components/CouponList"));
const CouponForm = React.lazy(() => import("@/components/CouponForm"));
const OrderHistory = React.lazy(() => import("@/components/OrderHistory"));
const AdminRevenue = React.lazy(() => import("@/components/AdminRevenue"));
const AdminReviews = React.lazy(() => import("@/components/AdminReviews"));
const RevenueCharts = React.lazy(() => import("@/components/RevenueCharts"));

// Loading component for Suspense fallback
const AdminLoading = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner className="h-12 w-12" />
  </div>
);

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState<string | null>(null);

  // Handle coupon form success
  const handleCouponFormSuccess = () => {
    setShowCouponForm(false);
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (!isAdmin) {
        navigate('/');
        return;
      }

      setLoading(false);
    };

    checkAdminAccess();
  }, [user, navigate, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your store, products, and orders</p>
        </div>
        <ErrorBoundary>
          <RevenueProvider>
            <Tabs defaultValue="products">
              <TabsList>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="coupons">Coupons</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="space-y-6">
                <Suspense fallback={<AdminLoading />}>
                  <AdminProducts />
                </Suspense>
              </TabsContent>
              <TabsContent value="orders" className="space-y-6">
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
              <TabsContent value="coupons" className="space-y-6">
                <Suspense fallback={<AdminLoading />}>
                  <div className="bg-card p-6 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-semibold">Coupon Management</h2>
                      <Button 
                        onClick={() => setShowCouponForm(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Coupon
                      </Button>
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
              <TabsContent value="reviews" className="space-y-6">
                <Suspense fallback={<AdminLoading />}>
                  <AdminReviews />
                </Suspense>
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
