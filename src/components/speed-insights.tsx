import { useEffect } from 'react';

const SpeedInsights = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://vitals.vercel-analytics.com/vitals.js';
    script.async = true;
    document.body.appendChild(script);

    window.vercelId = 'YOUR_VERCEL_PROJECT_ID';

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default SpeedInsights;
