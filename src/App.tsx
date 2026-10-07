import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
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
