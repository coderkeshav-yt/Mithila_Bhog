
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, Package, CheckCircle } from "lucide-react";

interface RevenueData {
  total_revenue: number;
  delivered_revenue: number;
  pending_revenue: number;
  success_revenue: number;
}

const AdminRevenue = () => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('calculate_revenue');
      
      if (error) {
        console.error('Error loading revenue data:', error);
        return;
      }

      if (data && data.length > 0) {
        setRevenueData(data[0]);
      }
    } catch (error) {
      console.error('Error in loadRevenueData:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹0.00</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!revenueData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No revenue data available</p>
        </CardContent>
      </Card>
    );
  }

  const revenueCards = [
    {
      title: "Total Revenue",
      value: revenueData.total_revenue,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Success Revenue",
      value: revenueData.success_revenue,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Delivered Revenue",
      value: revenueData.delivered_revenue,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Pending Revenue",
      value: revenueData.pending_revenue,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {revenueCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Number(card.value).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Revenue from orders
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminRevenue;
