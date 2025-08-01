import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteSubscription, makeSubscriptionPayment } from '../../../api/axios';

export default function SubscriptionForm({ plan, subscription, onBack, refreshData }) {
    const [form, setForm] = useState({
        subscription_id: subscription.id,
        amount: plan.price,
        method: '',
        reference_number: '',
        proof_image: null,
    });

    const [preview, setPreview] = useState(null);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();
    const MAX_IMAGE_SIZE_KB = 2048;

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'proof_image' && files.length > 0) {
            const file = files[0];
            if (file.size > MAX_IMAGE_SIZE_KB * 1024) {
                setErrors(prev => ({
                    ...prev,
                    proof_image: `Image must not exceed ${MAX_IMAGE_SIZE_KB / 1024}MB.`,
                }));
                setForm(prev => ({ ...prev, proof_image: null }));
                setPreview(null);
                return;
            }

            setForm(prev => ({ ...prev, proof_image: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
            setErrors(prev => ({ ...prev, proof_image: null }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const cancelSubscription = useCallback(async () => {
        if (!subscription?.id || submitted) return;

        try {
            await deleteSubscription(subscription.id);
            console.log('Pending subscription canceled.');
        } catch (err) {
            if (err.response?.status === 404) {
                console.warn('Subscription not found. Might have already been deleted.');
            } else {
                console.error('Failed to cancel subscription:', err);
            }
        }
    }, [subscription?.id, submitted]);

    const handleCancel = async () => {
        await cancelSubscription();
        onBack();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent multiple clicks
        if (submitted) return;
        setSubmitted(true);

        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                data.append(key, value);
            }
        });

        try {
            await makeSubscriptionPayment(data);
            setMessage('Subscription payment submitted successfully!');
            setErrors({});
            if (refreshData) await refreshData();
            navigate('/landlord/dashboard/subscriptions');
        } catch (err) {
            console.error('Payment submission error:', err);
            setSubmitted(false); // ✅ Re-enable on failure

            if (err.response?.status === 422 && err.response.data.errors) {
                setErrors(err.response.data.errors);
                setMessage('Please correct the highlighted errors.');
            } else {
                setMessage('Something went wrong while submitting your payment.');
            }
        }
    };


    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!submitted) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handlePopState = async () => {
            if (!submitted) {
                const confirmLeave = window.confirm('Do you want to cancel the subscription?');
                if (confirmLeave) {
                    await cancelSubscription();
                    navigate('/landlord/dashboard/subscriptions');
                } else {
                    window.history.pushState(null, '', window.location.href);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        window.history.pushState(null, '', window.location.href);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [cancelSubscription, submitted, navigate]);

    return (
        <div className="card mt-4">
            <div className="card-header bg-dark text-white">
                Complete Subscription for: <strong>{plan.name}</strong>
            </div>
            <div className="card-body">
                {message && <div className="alert alert-info">{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Amount</label>
                        <input type="number" value={form.amount} readOnly className="form-control" />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Payment Method</label>
                        <select name="method" value={form.method} onChange={handleChange} className="form-select">
                            <option value="">-- Select Method --</option>
                            <option value="GCash">GCash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit Card">Credit Card</option>
                        </select>
                        {errors.method && <div className="text-danger">{errors.method}</div>}
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Reference Number (Optional)</label>
                        <input
                            type="text"
                            name="reference_number"
                            value={form.reference_number || ''}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Proof of Payment (Image)</label>
                        <input
                            type="file"
                            name="proof_image"
                            onChange={handleChange}
                            accept="image/*"
                            className="form-control"
                        />
                        {errors.proof_image && <div className="text-danger">{errors.proof_image}</div>}
                    </div>

                    {preview && (
                        <div className="mb-3">
                            <label className="form-label">Preview:</label><br />
                            <img src={preview} alt="Preview" className="img-thumbnail" style={{ maxHeight: '200px' }} />
                        </div>
                    )}

                    <div className="d-flex justify-content-between">
                        <button type="submit" className="btn btn-success" disabled={submitted}>
                            Submit Payment
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={submitted}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
