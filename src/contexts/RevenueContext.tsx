import React, { createContext, useContext, useEffect, useState } from 'react';

interface RevenueContextType {
  refreshRevenue: () => void;
}

const RevenueContext = createContext<RevenueContextType | undefined>(undefined);

export const RevenueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  const refreshRevenue = () => {
    setRefreshCount(prev => prev + 1);
  };

  return (
    <RevenueContext.Provider value={{ refreshRevenue }}>
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
