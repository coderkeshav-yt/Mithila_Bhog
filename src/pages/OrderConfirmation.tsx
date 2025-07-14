
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Package, Truck, CreditCard, MapPin, Calendar, ArrowRight } from "lucide-react";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string;
    category: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  coupon_discount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  shipping_address: any;
  created_at: string;
  order_items: OrderItem[];
}

const OrderConfirmation = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (orderNumber) {
      loadOrder();
    }
  }, [user, orderNumber]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url,
              category
            )
          )
        `)
        .eq('order_number', orderNumber)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading order:', error);
        toast({
          title: "Error",
          description: "Failed to load order details.",
          variant: "destructive"
        });
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll send you updates as your order is processed.
            </p>
          </div>

          {/* Order Summary Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order #{order.order_number}</CardTitle>
                <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'cod_pending' ? 'COD' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Order Status</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Order Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <img
                      src={item.products.image_url || "/placeholder.svg"}
                      alt={item.products.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.products.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.products.category}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{item.price}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{(order.total_amount + (order.coupon_discount || 0)).toFixed(2)}</span>
                  </div>
                  {order.coupon_discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{order.coupon_discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shipping_address ? (
                    <div className="space-y-2">
                      <p className="font-medium">{order.shipping_address.full_name}</p>
                      <p className="text-sm text-muted-foreground">{order.shipping_address.phone}</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{order.shipping_address.address_line1}</p>
                        {order.shipping_address.address_line2 && (
                          <p>{order.shipping_address.address_line2}</p>
                        )}
                        <p>
                          {order.shipping_address.city}
                          {order.shipping_address.state && `, ${order.shipping_address.state}`}
                          {order.shipping_address.postal_code && ` - ${order.shipping_address.postal_code}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No shipping address provided</p>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate(`/track-order?order=${order.order_number}`)}
                  className="w-full"
                  variant="default"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Track Your Order
                </Button>
                <Button 
                  onClick={() => navigate('/products')}
                  variant="outline"
                  className="w-full"
                >
                  Continue Shopping
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
