import { useEffect, useState } from 'react';
import {
    getTenantLeases,
    getTenantServiceRequests,
    createServiceRequest
} from '../../../api/axios';

// ✅ Add formatDate utility
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
};

export default function ServiceRequests() {
    const [leases, setLeases] = useState([]);
    const [requests, setRequests] = useState([]);
    const [form, setForm] = useState({
        lease_id: '',
        category: '',
        details: '',
        priority: 'medium',
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [hasActiveLease, setHasActiveLease] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [leaseRes, requestRes] = await Promise.all([
                getTenantLeases(),
                getTenantServiceRequests(),
            ]);

            const activeLeases = leaseRes.data.filter(l => l.status === 'active');
            setLeases(activeLeases);
            setHasActiveLease(activeLeases.length > 0);
            setRequests(requestRes.data);

            if (activeLeases.length === 1) {
                setForm(prev => ({
                    ...prev,
                    lease_id: activeLeases[0].id.toString(),
                }));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting || !hasActiveLease) return;

        setSubmitting(true);
        try {
            await createServiceRequest(form);
            setForm({
                lease_id: leases.length === 1 ? leases[0].id.toString() : '',
                category: '',
                details: '',
                priority: 'medium',
            });
            await fetchData();
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || 'Failed to submit request.';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="container mt-4">
            <div className="d-flex align-items-center mb-3">
                <i className="bi bi-tools fs-3 text-primary me-2"></i>
                <h2 className="mb-0">My Service Requests</h2>
            </div>

            {/* FORM */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title">
                        <i className="bi bi-pencil-square me-1"></i> Submit New Request
                    </h5>

                    {!hasActiveLease ? (
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            You must have an <strong>active lease</strong> to submit a service request.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Lease Selection */}
                            <div className="mb-3">
                                <label className="form-label">Lease</label>
                                <select
                                    name="lease_id"
                                    className="form-select"
                                    value={form.lease_id}
                                    onChange={handleChange}
                                    required
                                    disabled={leases.length === 1}
                                >
                                    <option value="">-- Select Lease --</option>
                                    {leases.map((lease) => (
                                        <option key={lease.id} value={lease.id}>
                                            {lease.unit?.property?.name} — Unit: {lease.unit?.unit_number || 'N/A'}
                                            ({formatDate(lease.start_date)} to {formatDate(lease.end_date)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div className="mb-3">
                                <label className="form-label">Category</label>
                                <select
                                    name="category"
                                    className="form-select"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Category --</option>
                                    <option value="Internet">Internet</option>
                                    <option value="Repairs">Repairs</option>
                                    <option value="Waste">Waste</option>
                                    <option value="Guest">Guest</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div className="mb-3">
                                <label className="form-label">Priority</label>
                                <select
                                    name="priority"
                                    className="form-select"
                                    value={form.priority}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* Details */}
                            <div className="mb-3">
                                <label className="form-label">Details</label>
                                <textarea
                                    name="details"
                                    className="form-control"
                                    rows="3"
                                    value={form.details}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <i className="bi bi-hourglass-split me-1"></i> Submitting...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-send me-1"></i> Submit Request
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* SERVICE REQUEST TABLE */}
            <div className="card shadow-sm">
                <div className="card-body">
                    <h5 className="card-title mb-3">
                        <i className="bi bi-list-task me-1"></i> Submitted Requests
                    </h5>

                    {loading ? (
                        <div className="alert alert-info">
                            <i className="bi bi-hourglass-split me-1"></i> Loading...
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            <i className="bi bi-exclamation-triangle me-1"></i> {error}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th><i className="bi bi-calendar-event me-1"></i> Date</th>
                                        <th><i className="bi bi-tags me-1"></i> Category</th>
                                        <th><i className="bi bi-flag me-1"></i> Priority</th>
                                        <th><i className="bi bi-check-circle me-1"></i> Status</th>
                                        <th><i className="bi bi-info-circle me-1"></i> Details</th>
                                        <th><i className="bi bi-building me-1"></i> Property & Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted">
                                                <i className="bi bi-inbox me-1"></i> No requests submitted yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map((req) => (
                                            <tr key={req.id}>
                                                <td>{new Date(req.created_at).toLocaleString()}</td>
                                                <td>{req.category}</td>
                                                <td className="text-capitalize">{req.priority}</td>
                                                <td className="text-capitalize">{req.status}</td>
                                                <td>{req.details}</td>
                                                <td>
                                                    {req.lease?.unit?.property?.name} — Unit: {req.lease?.unit?.unit_number || 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
