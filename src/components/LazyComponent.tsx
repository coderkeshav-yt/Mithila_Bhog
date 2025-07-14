import { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from './ui/loading-spinner';

type LazyComponentProps = {
  load: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
};

const LazyComponent = ({ 
  load, 
  fallback = <LoadingSpinner />, 
  ...props 
}: LazyComponentProps) => {
  const Component = lazy(load);
  
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

export default LazyComponent;
