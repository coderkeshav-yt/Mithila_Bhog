import { useEffect } from 'react';

const SpeedInsights = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://vitals.vercel-analytics.com/vitals.js';
    script.async = true;
    document.body.appendChild(script);

    window.vercelId = 'prj_YXm3MnReMsF5djo6CQCXyFD9bFRd';

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default SpeedInsights;
