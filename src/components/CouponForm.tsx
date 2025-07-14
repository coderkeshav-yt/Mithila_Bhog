
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CouponFormProps {
  coupon?: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CouponForm: React.FC<CouponFormProps> = ({ coupon, open, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validUntil, setValidUntil] = useState<Date>();
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order_amount: '',
    max_usage_count: '',
    is_active: true,
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || '',
        description: coupon.description || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value?.toString() || '',
        minimum_order_amount: coupon.minimum_order_amount?.toString() || '',
        max_usage_count: coupon.max_usage_count?.toString() || '',
        is_active: coupon.is_active ?? true,
      });
      setValidUntil(coupon.valid_until ? new Date(coupon.valid_until) : undefined);
    } else {
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order_amount: '',
        max_usage_count: '',
        is_active: true,
      });
      setValidUntil(undefined);
    }
  }, [coupon, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discount_value || !validUntil) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        minimum_order_amount: formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : 0,
        max_usage_count: formData.max_usage_count ? parseInt(formData.max_usage_count) : null,
        valid_until: validUntil.toISOString(),
        is_active: formData.is_active,
      };

      let error;
      if (coupon) {
        const { error: updateError } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', coupon.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('coupons')
          .insert([couponData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Coupon ${coupon ? 'updated' : 'created'} successfully.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast({
        title: "Error",
        description: "Failed to save coupon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{coupon ? 'Edit Coupon' : 'Add New Coupon'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="code">Coupon Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., SAVE20"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the coupon"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount_type">Discount Type *</Label>
              <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="discount_value">
                Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="minimum_order_amount">Minimum Order Amount (₹)</Label>
            <Input
              id="minimum_order_amount"
              type="number"
              value={formData.minimum_order_amount}
              onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="max_usage_count">Maximum Usage Count</Label>
            <Input
              id="max_usage_count"
              type="number"
              value={formData.max_usage_count}
              onChange={(e) => setFormData({ ...formData, max_usage_count: e.target.value })}
              placeholder="Leave empty for unlimited"
              min="1"
            />
          </div>

          <div>
            <Label>Valid Until *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validUntil ? format(validUntil, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={validUntil}
                  onSelect={setValidUntil}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : coupon ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CouponForm;
