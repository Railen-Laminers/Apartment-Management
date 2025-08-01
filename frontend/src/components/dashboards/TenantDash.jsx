import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './common/Sidebar';
import Profile from './common/Profile';
import ProfileForm from './common/ProfileForm';
import LeaseList from './tenantComp/LeaseList';
import ServiceRequests from './tenantComp/ServiceRequests';
import TermsAgreement from './tenantComp/TermsAgreement';
import Notifications from './common/Notifications';
import TenantPaymentForm from './tenantComp/TenantPaymentForm';
import TenantPaymentHistory from './tenantComp/TenantPaymentHistory';
import { useAuth } from '../../contexts/AuthContext';

export default function TenantDash() {
    const { user, profile, logout } = useAuth();

    const links = [
        { path: '/tenant/dashboard/profile', label: 'Dashboard', icon: 'bi-person' },
        { path: '/tenant/dashboard/profile/update', label: 'Update Profile', icon: 'bi-pencil-square' },
        { path: '/tenant/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' },
        { path: '/tenant/dashboard/leases', label: 'My Leases', icon: 'bi-file-earmark-text' },
        { path: '/tenant/dashboard/service-requests', label: 'Service Requests', icon: 'bi-wrench' },
        { path: '/tenant/dashboard/terms-agreement', label: 'Terms Agreement', icon: 'bi-file-earmark-check' },
        { path: '/tenant/dashboard/payments/new', label: 'Submit Payment', icon: 'bi-wallet2' },
        { path: '/tenant/dashboard/payments', label: 'Payment History', icon: 'bi-clock-history' }, // ✅ Added
    ];

    return (
        <div className="d-flex">
            <Sidebar links={links} />

            <div className="flex-grow-1 container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>Tenant Dashboard</h2>
                    <button className="btn btn-outline-danger" onClick={logout}>Logout</button>
                </div>

                <Routes>
                    <Route path="profile" element={<Profile user={user} profile={profile} />} />
                    <Route path="profile/update" element={<ProfileForm />} />
                    <Route path="leases" element={<LeaseList />} />
                    <Route path="service-requests" element={<ServiceRequests />} />
                    <Route path="terms-agreement" element={<TermsAgreement />} />
                    <Route path="notifications" element={<Notifications title="Tenant Notifications" />} />
                    <Route path="payments/new" element={<TenantPaymentForm />} />
                    <Route path="payments" element={<TenantPaymentHistory />} /> {/* ✅ Corrected path */}
                    <Route path="" element={<Navigate to="profile" replace />} />
                </Routes>
            </div>
        </div>
    );
}
