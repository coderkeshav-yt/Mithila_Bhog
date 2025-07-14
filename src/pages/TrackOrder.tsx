import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail, AlertCircle } from "lucide-react";

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

interface ShippingAddress {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
  shipping_address: ShippingAddress | null;
  order_items: OrderItem[];
}

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const getOrderTimeline = (order: Order) => {
    const timeline = [
      {
        status: "Order Placed",
        date: new Date(order.created_at).toLocaleString(),
        completed: true,
        description: "Your order has been placed successfully"
      },
      {
        status: "Payment Confirmed",
        date: order.payment_status === 'paid' ? new Date(order.created_at).toLocaleString() : "Pending",
        completed: order.payment_status === 'paid' || order.payment_status === 'cod_pending',
        description: order.payment_status === 'cod_pending' ? "COD order confirmed" : "Payment processed successfully"
      },
      {
        status: "Order Processing",
        date: order.status !== 'pending' ? "Processing" : "Pending",
        completed: order.status !== 'pending',
        description: "Your order is being prepared for dispatch"
      },
      {
        status: "Shipped",
        date: order.status === 'shipped' || order.status === 'delivered' ? "Shipped" : "Pending",
        completed: order.status === 'shipped' || order.status === 'delivered',
        description: "Your order is on the way to delivery address"
      },
      {
        status: "Delivered",
        date: order.status === 'delivered' ? "Delivered" : "Pending",
        completed: order.status === 'delivered',
        description: "Order delivered to your address"
      }
    ];

    return timeline;
  };

  const getEstimatedDelivery = (order: Order) => {
    const orderDate = new Date(order.created_at);
    const estimatedDate = new Date(orderDate);
    
    switch (order.status) {
      case 'pending':
        estimatedDate.setDate(orderDate.getDate() + 5);
        break;
      case 'processing':
        estimatedDate.setDate(orderDate.getDate() + 3);
        break;
      case 'shipped':
        estimatedDate.setDate(orderDate.getDate() + 1);
        break;
      case 'delivered':
        return "Delivered";
      default:
        estimatedDate.setDate(orderDate.getDate() + 5);
    }
    
    return estimatedDate.toLocaleDateString();
  };

  const getCurrentLocation = (status: string) => {
    switch (status) {
      case 'pending':
        return "Order Processing Center";
      case 'processing':
        return "Warehouse - Packaging";
      case 'shipped':
        return "In Transit";
      case 'delivered':
        return "Delivered";
      default:
        return "Processing Center";
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your order number.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First, try to find the order by order number
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('order_number', orderNumber.trim())
        .single();

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          toast({
            title: "Order Not Found",
            description: "No order found with this order number. Please check and try again.",
            variant: "destructive"
          });
        } else {
          throw orderError;
        }
        return;
      }

      // If phone number is provided, verify it matches the shipping address
      if (phoneNumber.trim() && orderData.shipping_address) {
        const shippingAddress = orderData.shipping_address as ShippingAddress;
        const shippingPhone = shippingAddress.phone;
        if (shippingPhone && !shippingPhone.includes(phoneNumber.trim())) {
          toast({
            title: "Phone Number Mismatch",
            description: "The phone number doesn't match our records for this order.",
            variant: "destructive"
          });
          return;
        }
      }

      // Cast the shipping_address from Json to ShippingAddress
      const processedOrder: Order = {
        ...orderData,
        shipping_address: orderData.shipping_address as ShippingAddress | null
      };

      setTrackingResult(processedOrder);
      toast({
        title: "Order Found",
        description: "Order details loaded successfully.",
      });

    } catch (error) {
      console.error('Error tracking order:', error);
      toast({
        title: "Error",
        description: "Failed to track order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-track if order number is in URL
  useEffect(() => {
    if (searchParams.get('order')) {
      handleTrackOrder(new Event('submit') as any);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <span>Home</span>
          <span>/</span>
          <span className="text-foreground">Track Order</span>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order details to get real-time tracking information
            </p>
          </div>

          {/* Tracking Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Enter Order Details
              </CardTitle>
              <CardDescription>
                Enter your order number to track your order. Phone number is optional for verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number *</Label>
                    <Input
                      id="orderNumber"
                      placeholder="e.g., ORD-1234567890"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="e.g., +91 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                  {loading ? "Tracking..." : "Track Order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {trackingResult && (
            <div className="space-y-6">
              {/* Order Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Order #{trackingResult.order_number}</CardTitle>
                    <Badge variant={trackingResult.status === 'delivered' ? 'default' : 'secondary'}>
                      {trackingResult.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Estimated Delivery</p>
                        <p className="text-sm text-muted-foreground">
                          {getEstimatedDelivery(trackingResult)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Current Location</p>
                        <p className="text-sm text-muted-foreground">
                          {getCurrentLocation(trackingResult.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">Total Items</p>
                        <p className="text-sm text-muted-foreground">
                          {trackingResult.order_items.length} products
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getOrderTimeline(trackingResult).map((step, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.status}
                            </h4>
                            <span className="text-sm text-muted-foreground">{step.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingResult.order_items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.products.image_url || "/placeholder.svg"}
                            alt={item.products.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg";
                            }}
                          />
                          <div>
                            <h4 className="font-medium text-foreground">{item.products.name}</h4>
                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-medium text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Amount</span>
                      <span>₹{trackingResult.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Having trouble tracking your order? We're here to help!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Call Us</p>
                    <p className="text-sm text-muted-foreground">+91 9876543210</p>
                    <p className="text-xs text-muted-foreground">Mon-Sat, 9AM-7PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@mithilabhog.com</p>
                    <p className="text-xs text-muted-foreground">We'll respond within 24 hours</p>
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="text-center">
                <Button variant="outline" className="w-full md:w-auto">
                  Contact Customer Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
