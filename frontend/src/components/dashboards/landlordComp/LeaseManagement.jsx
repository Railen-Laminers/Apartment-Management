import React, { useEffect, useState } from 'react';
import { getAllLeases, updateLeaseStatus, deleteLease } from '../../../api/axios';

export default function LeaseManagement() {
    const [leases, setLeases] = useState([]);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadLeases();
    }, []);

    function loadLeases() {
        getAllLeases()
            .then(res => {
                setLeases(res.data);
                setError(null);
            })
            .catch(() => setError('Failed to load leases.'));
    }

    function handleStatusChange(id, status) {
        setMessage(null);
        setError(null);

        updateLeaseStatus(id, { status })
            .then(() => {
                setMessage(`Lease has been marked as '${status}'.`);
                loadLeases();
            })
            .catch(err => {
                const msg = err.response?.data?.message || 'Failed to update status';
                setError(msg);
            });
    }

    function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this lease?')) return;

        setMessage(null);
        setError(null);

        deleteLease(id)
            .then(() => {
                setMessage('Lease deleted successfully.');
                loadLeases();
            })
            .catch(err => {
                const msg = err.response?.data?.message || 'Failed to delete lease';
                setError(msg);
            });
    }

    const formatDate = iso => iso?.split('T')[0] ?? '';

    return (
        <div className="container mt-4">
            <h3><i className="bi bi-file-earmark-text-fill me-2"></i>Leases</h3>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {leases.length === 0 ? (
                <p className="text-muted">No leases found.</p>
            ) : (
                leases.map(lease => {
                    const terms = lease.contract_terms ?? {};
                    const otherTerms = Array.isArray(terms.other_terms) ? terms.other_terms : [];

                    return (
                        <div key={lease.id} className="card mb-3 shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title mb-3">
                                    <i className="bi bi-person-circle me-2"></i>
                                    {lease.tenant?.first_name} {lease.tenant?.last_name}
                                </h5>

                                <p>
                                    <span className="badge bg-dark me-2">Property</span>
                                    {lease.unit?.property?.name || 'Unknown Property'}
                                </p>

                                <p>
                                    <span className="badge bg-secondary me-2">Unit</span>
                                    {lease.unit?.unit_number}
                                </p>

                                <p>
                                    <span className="badge bg-info text-dark me-2">Lease Period</span>
                                    {formatDate(lease.start_date)} → {formatDate(lease.end_date)}
                                </p>

                                <p>
                                    <span className="badge bg-warning text-dark me-2">Deposit</span>
                                    ₱{lease.security_deposit}
                                </p>

                                <p>
                                    <span className="badge bg-light text-dark me-2">Auto Renew</span>
                                    {lease.auto_renew
                                        ? <i className="bi bi-check-circle-fill text-success"></i>
                                        : <i className="bi bi-x-circle-fill text-danger"></i>
                                    }
                                </p>

                                <p>
                                    <span className="badge bg-primary me-2">Status</span>
                                    <strong className={`text-uppercase ${lease.status === 'expired' ? 'text-danger' : ''}`}>
                                        {lease.status}
                                    </strong>
                                </p>

                                {(terms.rent_due_day || terms.grace_period_days) && (
                                    <div className="mt-3">
                                        <strong>Payment Rules:</strong>
                                        <ul className="mb-3">
                                            {terms.rent_due_day && (
                                                <li>
                                                    <i className="bi bi-calendar3 me-1"></i>
                                                    Rent is due every <strong>{ordinal(terms.rent_due_day)}</strong> of the month.
                                                </li>
                                            )}
                                            {typeof terms.grace_period_days === 'number' && (
                                                <li>
                                                    <i className="bi bi-clock me-1"></i>
                                                    Grace period: <strong>{terms.grace_period_days} day(s)</strong> after due date.
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {otherTerms.length > 0 && (
                                    <>
                                        <p className="mb-1"><strong>Other Contract Terms:</strong></p>
                                        <ul className="mb-3">
                                            {otherTerms.map((term, i) => (
                                                <li key={i}><i className="bi bi-dot me-1"></i>{term}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {/* Action Buttons */}
                                <div className="d-flex gap-2 mt-2">
                                    {/* Activate only if pending */}
                                    {lease.status === 'pending' && (
                                        <button
                                            className="btn btn-outline-success btn-sm"
                                            onClick={() => handleStatusChange(lease.id, 'active')}
                                        >
                                            <i className="bi bi-play-circle me-1"></i>Activate
                                        </button>
                                    )}

                                    {/* Terminate only if active */}
                                    {lease.status === 'active' && (
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleStatusChange(lease.id, 'terminated')}
                                        >
                                            <i className="bi bi-x-circle me-1"></i>Terminate
                                        </button>
                                    )}

                                    {/* Delete is always allowed */}
                                    <button
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(lease.id)}
                                    >
                                        <i className="bi bi-trash me-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}

// Helper: 1 => "1st", 2 => "2nd", etc.
function ordinal(n) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
