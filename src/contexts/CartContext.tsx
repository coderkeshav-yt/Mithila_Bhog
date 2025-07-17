
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  description?: string;
  weight?: string;
  rating?: number;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load cart items on auth change
  useEffect(() => {
    if (user) {
      // Try to load from cache first, then update from server
      const cachedCart = localStorage.getItem(`cart_${user.id}`);
      const cacheTimestamp = localStorage.getItem(`cart_timestamp_${user.id}`);
      const now = Date.now();
      const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
      const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes cache validity
      
      if (cachedCart && cacheValid) {
        try {
          const parsedCart = JSON.parse(cachedCart);
          setCartItems(parsedCart);
          console.log('Using cached cart data');
          
          // Refresh cache in background after a short delay
          setTimeout(() => loadCartItems(false), 1000);
        } catch (e) {
          console.error('Error parsing cached cart:', e);
          loadCartItems(true);
        }
      } else {
        loadCartItems(true);
      }
    } else {
      setCartItems([]);
    }
  }, [user]);

  const loadCartItems = async (updateUI = true) => {
    if (!user) return;
    
    if (updateUI) setLoading(true);
    
    // Set a timeout to prevent getting stuck in loading state
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (updateUI) {
      timeoutId = setTimeout(() => {
        console.log('Cart fetch timeout reached');
        setLoading(false);
        toast({
          title: "Connection Issue",
          description: "Cart data is taking longer than expected to load.",
          variant: "warning"
        });
      }, 4000); // 4 second timeout
    }
    
    try {
      const fetchPromise = supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          products (
            id,
            name,
            price,
            image_url,
            category,
            description,
            weight,
            rating
          )
        `)
        .eq('user_id', user.id);
      
      // Use Promise.race to implement timeout
      const { data, error } = await fetchPromise;

      // Clear timeout since we got a response
      if (timeoutId) clearTimeout(timeoutId);

      if (error) throw error;

      const items = data?.map(item => ({
        ...item.products,
        quantity: item.quantity
      })) || [];
      
      // Cache the cart data
      try {
        localStorage.setItem(`cart_${user.id}`, JSON.stringify(items));
        localStorage.setItem(`cart_timestamp_${user.id}`, Date.now().toString());
      } catch (e) {
        console.error('Error caching cart:', e);
      }
      
      if (updateUI) {
        setCartItems(items);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      if (updateUI) {
        toast({
          title: "Error",
          description: "Failed to load your cart. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      if (updateUI) setLoading(false);
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  const addToCart = async (product: Omit<CartItem, 'quantity'>) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity
        await updateQuantity(product.id, existingItem.quantity + 1);
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
          });

        if (error) throw error;

        setCartItems(prevItems => [...prevItems, { ...product, quantity: 1 }]);
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart.`,
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setCartItems(prevItems => 
        prevItems.filter(item => item.id !== productId)
      );
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    loading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
