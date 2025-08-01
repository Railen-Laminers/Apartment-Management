import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="text-center mt-5">Loading…</div>;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
