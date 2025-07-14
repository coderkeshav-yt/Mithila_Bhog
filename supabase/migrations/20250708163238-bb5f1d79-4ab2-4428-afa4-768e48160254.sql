-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE profiles.user_id = $1 LIMIT 1),
    false
  );
$$;

-- Create simplified RLS policies that avoid recursion
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create a separate admin policy using the security definer function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR ALL
USING (public.is_admin_user(auth.uid()));

-- Also fix other tables that might have similar issues
-- Update products policies to use the admin function
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (public.is_admin_user(auth.uid()));

-- Update contact_messages policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update message status" ON public.contact_messages;

CREATE POLICY "Admins can view all messages"
ON public.contact_messages
FOR SELECT
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update message status"
ON public.contact_messages
FOR UPDATE
USING (public.is_admin_user(auth.uid()));

-- Update orders policies
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.is_admin_user(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.is_admin_user(auth.uid()));

-- Update order_items policies
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create order items for their orders"
ON public.order_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (
  public.is_admin_user(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);