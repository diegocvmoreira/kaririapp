import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { ExplorePage } from '../pages/ExplorePage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { ProfilePage } from '../pages/ProfilePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RequireAdmin } from '../components/auth/RequireAdmin';
import { LoadingState } from '../components/common/LoadingState';

// Code Splitting / Lazy Loading (Audit Item 9)
const MapPage = lazy(() => import('../pages/MapPage').then((m) => ({ default: m.MapPage })));
const PlaceDetailPage = lazy(() => import('../pages/PlaceDetailPage').then((m) => ({ default: m.PlaceDetailPage })));
const EventDetailPage = lazy(() => import('../pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const CategoryDetailPage = lazy(() => import('../pages/CategoryDetailPage').then((m) => ({ default: m.CategoryDetailPage })));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));

const PageSuspenseFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-6">
    <LoadingState type="spinner" message="Carregando..." />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Main tabs */}
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route
          path="/mapa"
          element={
            <Suspense fallback={<PageSuspenseFallback />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route path="/favoritos" element={<FavoritesPage />} />
        <Route path="/perfil" element={<ProfilePage />} />

        {/* Dynamic detail pages */}
        <Route
          path="/locais/:slug"
          element={
            <Suspense fallback={<PageSuspenseFallback />}>
              <PlaceDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/eventos/:slug"
          element={
            <Suspense fallback={<PageSuspenseFallback />}>
              <EventDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/categorias/:slug"
          element={
            <Suspense fallback={<PageSuspenseFallback />}>
              <CategoryDetailPage />
            </Suspense>
          }
        />

        {/* Protected Admin panel */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Suspense fallback={<PageSuspenseFallback />}>
                <AdminDashboardPage />
              </Suspense>
            </RequireAdmin>
          }
        />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
