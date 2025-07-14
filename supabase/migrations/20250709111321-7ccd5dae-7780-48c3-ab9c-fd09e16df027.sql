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