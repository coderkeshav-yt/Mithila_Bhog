import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, CheckCircle, XCircle, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRevenueContext } from "../contexts/RevenueContext";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderHistoryProps {
  user: any;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ user }) => {
  const { refreshRevenue } = useRevenueContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Helper functions
  const getFilteredOrders = (status: string): Order[] => {
    return orders.filter(order => order.status.toLowerCase() === status.toLowerCase());
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTabCount = (status: string): number => {
    return getFilteredOrders(status).length;
  };

  const getStatusIcon = (status: string): JSX.Element | null => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'shipped':
        return <Package className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: order, error: getOrderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (getOrderError) throw getOrderError;

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          payment_status: newStatus === 'completed' ? 'paid' : order.payment_status
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      refreshRevenue();
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Failed to update order status. Please try again.");
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: ordersData, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total_amount,
          created_at,
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Order History</h2>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchOrders}>Try Again</Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-foreground mb-2">No orders yet</h3>
        <p className="text-muted-foreground mb-6">
          When you place your first order, it will appear here.
        </p>
        <Button asChild>
          <a href="/products">Start Shopping</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Order History</h2>
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
          {orders.length} orders
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({getTabCount('pending')})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({getTabCount('processing')})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getTabCount('completed')})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({getTabCount('cancelled')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-4">
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Order #{order.order_number}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Details
                        </Button>
                        <Select
                          value={selectedStatus}
                          onValueChange={(value) => {
                            setSelectedStatus(value);
                            updateOrderStatus(order.id, value);
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Change Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="h-8 w-8 rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.products.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ₹{item.price} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Total:</p>
                      <p className="font-bold">₹{order.total_amount}</p>
                    </div>
                    {order.order_items.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.order_items.length - 2} more items
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/order-confirmation/${order.order_number}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/track-order?orderNumber=${order.order_number}`}>
                        <Package className="h-4 w-4 mr-1" />
                        Track Order
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="pt-4">
          <div className="space-y-4">
            {getFilteredOrders('pending').map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Order #{order.order_number}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Details
                        </Button>
                        <Select
                          value={selectedStatus}
                          onValueChange={(value) => {
                            setSelectedStatus(value);
                            updateOrderStatus(order.id, value);
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Change Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="h-8 w-8 rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.products.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ₹{item.price} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Total:</p>
                      <p className="font-bold">₹{order.total_amount}</p>
                    </div>
                    {order.order_items.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.order_items.length - 2} more items
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/order-confirmation/${order.order_number}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/track-order?orderNumber=${order.order_number}`}>
                        <Package className="h-4 w-4 mr-1" />
                        Track Order
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="processing" className="pt-4">
          <div className="space-y-4">
            {getFilteredOrders('processing').map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Order #{order.order_number}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Details
                        </Button>
                        <Select
                          value={selectedStatus}
                          onValueChange={(value) => {
                            setSelectedStatus(value);
                            updateOrderStatus(order.id, value);
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Change Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="h-8 w-8 rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.products.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ₹{item.price} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Total:</p>
                      <p className="font-bold">₹{order.total_amount}</p>
                    </div>
                    {order.order_items.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.order_items.length - 2} more items
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/order-confirmation/${order.order_number}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/track-order?orderNumber=${order.order_number}`}>
                        <Package className="h-4 w-4 mr-1" />
                        Track Order
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="pt-4">
          <div className="space-y-4">
            {getFilteredOrders('completed').map((order) => (
              <Card key={order.id} className="border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on {format(new Date(order.created_at), 'PPP')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getStatusColor(order.status)} mb-2`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </Badge>
                      <Select
                        value={selectedOrderId === order.id ? selectedStatus : order.status}
                        onValueChange={(value) => {
                          setSelectedOrderId(order.id);
                          setSelectedStatus(value);
                          updateOrderStatus(order.id, value);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-lg font-semibold">₹{order.total_amount}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.order_items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <img
                            src={item.products.image_url || "/placeholder.svg"}
                            alt={item.products.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.products.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {order.order_items.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.order_items.length - 2} more items
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/order-confirmation/${order.order_number}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/track-order?orderNumber=${order.order_number}`}>
                          <Package className="h-4 w-4 mr-1" />
                          Track Order
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="pt-4">
          <div className="space-y-4">
            {getFilteredOrders('cancelled').map((order) => (
              <Card key={order.id} className="border shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on {format(new Date(order.created_at), 'PPP')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getStatusColor(order.status)} mb-2`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </Badge>
                      <Select
                        value={selectedOrderId === order.id ? selectedStatus : order.status}
                        onValueChange={(value) => {
                          setSelectedOrderId(order.id);
                          setSelectedStatus(value);
                          updateOrderStatus(order.id, value);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-lg font-semibold">₹{order.total_amount}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.order_items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <img
                            src={item.products.image_url || "/placeholder.svg"}
                            alt={item.products.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.products.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {order.order_items.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.order_items.length - 2} more items
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/order-confirmation/${order.order_number}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/track-order?orderNumber=${order.order_number}`}>
                          <Package className="h-4 w-4 mr-1" />
                          Track Order
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderHistory;
