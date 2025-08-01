import React, { useEffect, useState } from 'react';
import { getTenantPayments } from '../../../api/axios';

function TenantPaymentHistory() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageModal, setImageModal] = useState(false);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await getTenantPayments();
            setPayments(res.data || []);
        } catch (err) {
            console.error('Failed to load payment history:', err);
            alert('Unable to load your payment history.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
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

    return (
        <div>
            <h4>Payment History</h4>
            {loading ? (
                <div>Loading payments...</div>
            ) : payments.length === 0 ? (
                <div className="alert alert-info">No payment records found.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-bordered table-striped">
                        <thead className="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Payment Type</th>
                                <th>Amount (₱)</th>
                                <th>Date</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Ref No.</th>
                                <th>Lease</th>
                                <th>Proof</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={payment.id}>
                                    <td>{index + 1}</td>
                                    <td>{payment.payment_type}</td>
                                    <td>₱{parseFloat(payment.amount).toFixed(2)}</td>
                                    <td>{formatDate(payment.payment_date)}</td>
                                    <td>{payment.method}</td>
                                    <td>
                                        <span className={`badge bg-${getStatusColor(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td>{payment.reference_number || '-'}</td>
                                    <td>
                                        Unit {payment.lease?.unit?.unit_number} - {payment.lease?.unit?.property?.name}
                                    </td>
                                    <td>
                                        {payment.proof_image_url ? (
                                            <img
                                                src={payment.proof_image_url}
                                                alt="Proof"
                                                style={{ height: '50px', cursor: 'zoom-in' }}
                                                onClick={() => openImage(payment.proof_image_url)}
                                            />
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal for image zoom */}
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

export default TenantPaymentHistory;
