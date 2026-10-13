import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../services/analyticsService';

export const AnalyticsRouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Captura o título atual do documento
    const title = document.title || 'KARIRI – Guia Digital do Cariri Cearense';
    analytics.trackPageView(location.pathname + location.search, title);
  }, [location.pathname, location.search]);

  return null;
};
