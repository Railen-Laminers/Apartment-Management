import React, { useEffect, useState } from 'react';
import { getAllPayments, reviewPayment } from '../../../api/axios';

function PaymentReview() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModal, setImageModal] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await getAllPayments();
            setPayments(res.data);
        } catch (err) {
            console.error('Failed to load payments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id, status) => {
        try {
            await reviewPayment(id, { status });
            alert(`Payment ${status}`);
            fetchPayments();
        } catch (err) {
            console.error(`Failed to ${status} payment:`, err);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const openImage = (url) => {
        setSelectedImage(url);
        setImageModal(true);
    };

    const closeImage = () => {
        setImageModal(false);
        setSelectedImage(null);
    };

    if (loading) return <div>Loading payments...</div>;

    return (
        <div>
            <h4>Tenant Payment Submissions</h4>
            {payments.length === 0 ? (
                <p>No payments found.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Tenant</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Method</th>
                                <th>Reference</th>
                                <th>Status</th>
                                <th>Proof</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((pmt) => (
                                <tr key={pmt.id}>
                                    <td>{pmt.lease?.tenant?.first_name} {pmt.lease?.tenant?.last_name}</td>
                                    <td>{pmt.payment_type}</td>
                                    <td>₱{parseFloat(pmt.amount).toFixed(2)}</td>
                                    <td>{formatDate(pmt.payment_date)}</td>
                                    <td>{pmt.method}</td>
                                    <td>{pmt.reference_number || 'N/A'}</td>
                                    <td>
                                        <span className={`badge bg-${getStatusColor(pmt.status)}`}>
                                            {pmt.status}
                                        </span>
                                    </td>
                                    <td>
                                        {pmt.proof_image_url ? (
                                            <img
                                                src={pmt.proof_image_url}
                                                alt="Proof"
                                                style={{ height: '50px', cursor: 'zoom-in' }}
                                                onClick={() => openImage(pmt.proof_image_url)}
                                            />
                                        ) : 'N/A'}
                                    </td>
                                    <td>
                                        {pmt.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn btn-success btn-sm me-2"
                                                    onClick={() => handleReview(pmt.id, 'approved')}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleReview(pmt.id, 'rejected')}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Zoom Image Modal */}
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
                                    alt="Zoom"
                                    className="img-fluid"
                                    style={{ maxHeight: '80vh', maxWidth: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getStatusColor(status) {
    switch (status) {
        case 'approved':
            return 'success';
        case 'rejected':
            return 'danger';
        case 'pending':
        default:
            return 'secondary';
    }
}

export default PaymentReview;
