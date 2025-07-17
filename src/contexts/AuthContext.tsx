
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  adminCheckComplete: boolean;
  checkAdminStatus: (userId: string) => Promise<boolean>;
  forceAdminCheck: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const { toast } = useToast();

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking admin status for user:', userId);
      setAdminCheckComplete(false);
      
      // Set a timeout to prevent getting stuck in checking state
      const timeoutId = setTimeout(() => {
        console.log('Admin check timeout reached, setting default values');
        setIsAdmin(false);
        setAdminCheckComplete(true);
      }, 5000); // 5 second timeout
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .single();
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setAdminCheckComplete(true);
        return false;
      }
      
      const adminStatus = profile?.is_admin || false;
      console.log('Admin status result:', adminStatus);
      setIsAdmin(adminStatus);
      setAdminCheckComplete(true);
      return adminStatus;
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setIsAdmin(false);
      setAdminCheckComplete(true);
      return false;
    }
  };
  
  const forceAdminCheck = async (): Promise<void> => {
    if (user) {
      await checkAdminStatus(user.id);
    } else {
      console.error('Cannot check admin status: No user logged in');
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    setAdminCheckComplete(false);
    
    // Set a shorter timeout to prevent getting stuck in loading state
    const globalTimeoutId = setTimeout(() => {
      console.log('Auth check timeout reached, setting default values');
      setLoading(false);
      setAdminCheckComplete(true);
      toast({
        title: "Connection Issue",
        description: "Authentication service is responding slowly. Some features may be limited.",
        variant: "warning"
      });
    }, 5000); // Reduced from 8s to 5s timeout
    
    // Set up auth state listener with error handling
    let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} };
    try {
      const authSubscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Check admin status immediately with a timeout
            const adminCheckPromise = checkAdminStatus(session.user.id);
            const timeoutPromise = new Promise<boolean>((resolve) => {
              setTimeout(() => resolve(false), 3000);
            });
            
            // Race between admin check and timeout
            const adminStatus = await Promise.race([adminCheckPromise, timeoutPromise]);
            if (!adminStatus) {
              console.log('Admin check timed out, using default value');
            }
          } else {
            setIsAdmin(false);
            setAdminCheckComplete(true);
          }
          
          setLoading(false);
          clearTimeout(globalTimeoutId); // Clear timeout as we got a response
        }
      );
      
      subscription = authSubscription.data.subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
      setAdminCheckComplete(true);
    }

    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        
        // Set a timeout for the session fetch
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{data: {session: null}, error: Error}>((resolve) => {
          setTimeout(() => resolve({
            data: {session: null},
            error: new Error('Session fetch timed out')
          }), 3000);
        });
        
        // Race between session fetch and timeout
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const { data: { session }, error } = result;
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          setAdminCheckComplete(true);
          return;
        }
        
        console.log('Initial session:', session?.user?.email || 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        } else {
          setAdminCheckComplete(true);
        }
        
        setLoading(false);
        clearTimeout(globalTimeoutId); // Clear timeout as we got a response
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setLoading(false);
        setAdminCheckComplete(true);
        toast({
          title: "Authentication Error",
          description: "There was a problem connecting to the authentication service.",
          variant: "destructive"
        });
      }
    };

    getInitialSession();

    return () => {
      console.log('Cleaning up auth subscription');
      clearTimeout(globalTimeoutId);
      subscription.unsubscribe();
    };
  }, [toast]); // Added toast to dependencies

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setAdminCheckComplete(false);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
      setAdminCheckComplete(true);
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      // Admin status will be checked by the auth state listener
    }

    return { error };
  };

  const signOut = async () => {
    setAdminCheckComplete(false);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    }
    setIsAdmin(false);
    setAdminCheckComplete(true);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    adminCheckComplete,
    checkAdminStatus,
    forceAdminCheck
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
