import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { ExplorePage } from '../pages/ExplorePage';
import { MapPage } from '../pages/MapPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ProfilePage } from '../pages/ProfilePage';
import { PlaceDetailPage } from '../pages/PlaceDetailPage';
import { EventDetailPage } from '../pages/EventDetailPage';
import { CategoryDetailPage } from '../pages/CategoryDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Main tabs */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/favoritos" element={<FavoritesPage />} />
        <Route path="/perfil" element={<ProfilePage />} />

        {/* Dynamic detail pages */}
        <Route path="/locais/:slug" element={<PlaceDetailPage />} />
        <Route path="/eventos/:slug" element={<EventDetailPage />} />
        <Route path="/categorias/:slug" element={<CategoryDetailPage />} />

        {/* Admin panel */}
        <Route path="/admin" element={<AdminDashboardPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
