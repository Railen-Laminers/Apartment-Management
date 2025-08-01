// AdminDash.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './common/Sidebar';
import Profile from './common/Profile';
import ProfileForm from './common/ProfileForm';
import PlanManager from './adminComp/PlanManager';
import SubscribedUsers from './adminComp/SubscribedUsers';
import SubscriptionPayments from './adminComp/SubscriptionPayments';
import Notifications from './common/Notifications';
import FinancialPage from './common/adminLandlord/FinancialPage';

import { useAuth } from '../../contexts/AuthContext';

export default function AdminDash() {
    const { user, profile, logout } = useAuth();

    const adminLinks = [
        { path: '/admin/dashboard/profile', label: 'Dashboard', icon: 'bi-person' },
        { path: '/admin/dashboard/profile/update', label: 'Update Profile', icon: 'bi-pencil-square' },
        { path: '/admin/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' },
        { path: '/admin/dashboard/plans', label: 'Plan Manager', icon: 'bi-list-ul' },
        { path: '/admin/dashboard/subscriptions', label: 'Subscribed Users', icon: 'bi-people' },
        { path: '/admin/dashboard/subscription-payments', label: 'Subscription Payments', icon: 'bi-cash' },
        { path: '/admin/dashboard/financials', label: 'Financials', icon: 'bi-graph-up' },
    ];


    return (
        <div className="d-flex">
            {/* Sidebar */}
            <Sidebar links={adminLinks} />

            {/* Main Content */}
            <div className="flex-grow-1 container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>Admin Dashboard</h2>
                    <button className="btn btn-outline-danger" onClick={logout}>Logout</button>
                </div>

                {/* Nested Routes inside Admin Dashboard */}
                <Routes>
                    <Route path="profile" element={<Profile user={user} profile={profile} />} />
                    <Route path="profile/update" element={<ProfileForm />} />
                    <Route path="plans" element={<PlanManager />} />
                    <Route path="subscriptions" element={<SubscribedUsers />} />
                    <Route path="notifications" element={<Notifications title="Admin Notifications" />} />
                    <Route path="subscription-payments" element={<SubscriptionPayments />} />
                    <Route path="financials" element={<FinancialPage />} />
                    <Route path="" element={<Navigate to="profile" replace />} />
                </Routes>

            </div>
        </div>
    );
}
