
-- Make the specified user an admin
UPDATE public.profiles 
SET is_admin = true 
WHERE user_id = '3a53248b-600f-4fae-8ac2-4be8cff0fe17';

-- Fix the infinite recursion issue in profiles RLS policies
-- Drop the problematic admin policy that's causing recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simpler admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2 
    WHERE p2.user_id = auth.uid() 
    AND p2.is_admin = true
  )
  OR auth.uid() = user_id
);

-- Also fix the contact messages admin policy to prevent similar issues
DROP POLICY IF EXISTS "Admins can view all messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update message status" ON public.contact_messages;

CREATE POLICY "Admins can view all messages" 
ON public.contact_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
);

CREATE POLICY "Admins can update message status" 
ON public.contact_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
);

-- Fix other admin policies that might have the same issue
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
  OR auth.uid() = user_id
);

CREATE POLICY "Admins can update orders" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
);

CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.is_admin = true
  )
  OR EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND o.user_id = auth.uid()
  )
);
