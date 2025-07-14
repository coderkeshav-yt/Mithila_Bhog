
-- Add delivery_address field to profiles table for saved addresses
ALTER TABLE public.profiles 
ADD COLUMN delivery_address JSONB DEFAULT NULL;

-- Create a table for storing product reviews if it doesn't exist with proper structure
-- (The product_reviews table already exists, so we'll just add an index for better performance)
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);

-- Add a function to calculate total revenue
CREATE OR REPLACE FUNCTION public.calculate_revenue()
RETURNS TABLE (
  total_revenue NUMERIC,
  delivered_revenue NUMERIC,
  pending_revenue NUMERIC,
  success_revenue NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as delivered_revenue,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_revenue,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as success_revenue
  FROM public.orders;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_revenue() TO authenticated;
