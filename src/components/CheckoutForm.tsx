
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Trash2, CreditCard, Truck, MapPin, Gift } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutForm: React.FC = () => {
  const { user } = useAuth();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [usingPrefilledAddress, setUsingPrefilledAddress] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
  });
  const [currentStep, setCurrentStep] = useState(1);

  const total = getTotalPrice();
  const finalTotal = total - discount;
  const FREE_DELIVERY_THRESHOLD = 500;
  const isEligibleForFreeDelivery = finalTotal >= FREE_DELIVERY_THRESHOLD;
  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - finalTotal;

  // Load user profile data and saved addresses
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadSavedAddresses();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profileData) {
        setShippingAddress(prev => ({
          ...prev,
          full_name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
          phone: profileData.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('delivery_address')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading saved addresses:', error);
        return;
      }

      if (profileData?.delivery_address) {
        setSavedAddresses(Array.isArray(profileData.delivery_address) ? profileData.delivery_address : [profileData.delivery_address]);
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const applySavedAddress = (address: any) => {
    setShippingAddress({
      full_name: address.full_name || shippingAddress.full_name,
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      phone: address.phone || shippingAddress.phone,
    });
    setUsingPrefilledAddress(true);
    toast({
      title: "Address Applied",
      description: "Saved address has been applied to the form.",
    });
  };

  const fetchLocationFromPin = async (pincode: string) => {
    if (pincode.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        
        if (data[0].Status === 'Success' && data[0].PostOffice.length > 0) {
          const location = data[0].PostOffice[0];
          setShippingAddress(prev => ({
            ...prev,
            city: location.District,
            state: location.State,
          }));
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Coupon",
          description: "Coupon code is invalid or expired.",
          variant: "destructive"
        });
        return;
      }

      if (data.minimum_order_amount && total < data.minimum_order_amount) {
        toast({
          title: "Minimum Order Amount",
          description: `Minimum order amount for this coupon is ₹${data.minimum_order_amount}`,
          variant: "destructive"
        });
        return;
      }

      let discountAmount = 0;
      if (data.discount_type === 'percentage') {
        discountAmount = (total * data.discount_value) / 100;
      } else {
        discountAmount = data.discount_value;
      }

      setAppliedCoupon(data);
      setDiscount(Math.min(discountAmount, total));
      toast({
        title: "Coupon Applied",
        description: `You saved ₹${discountAmount.toFixed(2)}!`,
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Error",
        description: "Failed to apply coupon.",
        variant: "destructive"
      });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
  };

  const createOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to place an order.",
        variant: "destructive"
      });
      return;
    }

    if (!shippingAddress.full_name || !shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping details.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          order_number: orderNumber,
          total_amount: finalTotal,
          coupon_code: appliedCoupon?.code || null,
          coupon_discount: discount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
          shipping_address: shippingAddress,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (paymentMethod === 'online') {
        const options = {
          key: "rzp_test_9999999999",
          amount: finalTotal * 100,
          currency: "INR",
          name: "Mithila Bhog",
          description: `Order #${orderNumber}`,
          order_id: orderData.id,
          handler: async function (response: any) {
            try {
              await supabase
                .from('orders')
                .update({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  payment_status: 'paid'
                })
                .eq('id', orderData.id);

              clearCart();
              window.location.href = `/order-confirmation/${orderNumber}`;
            } catch (error) {
              console.error('Payment update error:', error);
            }
          },
          prefill: {
            name: shippingAddress.full_name,
            email: user.email,
            contact: shippingAddress.phone
          },
          theme: {
            color: "#10b981"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        clearCart();
        window.location.href = `/order-confirmation/${orderNumber}`;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Forms */}
      <div className="space-y-6">
        {/* Step 1: Shipping Information */}
        {currentStep === 1 && (
          <>
            {/* Free Delivery Banner - Moved to first step */}
            {!isEligibleForFreeDelivery && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Gift className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">
                        Add ₹{remainingForFreeDelivery.toFixed(2)} more for FREE delivery!
                      </p>
                      <p className="text-sm text-green-600">
                        Free delivery on orders above ₹{FREE_DELIVERY_THRESHOLD}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isEligibleForFreeDelivery && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Truck className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">
                        🎉 You've earned FREE delivery!
                      </p>
                      <p className="text-sm text-green-600">
                        Your order qualifies for free shipping
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Coupon Section */}
        {currentStep === 1 && (
          <Card>
          <CardHeader>
            <CardTitle>Coupon Code</CardTitle>
          </CardHeader>
          <CardContent>
            {appliedCoupon ? (
              <div className="flex items-center justify-between">
                <Badge variant="default">{appliedCoupon.code}</Badge>
                <Button variant="outline" size="sm" onClick={removeCoupon}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button variant="outline" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
            {savedAddresses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {savedAddresses.map((address, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applySavedAddress(address)}
                    className="text-xs"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Use Saved Address
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={shippingAddress.full_name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                  id="address_line1"
                  value={shippingAddress.address_line1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input
                  id="address_line2"
                  value={shippingAddress.address_line2}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="postal_code">PIN Code *</Label>
                <Input
                  id="postal_code"
                  value={shippingAddress.postal_code}
                  onChange={(e) => {
                    setShippingAddress({ ...shippingAddress, postal_code: e.target.value });
                    fetchLocationFromPin(e.target.value);
                  }}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Right Column - Order Summary and Payment Method */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className={isEligibleForFreeDelivery ? "text-green-600" : ""}>
                {isEligibleForFreeDelivery ? "FREE" : "₹40"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{(finalTotal + (isEligibleForFreeDelivery ? 0 : 40)).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Moved Payment Method section here */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Online Payment</div>
                    <div className="text-sm text-gray-500">Pay securely with Razorpay</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive your order</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Button 
          onClick={createOrder} 
          disabled={loading || cartItems.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? 'Processing...' : `Place Order (₹${(finalTotal + (isEligibleForFreeDelivery ? 0 : 40)).toFixed(2)})`}
        </Button>
      </div>
    </div>
  );
};

export default CheckoutForm;
