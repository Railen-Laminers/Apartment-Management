import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from './common/Sidebar';
import Profile from './common/Profile';
import ProfileForm from './common/ProfileForm';
import TenantManagement from './landlordComp/TenantManagement';
import PropertyList from './landlordComp/PropertyList';
import UnitManagement from './landlordComp/UnitManagement';
import LeaseManagement from './landlordComp/LeaseManagement';
import LeaseForm from './landlordComp/LeaseForm';
import ServiceRequestList from './landlordComp/ServiceRequestList';
import SubscriptionList from './landlordComp/SubscriptionList';
import SubscriptionForm from './landlordComp/SubscriptionForm';
import TermsTemplateManager from './landlordComp/TermsTemplateManager';
import Notifications from './common/Notifications';
import PaymentReview from './landlordComp/PaymentReview';
import FinancialPage from './common/adminLandlord/FinancialPage';
import { useAuth } from '../../contexts/AuthContext';
import { getPlans, getSubscriptions } from '../../api/axios';

export default function LandlordDash() {
    const { user, profile, logout } = useAuth();
    const [refreshDataFunc, setRefreshDataFunc] = useState(null);
    const location = useLocation();

    // Lock navigation only on specific subscription form route
    const lockNavigation =
        location.pathname.startsWith('/landlord/dashboard/subscriptions/') &&
        location.pathname.split('/').length === 6;

    const links = [
        { path: '/landlord/dashboard/profile', label: 'Dashboard', icon: 'bi-person' },
        { path: '/landlord/dashboard/profile/update', label: 'Update Profile', icon: 'bi-pencil-square' },
        { path: '/landlord/dashboard/notifications', label: 'Notifications', icon: 'bi-bell-fill' },
        { path: '/landlord/dashboard/tenants', label: 'Tenants', icon: 'bi-people-fill' },
        { path: '/landlord/dashboard/properties', label: 'Properties', icon: 'bi-house-fill' },
        { path: '/landlord/dashboard/leases', label: 'Leases', icon: 'bi-file-earmark-text-fill' },
        { path: '/landlord/dashboard/leases/new', label: 'New Lease', icon: 'bi-file-earmark-plus-fill' },
        { path: '/landlord/dashboard/service-requests', label: 'Service Requests', icon: 'bi-tools' },
        { path: '/landlord/dashboard/subscriptions', label: 'Subscriptions', icon: 'bi-card-checklist' },
        { path: '/landlord/dashboard/terms-templates', label: 'Terms', icon: 'bi-journal-text' },
        { path: '/landlord/dashboard/payments', label: 'Payments', icon: 'bi-cash-stack' },
        { path: '/landlord/dashboard/financials', label: 'Financials', icon: 'bi-graph-up' },
    ];

    function SubscriptionFormWrapper() {
        const { planId, subscriptionId } = useParams();
        const navigate = useNavigate();
        const [plan, setPlan] = useState(null);
        const [subscription, setSubscription] = useState(null);

        useEffect(() => {
            const load = async () => {
                try {
                    const plansRes = await getPlans();
                    const subsRes = await getSubscriptions();
                    const p = plansRes.data.find(p => p.id === parseInt(planId));
                    const s = subsRes.data.find(s => s.id === parseInt(subscriptionId));
                    if (!p || !s) return navigate('/landlord/dashboard/subscriptions');
                    setPlan(p);
                    setSubscription(s);
                } catch {
                    navigate('/landlord/dashboard/subscriptions');
                }
            };
            load();
        }, [planId, subscriptionId]);

        if (!plan || !subscription) return <p>Loading form...</p>;

        return (
            <SubscriptionForm
                plan={plan}
                subscription={subscription}
                onBack={() => navigate('/landlord/dashboard/subscriptions')}
                refreshData={refreshDataFunc}
            />
        );
    }

    return (
        <div className="d-flex">
            <Sidebar links={links} lockNavigation={lockNavigation} />
            <div className="flex-grow-1 container mt-4">

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>Landlord Dashboard</h2>
                    {lockNavigation ? (
                        <button className="btn btn-outline-danger" disabled title="Complete the subscription before logging out">
                            Logout
                        </button>
                    ) : (
                        <button className="btn btn-outline-danger" onClick={logout}>
                            Logout
                        </button>
                    )}
                </div>

                <Routes>
                    <Route path="profile" element={<Profile user={user} profile={profile} />} />
                    <Route path="profile/update" element={<ProfileForm />} />
                    <Route path="tenants" element={<TenantManagement />} />
                    <Route path="properties" element={<PropertyList />} />
                    <Route path="properties/:id/units" element={<UnitManagement />} />
                    <Route path="leases" element={<LeaseManagement />} />
                    <Route path="leases/new" element={<LeaseForm />} />
                    <Route path="service-requests" element={<ServiceRequestList />} />
                    <Route path="subscriptions" element={<SubscriptionList setRefreshDataFunc={setRefreshDataFunc} />} />
                    <Route path="subscriptions/:planId/:subscriptionId" element={<SubscriptionFormWrapper />} />
                    <Route path="terms-templates" element={<TermsTemplateManager />} />
                    <Route path="notifications" element={<Notifications title="Landlord Notifications" />} />
                    <Route path="payments" element={<PaymentReview />} />
                    <Route path="financials" element={<FinancialPage />} />
                    <Route path="" element={<Navigate to="profile" replace />} />
                </Routes>
            </div>
        </div>
    );
}
