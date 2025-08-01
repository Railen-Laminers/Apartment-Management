// src/components/dashboards/landlordComp/ServiceRequestList.jsx

import React, { useEffect, useState } from 'react';
import { getServiceRequests, updateServiceRequestStatus } from '../../../api/axios';

export default function ServiceRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const res = await getServiceRequests();
            setRequests(res.data);
        } catch (err) {
            console.error('Failed to load service requests:', err);
            setError('Unable to load service requests. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateServiceRequestStatus(id, { status });
            loadRequests(); // Refresh after update
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update request status.');
        }
    };

    if (loading) return <p>Loading service requests...</p>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h3>Service Requests</h3>
            {requests.length === 0 ? (
                <p className="text-muted">No service requests found.</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Details</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Requested By</th>
                            <th>Property</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id}>
                                <td>{req.category}</td>
                                <td>{req.details}</td>
                                <td>{req.priority}</td>
                                <td>
                                    <span className={`badge text-bg-${{
                                        pending: 'warning',
                                        approved: 'primary',
                                        resolved: 'success',
                                        rejected: 'danger'
                                    }[req.status]}`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td>{req.requester?.first_name} {req.requester?.last_name}</td>
                                <td>{req.lease?.unit?.property?.name ?? 'N/A'}</td>
                                <td>
                                    {req.status === 'pending' && (
                                        <>
                                            <button className="btn btn-sm btn-success me-1" onClick={() => handleUpdateStatus(req.id, 'approved')}>Approve</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleUpdateStatus(req.id, 'rejected')}>Reject</button>
                                        </>
                                    )}
                                    {req.status === 'approved' && (
                                        <button className="btn btn-sm btn-secondary" onClick={() => handleUpdateStatus(req.id, 'resolved')}>Mark Resolved</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
