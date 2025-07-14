import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import CouponForm from "./CouponForm";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_amount: number;
  max_usage_count: number | null;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

const CouponList: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure we have valid coupon data
      if (!data) {
        setCoupons([]);
        return;
      }
      
      // Map and validate the coupon data
      const typedData: Coupon[] = data.map(coupon => ({
        id: coupon.id,
        code: coupon.code || '',
        description: coupon.description || '',
        discount_type: coupon.discount_type === 'fixed' ? 'fixed' as const : 'percentage' as const,
        discount_value: Number(coupon.discount_value) || 0,
        minimum_order_amount: Number(coupon.minimum_order_amount) || 0,
        max_usage_count: coupon.max_usage_count ? Number(coupon.max_usage_count) : null,
        valid_until: coupon.valid_until || new Date().toISOString(),
        is_active: Boolean(coupon.is_active),
        created_at: coupon.created_at || new Date().toISOString(),
      }));
      
      setCoupons(typedData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "Error",
        description: "Failed to load coupons. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Coupon deleted successfully.",
      });

      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Error",
        description: "Failed to delete coupon. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    fetchCoupons();
    setShowForm(false);
    setSelectedCoupon(null);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading coupons...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min. Order</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No coupons found. Create your first coupon to get started.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">
                    <div className="font-mono bg-muted px-2 py-1 rounded inline-block">
                      {coupon.code}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={coupon.description}>
                    {coupon.description || '-'}
                  </TableCell>
                  <TableCell>
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%` 
                      : `₹${coupon.discount_value.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    {coupon.minimum_order_amount > 0 
                      ? `₹${coupon.minimum_order_amount.toFixed(2)}` 
                      : 'Any'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(coupon.valid_until), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(coupon)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <CouponForm
          coupon={selectedCoupon}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedCoupon(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default CouponList;
