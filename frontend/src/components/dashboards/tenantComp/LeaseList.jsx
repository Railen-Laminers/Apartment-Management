import React, { useEffect, useState } from 'react';
import { getTenantLeases } from '../../../api/axios';

export default function LeaseList() {
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRows, setExpandedRows] = useState({}); // For collapse toggle

    useEffect(() => {
        const fetchLeases = async () => {
            try {
                const response = await getTenantLeases();
                setLeases(response.data);
            } catch (err) {
                console.error('Failed to fetch leases:', err);
                setError('Failed to load leases.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeases();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '150px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) return <div className="alert alert-danger">{error}</div>;

    if (leases.length === 0) return <p>You don't have any leases yet.</p>;

    const getOrdinalSuffix = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    };


    return (
        <div>
            <h4>Your Lease Agreements</h4>
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Unit</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Deposit</th>
                            <th>Status</th>
                            <th>Contract Terms</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leases.map(lease => {
                            const terms = lease.contract_terms || {};
                            const rentDue = terms.rent_due_day ?? 'N/A';
                            const gracePeriod = terms.grace_period_days ?? 'N/A';
                            const otherTerms = Array.isArray(terms.other_terms) ? terms.other_terms : [];

                            return (
                                <React.Fragment key={lease.id}>
                                    <tr>
                                        <td>{lease.unit?.property?.name || 'Unknown Property'}</td>
                                        <td>{lease.unit?.unit_number || 'Unknown Unit'}</td>
                                        <td>{formatDate(lease.start_date)}</td>
                                        <td>{formatDate(lease.end_date)}</td>
                                        <td>
                                            {isNaN(Number(lease.security_deposit))
                                                ? 'N/A'
                                                : `₱${Number(lease.security_deposit).toFixed(2)}`}
                                        </td>
                                        <td>
                                            <span className={`badge bg-${lease.status === 'active'
                                                ? 'success'
                                                : lease.status === 'pending'
                                                    ? 'warning'
                                                    : 'secondary'
                                                }`}>
                                                {lease.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => toggleRow(lease.id)}
                                            >
                                                {expandedRows[lease.id] ? 'Hide' : 'Show'} Terms
                                            </button>
                                        </td>
                                        <td>{lease.notes || <span className="text-muted">N/A</span>}</td>
                                    </tr>
                                    {expandedRows[lease.id] && (
                                        <tr>
                                            <td colSpan="8" className="bg-light">
                                                <div className="p-3">
                                                    <h6><i className="bi bi-file-earmark-text me-2"></i>Contract Terms</h6>

                                                    {/* Rent Due Day */}
                                                    <div>
                                                        <strong>🗓 Rent Due Day:</strong>{' '}
                                                        {typeof rentDue === 'number'
                                                            ? `${rentDue}${getOrdinalSuffix(rentDue)} of every month`
                                                            : 'Not specified'}
                                                    </div>

                                                    {/* Grace Period */}
                                                    <div>
                                                        <strong>⏱ Grace Period:</strong>{' '}
                                                        {typeof gracePeriod === 'number'
                                                            ? `${gracePeriod} day${gracePeriod === 1 ? '' : 's'} after due date`
                                                            : 'Not specified'}
                                                    </div>

                                                    {/* Other Terms */}
                                                    <div className="mt-2">
                                                        <strong>📜 Additional Terms:</strong>
                                                        {otherTerms.length > 0 ? (
                                                            <ul className="mb-0 ps-3">
                                                                {otherTerms.map((term, index) => (
                                                                    <li key={index}>{term}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <div className="text-muted">No additional terms listed.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
