import React, { useEffect, useState } from 'react';
import { getAllLandlords, getLandlordDetails } from '../../../api/axios';
import LandlordDetail from './LandlordDetail';

export default function SubscribedUsers() {
    const [landlords, setLandlords] = useState([]);
    const [selectedLandlord, setSelectedLandlord] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLandlords();
    }, []);

    const fetchLandlords = async () => {
        try {
            const res = await getAllLandlords();
            setLandlords(res.data || []);
        } catch (err) {
            console.error('Error fetching landlords', err);
        }
    };

    const viewLandlordDetails = async (id) => {
        setLoading(true);
        try {
            const res = await getLandlordDetails(id);
            setSelectedLandlord(res.data);
        } catch (err) {
            console.error('Error fetching landlord details', err);
        } finally {
            setLoading(false);
        }
    };

    const getPlanBadge = (subscriptions) => {
        const activePaid = subscriptions.find(sub => sub.status === 'active' && sub.plan && !sub.plan.is_default);
        const activeFree = subscriptions.find(sub => sub.status === 'active' && sub.plan && sub.plan.is_default);

        let label = 'None';
        let className = 'bg-secondary';

        if (activePaid) {
            label = activePaid.plan.name;
            className = 'bg-success';
        } else if (activeFree) {
            label = activeFree.plan.name;
            className = 'bg-secondary';
        }

        return (
            <span className={`badge me-1 ${className}`}>
                {label}
            </span>
        );
    };

    return (
        <div>
            <h4 className="mb-3">Subscribed Landlords</h4>
            <div className="row">
                {/* List Panel */}
                <div className="col-md-5">
                    <ul className="list-group">
                        {landlords.length === 0 && (
                            <li className="list-group-item text-muted">No landlords found.</li>
                        )}
                        {landlords.map((landlord) => {
                            const { id, first_name, last_name, email, subscriptions = [], landlord_profile } = landlord;
                            const paymentMethods = landlord_profile?.payment_methods || [];

                            return (
                                <li
                                    key={id}
                                    className={`list-group-item d-flex justify-content-between align-items-center ${selectedLandlord?.id === id ? 'active' : ''}`}
                                    onClick={() => viewLandlordDetails(id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div>
                                        <div>{first_name} {last_name}</div>
                                        <small className="text-muted">{email}</small>
                                        <br />
                                        {paymentMethods.map((method, idx) => (
                                            <span key={idx} className="badge bg-light text-dark me-1">
                                                {method?.type || 'N/A'} - {method?.name || method?.account_name || 'N/A'}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-end">
                                        {getPlanBadge(subscriptions)}
                                        <span className="badge bg-info text-dark">
                                            {paymentMethods.length} method{paymentMethods.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Detail Panel */}
                <div className="col-md-7">
                    {loading ? (
                        <div className="text-center">Loading...</div>
                    ) : selectedLandlord ? (
                        <LandlordDetail landlord={selectedLandlord} />
                    ) : (
                        <p className="text-muted">Select a landlord to view full details.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
