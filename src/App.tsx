import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AppRoutes } from './routes/AppRoutes';
import { AnalyticsRouteTracker } from './components/common/AnalyticsRouteTracker';

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsRouteTracker />
      <AuthProvider>
        <CityProvider>
          <FavoritesProvider>
            <AppRoutes />
          </FavoritesProvider>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
