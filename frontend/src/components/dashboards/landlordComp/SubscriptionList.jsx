import React, { useEffect, useState } from 'react';
import {
    getSubscriptions,
    getPlans,
    createSubscription,
    deleteSubscription,
    getSubscriptionPaymentHistory
} from '../../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionList({ setRefreshDataFunc }) {
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const [subRes, plansRes, historyRes] = await Promise.all([
                getSubscriptions(),
                getPlans(),
                getSubscriptionPaymentHistory()
            ]);
            setSubscriptions(subRes.data);
            setPlans(plansRes.data);
            setPaymentHistory(historyRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (setRefreshDataFunc) {
            setRefreshDataFunc(() => fetchData);
        }
    }, []);

    const getSubscriptionStatus = (planId) => {
        const match = subscriptions.find(sub => sub.plan_id === planId);
        return match ? match.status : null;
    };

    const handleSelect = async (plan) => {
        try {
            let sub = subscriptions.find(s => s.plan_id === plan.id && s.status === 'pending');
            if (!sub) {
                const res = await createSubscription({ plan_id: plan.id });
                sub = res.data;
                await fetchData();
            }
            navigate(`/landlord/dashboard/subscriptions/${plan.id}/${sub.id}`);
        } catch (err) {
            const backendMessage = err?.response?.data?.message || 'Failed to subscribe to this plan.';
            console.error('Subscription error:', backendMessage);
            setMessage(backendMessage);
        }
    };

    const handleCancelPending = async (subId) => {
        try {
            await deleteSubscription(subId);
            setMessage('Subscription canceled.');
            await fetchData();
        } catch (err) {
            console.error('Cancel error:', err);
            setMessage('Unable to cancel subscription.');
        }
    };

    const hasActivePaid = subscriptions.some(sub =>
        sub.status === 'active' && sub.plan && !sub.plan.is_default
    );

    // Helper to show "Unlimited" if value is null
    const formatLimit = (value) => value === null ? 'Unlimited' : value;

    return (
        <div className="container">
            <h4>My Subscriptions</h4>
            {message && <div className="alert alert-info">{message}</div>}
            {subscriptions.length === 0 ? (
                <p>No subscriptions found.</p>
            ) : (
                <ul className="list-group mb-4">
                    {subscriptions
                        .filter(sub => {
                            const isDefault = sub.plan?.is_default;
                            return !(isDefault && hasActivePaid); // ✅ hide free plan only if paid is active
                        })
                        .map(sub => (
                            <li className="list-group-item" key={sub.id}>
                                <strong>{sub.plan.name}</strong><br />
                                Status: <span className={`badge bg-${sub.status === 'active' ? 'success' : sub.status === 'pending' ? 'warning' : 'secondary'}`}>{sub.status}</span><br />
                                {sub.started_at && (
                                    <>
                                        Start: {new Date(sub.started_at).toLocaleString()}<br />
                                        End: {new Date(sub.ends_at).toLocaleString()}
                                    </>
                                )}
                                {sub.status === 'pending' && (
                                    <div className="mt-2">
                                        <button className="btn btn-sm btn-danger" onClick={() => handleCancelPending(sub.id)}>
                                            Cancel Subscription
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                </ul>
            )}

            <h4>Payment History</h4>
            {loadingHistory ? (
                <p>Loading history...</p>
            ) : paymentHistory.length === 0 ? (
                <p>No payment history available.</p>
            ) : (
                <ul className="list-group mb-4">
                    {paymentHistory.map(payment => (
                        <li key={payment.id} className="list-group-item">
                            <strong>{payment.subscription?.plan?.name || 'N/A'}</strong><br />
                            Amount: ₱{payment.amount}<br />
                            Method: {payment.method}<br />
                            Status: <span className={`badge bg-${payment.status === 'approved' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}`}>
                                {payment.status}
                            </span><br />
                            Date: {new Date(payment.payment_date).toLocaleString()}<br />
                            {payment.status === 'rejected' && payment.rejection_reason && (
                                <div className="mt-2 text-danger">
                                    Rejection Reason: <em>{payment.rejection_reason}</em>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <h4>Available Plans</h4>
            <div className="row">
                {plans.map(plan => {
                    let notifications = [];
                    try {
                        notifications = typeof plan.enable_notifications === 'string'
                            ? JSON.parse(plan.enable_notifications)
                            : Array.isArray(plan.enable_notifications) ? plan.enable_notifications : [];
                    } catch (e) {
                        notifications = [];
                    }

                    const status = getSubscriptionStatus(plan.id);
                    const isDisabled = status && !['rejected', 'expired', 'canceled', 'paused'].includes(status);

                    return (
                        <div className="col-md-4 mb-4" key={plan.id}>
                            <div className={`card h-100 ${isDisabled ? 'border-secondary' : 'border-primary'}`}>
                                <div className="card-header bg-primary text-white">
                                    <h5 className="mb-0">{plan.name}</h5>
                                </div>
                                <div className="card-body">
                                    <p>{plan.description}</p>
                                    <ul className="list-group list-group-flush">
                                        <li className="list-group-item">₱{plan.price} / {plan.duration_days} days</li>
                                        <li className="list-group-item">Allowed Properties: {formatLimit(plan.allowed_properties)}</li>
                                        <li className="list-group-item">Allowed Units: {formatLimit(plan.allowed_units)}</li>
                                        <li className="list-group-item">Notifications: {notifications.join(', ') || 'None'}</li>
                                    </ul>
                                </div>
                                <div className="card-footer text-end">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => handleSelect(plan)}
                                        disabled={isDisabled}
                                    >
                                        {status === 'active' ? 'Subscribed' :
                                            status === 'pending' ? 'Pending' :
                                                ['expired', 'paused', 'canceled'].includes(status) ? 'Resubscribe' : 'Select Plan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
