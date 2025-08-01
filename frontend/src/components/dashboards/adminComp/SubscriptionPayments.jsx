import React, { useEffect, useState } from 'react';
import {
    getAllSubscriptionPayments,
    approveSubscriptionPayment,
    rejectSubscriptionPayment
} from '../../../api/axios';

export default function SubscriptionPayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModal, setImageModal] = useState(false);

    // New state for rejection modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectId, setRejectId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchPayments();
    }, []);

    function fetchPayments() {
        setLoading(true);
        setError(null);
        getAllSubscriptionPayments()
            .then(res => setPayments(res.data))
            .catch(err => {
                console.error('Error fetching payments:', err);
                setError('Failed to load subscription payments.');
            })
            .finally(() => setLoading(false));
    }

    function handleApprove(id) {
        if (window.confirm('Approve this payment?')) {
            approveSubscriptionPayment(id)
                .then(fetchPayments)
                .catch(() => alert('Failed to approve payment.'));
        }
    }

    function handleReject(id) {
        setRejectId(id);
        setRejectionReason('');
        setShowRejectModal(true);
    }

    function confirmReject() {
        rejectSubscriptionPayment(rejectId, rejectionReason)
            .then(() => {
                setShowRejectModal(false);
                fetchPayments();
            })
            .catch(() => {
                alert('Failed to reject payment.');
                setShowRejectModal(false);
            });
    }

    function openImage(url) {
        setSelectedImage(url);
        setImageModal(true);
    }

    function closeImage() {
        setImageModal(false);
        setSelectedImage(null);
    }

    return (
        <div className="container">
            <h3 className="mb-4">Subscription Payments</h3>

            {loading && (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status" />
                    <div className="mt-2">Loading subscription payments...</div>
                </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && !error && (
                <>
                    {payments.length === 0 ? (
                        <div className="alert alert-info">
                            No subscription payments found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-dark">
                                    <tr>
                                        <th>#</th>
                                        <th>Landlord</th>
                                        <th>Plan</th>
                                        <th>Amount (₱)</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Payment Date</th>
                                        <th>Reviewer</th>
                                        <th>Proof</th>
                                        <th>Rejection Reason</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((pay, idx) => (
                                        <tr key={pay.id}>
                                            <td>{idx + 1}</td>
                                            <td>{pay.landlord?.first_name} {pay.landlord?.last_name}</td>
                                            <td>{pay.subscription?.plan?.name}</td>
                                            <td>₱{Number(pay.amount || 0).toFixed(2)}</td>
                                            <td>{pay.method}</td>
                                            <td>
                                                <span className={`badge bg-${pay.status === 'approved' ? 'success' : pay.status === 'rejected' ? 'danger' : 'warning text-dark'}`}>
                                                    {pay.status}
                                                </span>
                                            </td>
                                            <td>{new Date(pay.payment_date).toLocaleDateString()}</td>
                                            <td>
                                                {pay.reviewer
                                                    ? `${pay.reviewer.first_name} ${pay.reviewer.last_name}`
                                                    : <span className="text-muted">—</span>}
                                            </td>
                                            <td>
                                                {pay.proof_image_url ? (
                                                    <img
                                                        src={pay.proof_image_url}
                                                        alt="Proof"
                                                        style={{ height: '50px', cursor: 'zoom-in' }}
                                                        onClick={() => openImage(pay.proof_image_url)}
                                                    />
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td>
                                                {pay.status === 'rejected' && pay.rejection_reason
                                                    ? <span className="text-danger">{pay.rejection_reason}</span>
                                                    : <span className="text-muted">—</span>}
                                            </td>
                                            <td>
                                                {pay.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleApprove(pay.id)}
                                                            title="Approve"
                                                        >
                                                            <i className="bi bi-check-circle" />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleReject(pay.id)}
                                                            title="Reject"
                                                        >
                                                            <i className="bi bi-x-circle" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-muted">Reviewed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div
                    className="modal show fade d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setShowRejectModal(false)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        role="document"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Reject Payment</h5>
                                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <label className="form-label">Rejection Reason</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Leave blank to use default reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowRejectModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={confirmReject}
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Zoom Modal */}
            {imageModal && selectedImage && (
                <div
                    className="modal show fade d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 1050
                    }}
                    onClick={closeImage}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        role="document"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Proof of Payment</h5>
                                <button type="button" className="btn-close" onClick={closeImage}></button>
                            </div>
                            <div className="modal-body text-center">
                                <img
                                    src={selectedImage}
                                    alt="Zoomed Proof"
                                    className="img-fluid"
                                    style={{ maxHeight: '80vh' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
