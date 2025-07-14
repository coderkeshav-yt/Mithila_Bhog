
-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  minimum_order_amount NUMERIC DEFAULT 0,
  max_usage_count INTEGER,
  current_usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create policies for coupons
CREATE POLICY "Anyone can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND valid_until >= now());

CREATE POLICY "Admins can manage coupons" 
ON public.coupons 
FOR ALL 
USING (public.is_admin_user(auth.uid()));

-- Add coupon fields to orders table
ALTER TABLE public.orders 
ADD COLUMN coupon_code TEXT,
ADD COLUMN coupon_discount NUMERIC DEFAULT 0,
ADD COLUMN payment_method TEXT DEFAULT 'online',
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN razorpay_payment_id TEXT,
ADD COLUMN razorpay_order_id TEXT;

-- Create trigger for updating coupons updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coupons_updated_at 
BEFORE UPDATE ON public.coupons 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
