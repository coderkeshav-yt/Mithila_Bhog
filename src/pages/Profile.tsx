
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Phone, Mail, Plus, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Json } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface DeliveryAddress {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  delivery_address: Json | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean | null;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deliveryAddresses, setDeliveryAddresses] = useState<DeliveryAddress[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<Omit<DeliveryAddress, 'id'>>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    isDefault: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    console.log('Fetching user profile in Profile component');
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching user profile data...');
      
      // Check for cached profile first
      const cachedProfile = localStorage.getItem(`profile_${user.id}`);
      const cacheTimestamp = localStorage.getItem(`profile_timestamp_${user.id}`);
      const now = Date.now();
      const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity;
      const cacheValid = cacheAge < 10 * 60 * 1000; // 10 minutes cache validity
      
      // Use cache if valid and available
      if (cachedProfile && cacheValid) {
        try {
          const parsedProfile = JSON.parse(cachedProfile);
          console.log('Using cached profile data');
          setProfile(parsedProfile);
          
          // Parse delivery addresses from cached profile
          if (parsedProfile.delivery_address) {
            const addresses = parseDeliveryAddresses(parsedProfile.delivery_address);
            setDeliveryAddresses(addresses);
          }
          
          setLoading(false);
          
          // Refresh cache in background after a short delay
          setTimeout(() => fetchFromSupabase(false), 1000);
          return;
        } catch (e) {
          console.error('Error parsing cached profile:', e);
          // Continue with normal fetch if cache parsing fails
        }
      }
      
      // Set a shorter timeout to prevent getting stuck in loading state
      const timeoutId = setTimeout(() => {
        console.log('Profile fetch timeout reached, creating default profile');
        createDefaultProfile();
        toast({
          title: "Connection Issue",
          description: "Profile data is taking longer than expected to load.",
          variant: "warning"
        });
      }, 4000); // Reduced from 8s to 4s timeout
      
      await fetchFromSupabase(true, timeoutId);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setError("An unexpected error occurred. Please try refreshing the page.");
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      
      createDefaultProfile();
    }
  };
  
  // Helper function to parse delivery addresses
  const parseDeliveryAddresses = (addressData: Json | null): DeliveryAddress[] => {
    if (!addressData || !Array.isArray(addressData)) return [];
    
    return addressData.filter((item): item is DeliveryAddress => 
      item && 
      typeof item === 'object' &&
      'id' in item &&
      'fullName' in item &&
      'phone' in item &&
      'address' in item &&
      'city' in item &&
      'state' in item &&
      'pinCode' in item &&
      'isDefault' in item
    );
  };
  
  // Separate function to fetch from Supabase
  const fetchFromSupabase = async (updateUI = true, timeoutId?: NodeJS.Timeout) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Clear the timeout if it exists
      if (timeoutId) clearTimeout(timeoutId);

      if (error) {
        console.error('Error fetching profile:', error);
        if (updateUI) {
          toast({
            title: "Error",
            description: "Failed to load profile data. Creating a new profile.",
            variant: "destructive"
          });
          
          // Create a new profile since one doesn't exist
          await createNewProfile();
        }
        return;
      }

      if (data) {
        console.log('Profile data retrieved successfully');
        
        // Cache the profile data
        try {
          localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
          localStorage.setItem(`profile_timestamp_${user.id}`, Date.now().toString());
        } catch (e) {
          console.error('Error caching profile:', e);
        }
        
        if (updateUI) {
          setProfile(data);
          // Parse delivery addresses from JSON
          if (data.delivery_address) {
            try {
              const addresses = parseDeliveryAddresses(data.delivery_address);
              setDeliveryAddresses(addresses);
            } catch (parseError) {
              console.error('Error parsing delivery addresses:', parseError);
              setDeliveryAddresses([]);
            }
          }
          setLoading(false);
        }
      } else {
        console.log('No profile data found, creating new profile');
        if (updateUI) {
          await createNewProfile();
        }
      }
    } catch (error) {
      console.error('Error in fetchFromSupabase:', error);
      if (updateUI) {
        setError("An unexpected error occurred. Please try refreshing the page.");
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
        
        createDefaultProfile();
      }
    }
  };

  const createNewProfile = async () => {
    if (!user) return;
    
    try {
      // Create a new profile if none exists
      const newProfile = {
        user_id: user.id,
        email: user.email,
        first_name: '',
        last_name: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: createError, data } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating profile:', createError);
        toast({
          title: "Error",
          description: "Failed to create profile. Please try again.",
          variant: "destructive"
        });
        
        createDefaultProfile();
      } else if (data) {
        console.log('Profile created successfully:', data);
        setProfile(data);
        setDeliveryAddresses([]);
      } else {
        console.log('Profile created but no data returned, fetching again');
        setTimeout(() => fetchProfile(), 500);
      }
    } catch (error) {
      console.error('Error in createNewProfile:', error);
      createDefaultProfile();
    }
  };
  
  const createDefaultProfile = () => {
    if (!user) return;
    
    // Set a default profile so the UI can render
    setProfile({
      id: 'temp-id',
      user_id: user.id,
      first_name: '',
      last_name: '',
      email: user.email,
      phone: null,
      avatar_url: null,
      delivery_address: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_admin: false
    });
    
    setDeliveryAddresses([]);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user || !newAddress.fullName || !newAddress.address || !newAddress.pinCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Create a new address with a unique ID
      const newAddressWithId: DeliveryAddress = {
        ...newAddress,
        id: `addr_${Date.now()}`
      };

      // If this is the first address or marked as default, make it default
      if (deliveryAddresses.length === 0 || newAddressWithId.isDefault) {
        // If this is the new default, unset default on all other addresses
        const updatedAddresses = deliveryAddresses.map(addr => ({
          ...addr,
          isDefault: false
        }));
        updatedAddresses.push({...newAddressWithId, isDefault: true});
        setDeliveryAddresses(updatedAddresses);
      } else {
        setDeliveryAddresses([...deliveryAddresses, newAddressWithId]);
      }

      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          delivery_address: deliveryAddresses.length === 0 
            ? [newAddressWithId] 
            : [...deliveryAddresses.map(addr => ({
                ...addr,
                isDefault: newAddressWithId.isDefault ? false : addr.isDefault
              })), newAddressWithId]
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Reset form
      setNewAddress({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pinCode: '',
        isDefault: false
      });
      
      setShowAddressForm(false);
      
      toast({
        title: "Success",
        description: "Address added successfully!",
      });
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setSaving(true);
      
      // Filter out the address to delete
      const updatedAddresses = deliveryAddresses.filter(addr => addr.id !== addressId);
      
      // If we deleted the default address, make the first one the new default
      if (deliveryAddresses.find(addr => addr.id === addressId)?.isDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }
      
      setDeliveryAddresses(updatedAddresses);
      
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          delivery_address: updatedAddresses
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Address deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive"
      });
      
      // Reload addresses to ensure consistency
      fetchProfile();
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setSaving(true);
      
      // Update addresses to set the new default
      const updatedAddresses = deliveryAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
      
      setDeliveryAddresses(updatedAddresses);
      
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          delivery_address: updatedAddresses
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Default address updated!",
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      toast({
        title: "Error",
        description: "Failed to update default address. Please try again.",
        variant: "destructive"
      });
      
      // Reload addresses to ensure consistency
      fetchProfile();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => fetchProfile()}>Retry</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile?.first_name || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile?.last_name || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                      placeholder="Last name"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile?.phone || ''}
                    onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                    placeholder="Phone number"
                  />
                </div>
                
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.email}</span>
              </div>
              
              {profile?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              
              {deliveryAddresses.find(addr => addr.isDefault) && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Default Address:</p>
                    <p>{deliveryAddresses.find(addr => addr.isDefault)?.fullName}</p>
                    <p>{deliveryAddresses.find(addr => addr.isDefault)?.address}</p>
                    <p>{deliveryAddresses.find(addr => addr.isDefault)?.city}, {deliveryAddresses.find(addr => addr.isDefault)?.state}</p>
                    <p>{deliveryAddresses.find(addr => addr.isDefault)?.pinCode}</p>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div className="pt-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/track-order">
                    View Order History
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Addresses Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Delivery Addresses</h2>
            <Button 
              onClick={() => setShowAddressForm(!showAddressForm)}
              variant={showAddressForm ? "outline" : "default"}
            >
              {showAddressForm ? (
                'Cancel'
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </>
              )}
            </Button>
          </div>
          
          {/* Add Address Form */}
          {showAddressForm && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress(prev => ({...prev, fullName: e.target.value}))}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress(prev => ({...prev, phone: e.target.value}))}
                      placeholder="Phone number"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress(prev => ({...prev, address: e.target.value}))}
                    placeholder="Street address, apartment, etc."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress(prev => ({...prev, city: e.target.value}))}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress(prev => ({...prev, state: e.target.value}))}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pinCode">PIN Code *</Label>
                    <Input
                      id="pinCode"
                      value={newAddress.pinCode}
                      onChange={(e) => setNewAddress(prev => ({...prev, pinCode: e.target.value}))}
                      placeholder="PIN code"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress(prev => ({...prev, isDefault: e.target.checked}))}
                    className="mr-2"
                  />
                  <Label htmlFor="isDefault">Set as default address</Label>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={handleAddAddress}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Adding...
                      </>
                    ) : (
                      'Add Address'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Address List */}
          {deliveryAddresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryAddresses.map((address) => (
                <Card key={address.id} className={address.isDefault ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{address.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{address.phone}</p>
                      </div>
                      {address.isDefault && (
                        <Badge variant="outline" className="border-primary text-primary">Default</Badge>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm">{address.address}</p>
                      <p className="text-sm">{address.city}, {address.state}</p>
                      <p className="text-sm">{address.pinCode}</p>
                    </div>
                    
                    <div className="mt-4 flex justify-between">
                      {!address.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSetDefaultAddress(address.id)}
                          disabled={saving}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteAddress(address.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">You haven't added any delivery addresses yet.</p>
                {!showAddressForm && (
                  <Button 
                    onClick={() => setShowAddressForm(true)}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Address
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
