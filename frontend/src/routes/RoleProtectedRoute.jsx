// src/routes/RoleProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="text-center mt-5">Loading…</div>;

    if (!user) return <Navigate to="/login" replace />;

    // Redirect if role is not allowed
    if (!allowedRoles.includes(user.role)) {
        const redirectPath = {
            admin: '/admin/dashboard',
            landlord: '/landlord/dashboard',
            tenant: '/tenant/dashboard',
        }[user.role] || '/dashboard';

        return <Navigate to={redirectPath} replace />;
    }

    return children;
}
