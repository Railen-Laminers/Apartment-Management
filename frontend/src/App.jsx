import React from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import GuestRoute from './routes/GuestRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleProtectedRoute from './routes/RoleProtectedRoute';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDash from './components/dashboards/AdminDash';
import LandlordDash from './components/dashboards/LandlordDash';
import TenantDash from './components/dashboards/TenantDash';

function DashboardRouter() {
  const { user } = useAuth();

  if (!user?.role) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'landlord') return <Navigate to="/landlord/dashboard" replace />;
  if (user.role === 'tenant') return <Navigate to="/tenant/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

function FallbackRoute() {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'landlord') return <Navigate to="/landlord/dashboard" replace />;
    if (user.role === 'tenant') return <Navigate to="/tenant/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public-only Routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Dashboard Redirector */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
          </Route>

          {/* Role-Based Protected Dashboards */}
          <Route
            path="/admin/dashboard/*"
            element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                <AdminDash />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/landlord/dashboard/*"
            element={
              <RoleProtectedRoute allowedRoles={['landlord']}>
                <LandlordDash />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/tenant/dashboard/*"
            element={
              <RoleProtectedRoute allowedRoles={['tenant']}>
                <TenantDash />
              </RoleProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<FallbackRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
