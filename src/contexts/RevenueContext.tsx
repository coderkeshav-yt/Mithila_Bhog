import React, { createContext, useContext, useEffect, useState } from 'react';

interface RevenueContextType {
  refreshRevenue: () => void;
  forceRefresh: () => void;
  refreshCount: number;
  lastRefreshed: Date | null;
}

const RevenueContext = createContext<RevenueContextType | undefined>(undefined);

export const RevenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const refreshRevenue = () => {
    setRefreshCount(prev => prev + 1);
    setLastRefreshed(new Date());
  };

  // Force refresh with a timestamp to ensure components update
  const forceRefresh = () => {
    // Double refresh to ensure components update
    setRefreshCount(prev => prev + 1);
    setLastRefreshed(new Date());
    
    // Add a slight delay and refresh again to ensure updates
    setTimeout(() => {
      setRefreshCount(prev => prev + 1);
      setLastRefreshed(new Date());
      
      // One more refresh after a longer delay to catch any async updates
      setTimeout(() => {
        setRefreshCount(prev => prev + 1);
        setLastRefreshed(new Date());
      }, 1000);
    }, 300);
  };

  return (
    <RevenueContext.Provider value={{ 
      refreshRevenue, 
      forceRefresh,
      refreshCount, 
      lastRefreshed 
    }}>
      {children}
    </RevenueContext.Provider>
  );
};

export const useRevenueContext = () => {
  const context = useContext(RevenueContext);
  if (context === undefined) {
    throw new Error('useRevenueContext must be used within a RevenueProvider');
  }
  return context;
};

export default RevenueContext;
