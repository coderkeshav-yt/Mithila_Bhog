
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
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        // Parse delivery addresses from JSON
        if (data.delivery_address) {
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
          
          const addresses = parseDeliveryAddresses(data.delivery_address);
          setDeliveryAddresses(addresses);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
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
      const addressWithId: DeliveryAddress = {
        ...newAddress,
        id: Date.now().toString()
      };

      const updatedAddresses = [...deliveryAddresses, addressWithId];
      
      const { error } = await supabase
        .from('profiles')
        .update({
          delivery_address: updatedAddresses as unknown as Json
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setDeliveryAddresses(updatedAddresses);
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
        description: "Delivery address added successfully!",
      });
    } catch (error) {
      console.error('Error adding address:', error);
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const updatedAddresses = deliveryAddresses.filter(addr => addr.id !== addressId);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          delivery_address: updatedAddresses as unknown as Json
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setDeliveryAddresses(updatedAddresses);

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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
            <p className="text-muted-foreground">Unable to load your profile information.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your account information and delivery addresses</p>
          </div>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.first_name || ''}
                      onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.last_name || ''}
                      onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Delivery Addresses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Addresses
                </CardTitle>
                <Button
                  onClick={() => setShowAddressForm(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveryAddresses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No delivery addresses saved. Add one to make checkout faster!
                </p>
              ) : (
                <div className="grid gap-4">
                  {deliveryAddresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-medium">{address.fullName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {address.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} - {address.pinCode}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {address.phone}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Add New Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newFullName">Full Name *</Label>
                      <Input
                        id="newFullName"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPhone">Phone Number *</Label>
                      <Input
                        id="newPhone"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newAddress">Address *</Label>
                    <Textarea
                      id="newAddress"
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="newPinCode">PIN Code *</Label>
                      <Input
                        id="newPinCode"
                        value={newAddress.pinCode}
                        onChange={(e) => setNewAddress({ ...newAddress, pinCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newCity">City</Label>
                      <Input
                        id="newCity"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newState">State</Label>
                      <Input
                        id="newState"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddAddress}>
                      Add Address
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddressForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
