import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ className = "" }) => (
  <div className={`flex items-center justify-center h-full ${className}`}>
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);
