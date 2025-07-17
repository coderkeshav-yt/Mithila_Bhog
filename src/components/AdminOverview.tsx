import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowUp, ArrowRight, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useRevenueContext } from "@/contexts/RevenueContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface OverviewStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  averageOrderValue: number;
  newCustomers: number;
  bestSellingProduct: string;
  revenueTrend: Array<{date: string, value: number}>;
  monthlyRevenue: number;
  monthlyOrders: number;
  orderCompletionRate: number;
  averageRating: number;
  paymentStats: {
    totalPayments: number;
    completed: number;
    pending: number;
    cancelled: number;
    failed: number;
  };
}

interface Order {
  id: string;
  total_amount: number;
  created_at: string;
  status: string;
  payment_status: string;
}

const AdminOverview = () => {
  const { refreshCount, forceRefresh, lastRefreshed } = useRevenueContext();
  const [stats, setStats] = useState<OverviewStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    averageOrderValue: 0,
    newCustomers: 0,
    bestSellingProduct: "",
    revenueTrend: [],
    monthlyRevenue: 0,
    monthlyOrders: 0,
    orderCompletionRate: 0,
    averageRating: 0,
    paymentStats: {
      totalPayments: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      failed: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // Create a memoized fetchOverviewStats function
  const fetchOverviewStats = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Fetch total products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total orders and revenue with fresh data
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status, payment_status')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // Store all orders for filtering
      const orders = ordersData || [];
      setAllOrders(orders);
      setFilteredOrders(orders);

      // Debug log to check orders data
      console.log('Orders data:', orders);
      console.log('Orders with completed status:', orders.filter(order => order.status === 'completed'));
      console.log('Orders with completed payment status:', orders.filter(order => order.payment_status === 'completed' || order.payment_status === 'paid'));

      const totalOrders = orders.length || 0;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate payment statistics
      const completedOrders = orders.filter(order => 
        (order.payment_status === 'paid' || 
        order.payment_status === 'completed') &&
        order.status === 'completed'
      );
      
      const completedAmount = completedOrders.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      
      // Debug log for completed orders
      console.log('Completed orders for payment stats:', completedOrders);
      console.log('Completed amount:', completedAmount);
      
      const paymentStats = {
        totalPayments: totalRevenue,
        completed: completedAmount,
        pending: orders.filter(order => 
          (order.payment_status === 'pending' || 
          order.status === 'pending' || 
          order.status === 'processing') && 
          order.status !== 'cancelled'
        ).reduce((sum, order) => sum + order.total_amount, 0) || 0,
        
        cancelled: orders.filter(order => 
          order.payment_status === 'cancelled' || 
          order.status === 'cancelled'
        ).reduce((sum, order) => sum + order.total_amount, 0) || 0,
        
        failed: orders.filter(order => 
          order.payment_status === 'failed'
        ).reduce((sum, order) => sum + order.total_amount, 0) || 0
      };

      // Debug log for payment stats
      console.log('Payment stats:', paymentStats);

      // Calculate monthly revenue and orders
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyOrders = orders.filter(order => 
        new Date(order.created_at) >= thirtyDaysAgo
      ).length || 0;
      const monthlyRevenue = orders.reduce((sum, order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= thirtyDaysAgo ? sum + order.total_amount : sum;
      }, 0) || 0;

      // Calculate order completion rate
      const orderCompletionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

      // Calculate average rating
      const { data: reviewsData } = await supabase
        .from('product_reviews')
        .select('rating')
        .order('created_at', { ascending: false });
      const totalRatings = reviewsData?.reduce((sum, review) => sum + review.rating, 0) || 0;
      const averageRating = reviewsData?.length > 0 ? totalRatings / reviewsData.length : 0;

      // Fetch new customers (last 30 days)
      const { count: newCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Find best selling product
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('product_id')
        .order('quantity', { ascending: false })
        .limit(1);

      // Generate revenue trend data for last 30 days
      const revenueTrend = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i)); // Reverse the order for chronological display
        const dailyRevenue = orders.reduce((sum, order) => {
          const orderDate = new Date(order.created_at);
          return orderDate.getDate() === date.getDate() && 
                 orderDate.getMonth() === date.getMonth() ? 
                 sum + order.total_amount : sum;
        }, 0) || 0;
        return {
          date: format(date, 'dd MMM'),
          value: dailyRevenue
        };
      });

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        totalUsers,
        averageOrderValue,
        newCustomers,
        bestSellingProduct: orderItemsData?.[0]?.product_id || "",
        revenueTrend,
        monthlyRevenue,
        monthlyOrders,
        orderCompletionRate,
        averageRating,
        paymentStats
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    forceRefresh();
    // The component will re-render due to the forceRefresh call
  };

  // Filter orders by payment status
  const filterOrdersByStatus = (status: string) => {
    setPaymentStatusFilter(status);
    
    if (status === 'all') {
      setFilteredOrders(allOrders);
      return;
    }
    
    let filtered: Order[] = [];
    
    switch (status) {
      case 'completed':
        filtered = allOrders.filter(order => 
          (order.payment_status === 'paid' || 
          order.payment_status === 'completed') &&
          order.status === 'completed'
        );
        break;
      case 'pending':
        filtered = allOrders.filter(order => 
          (order.payment_status === 'pending' || 
          order.status === 'pending') && 
          order.status !== 'cancelled'
        );
        break;
      case 'processing':
        filtered = allOrders.filter(order => 
          order.status === 'processing' && 
          order.status !== 'cancelled'
        );
        break;
      case 'cancelled':
        filtered = allOrders.filter(order => 
          order.payment_status === 'cancelled' || 
          order.status === 'cancelled'
        );
        break;
      default:
        filtered = allOrders;
    }
    
    setFilteredOrders(filtered);
  };

  // Get filtered payment data
  const getFilteredPaymentData = () => {
    if (paymentStatusFilter === 'all') {
      return {
        totalPayments: stats.paymentStats.totalPayments,
        completed: stats.paymentStats.completed,
        pending: stats.paymentStats.pending,
        cancelled: stats.paymentStats.cancelled,
        failed: stats.paymentStats.failed,
      };
    }

    // For specific filters, recalculate based on filtered orders
    const filteredTotal = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    // Create an object with all values set to 0
    const result = {
      totalPayments: filteredTotal,
      completed: 0,
      pending: 0,
      cancelled: 0,
      failed: 0,
    };
    
    // Set only the active filter value to the filtered total
    if (paymentStatusFilter === 'completed') result.completed = filteredTotal;
    else if (paymentStatusFilter === 'pending') result.pending = filteredTotal;
    else if (paymentStatusFilter === 'processing') result.pending = filteredTotal; // Processing is part of pending
    else if (paymentStatusFilter === 'cancelled') result.cancelled = filteredTotal;
    else if (paymentStatusFilter === 'failed') result.failed = filteredTotal;
    
    return result;
  };

  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats, refreshCount]); // Refresh when refreshCount changes or fetchOverviewStats changes

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Loader2 className="h-6 w-6 mx-auto animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Get payment data based on filter
  const paymentData = getFilteredPaymentData();

  // Data for payment status pie chart
  const paymentStatusData = [
    { name: 'Completed', value: paymentData.completed },
    { name: 'Pending', value: paymentData.pending },
    { name: 'Cancelled', value: paymentData.cancelled },
    { name: 'Failed', value: paymentData.failed },
  ].filter(item => item.value > 0); // Only show segments with values > 0
  
  // Check if we have any data to display
  const hasPaymentData = paymentStatusData.length > 0;

  const COLORS = ['#4ade80', '#facc15', '#f87171', '#94a3b8'];

  return (
    <div className="space-y-6">
      {/* Key Stats Cards with Refresh Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Dashboard Overview</h2>
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-xs text-muted-foreground">
              Last updated: {format(lastRefreshed, 'HH:mm:ss')}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
            <h2 className="text-4xl font-bold mt-2">{stats.totalOrders}</h2>
          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <h2 className="text-4xl font-bold mt-2">₹{stats.totalRevenue.toLocaleString()}</h2>
          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Products</p>
            <h2 className="text-4xl font-bold mt-2">{stats.totalProducts}</h2>
          </CardContent>
        </Card>
        <Card className="bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Users</p>
            <h2 className="text-4xl font-bold mt-2">{stats.totalUsers}</h2>
          </CardContent>
        </Card>
      </div>

      {/* Payment Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle>Payment Overview</CardTitle>
            <Tabs 
              value={paymentStatusFilter} 
              onValueChange={filterOrdersByStatus}
              className="mt-2 md:mt-0"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-blue-600">Total Payments</p>
                <h3 className="text-3xl font-bold text-blue-700 mt-2">₹{paymentData.totalPayments.toLocaleString()}</h3>
                <p className="text-xs text-blue-500 mt-1">Total payment amount</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-green-600">Completed</p>
                <h3 className="text-3xl font-bold text-green-700 mt-2">₹{paymentData.completed.toLocaleString()}</h3>
                <p className="text-xs text-green-500 mt-1">Successfully processed amount</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <h3 className="text-3xl font-bold text-yellow-700 mt-2">₹{paymentData.pending.toLocaleString()}</h3>
                <p className="text-xs text-yellow-500 mt-1">Amount in pending status</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-red-600">Cancelled</p>
                <h3 className="text-3xl font-bold text-red-700 mt-2">₹{paymentData.cancelled.toLocaleString()}</h3>
                <p className="text-xs text-red-500 mt-1">Refunded/cancelled amount</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <h3 className="text-3xl font-bold text-gray-700 mt-2">₹{paymentData.failed.toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mt-1">Failed payment amount</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Summary</CardTitle>
          <CardDescription>Overview of all payment statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 h-[300px]">
              {hasPaymentData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-center">
                    No payment data available for the selected filter.
                  </p>
                </div>
              )}
            </div>
            <div className="w-full md:w-1/2 space-y-4 mt-6 md:mt-0 md:pl-6">
              <div className="flex justify-between items-center">
                <p className="text-base font-medium">Completed Amount:</p>
                <p className="text-lg font-semibold">₹{paymentData.completed.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-base font-medium">Pending Amount:</p>
                <p className="text-lg font-semibold">₹{paymentData.pending.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-base font-medium">Cancelled/Refunded:</p>
                <p className="text-lg font-semibold">₹{paymentData.cancelled.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-base font-medium">Failed Amount:</p>
                <p className="text-lg font-semibold">₹{paymentData.failed.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
          <CardDescription>Daily revenue performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.revenueTrend}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.split(' ')[0]}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4f46e5" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Business Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Business Performance</CardTitle>
            <CardDescription>Monthly metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="text-muted-foreground">Monthly Revenue</div>
                <div className="font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-muted-foreground">Monthly Orders</div>
                <div className="font-bold">{stats.monthlyOrders.toLocaleString()}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-muted-foreground">Order Completion Rate</div>
                <div className="flex items-center">
                  <div className="font-bold">{stats.orderCompletionRate.toFixed(1)}%</div>
                  <div className="ml-2 text-green-500">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Insights</CardTitle>
            <CardDescription>Customer-related metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="text-muted-foreground">New Customers</div>
                <div className="flex items-center">
                  <div className="font-bold">+{stats.newCustomers.toLocaleString()}</div>
                  <div className="ml-2 text-green-500">
                    <ArrowUp className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="text-muted-foreground">Average Rating</div>
                <div className="flex items-center">
                  <div className="font-bold">{stats.averageRating.toFixed(1)}★</div>
                  <div className="ml-2 text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="text-muted-foreground">Total Customers</div>
                <div className="font-bold">{stats.totalUsers.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Product Insights</CardTitle>
            <CardDescription>Product-related metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="text-muted-foreground">Total Products</div>
                <div className="font-bold">{stats.totalProducts.toLocaleString()}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-muted-foreground">Average Order Value</div>
                <div className="font-bold">₹{stats.averageOrderValue.toFixed(2)}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-muted-foreground">Best Seller</div>
                <div className="flex items-center">
                  <Badge variant="outline" className="truncate max-w-[140px]">
                    {stats.bestSellingProduct ? stats.bestSellingProduct.substring(0, 8) : "Coming Soon"}
                  </Badge>
                  <div className="ml-2 text-gray-500 text-xs">
                    {stats.bestSellingProduct ? "Active" : "Coming Soon"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
