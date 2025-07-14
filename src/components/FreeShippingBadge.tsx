import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FreeShippingBadge: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 hover:bg-green-200 transition-colors shadow-sm">
            <img 
              src="/icons/Free Shipping.png" 
              alt="Free Shipping" 
              className="w-10 h-10 object-contain"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '';
                target.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-10 h-10 flex items-center justify-center text-green-700 font-bold text-base';
                fallback.textContent = 'FS';
                target.parentNode?.insertBefore(fallback, target);
              }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Free Shipping on this item</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FreeShippingBadge;
