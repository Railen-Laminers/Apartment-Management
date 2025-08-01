import React, { useEffect, useState } from 'react';
import { getTenantLeases, submitTenantPayment, getMe } from '../../../api/axios';

function TenantPaymentForm() {
    const [leases, setLeases] = useState([]);
    const [methods, setMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [minAmount, setMinAmount] = useState(null);
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);

    const [form, setForm] = useState({
        lease_id: '',
        amount: '',
        method: '',
        payment_type: 'rent',
        reference_number: '',
        proof_image: null,
    });

    useEffect(() => {
        fetchLeases();
    }, []);

    const fetchLeases = async () => {
        try {
            const res = await getTenantLeases();
            const activeLeases = res.data.filter(lease => lease.status === 'active');
            setLeases(activeLeases);

            if (activeLeases.length === 1) {
                const onlyLease = activeLeases[0];
                const rentAmount = parseFloat(onlyLease.unit.rent_amount || 0);

                setForm(prev => ({
                    ...prev,
                    lease_id: onlyLease.id,
                    amount: rentAmount.toFixed(2),
                }));

                setMinAmount(rentAmount);
                await loadLandlordMethods(onlyLease.id);
                setIsDisabled(false);
            } else {
                setIsDisabled(activeLeases.length === 0);
            }
        } catch (err) {
            console.error('Error loading leases:', err);
            alert('Unable to load leases.');
        }
    };

    const loadLandlordMethods = async () => {
        try {
            const res = await getMe();
            const landlordProfile = res.data.landlord_profile;
            if (landlordProfile && Array.isArray(landlordProfile.payment_methods)) {
                setMethods(landlordProfile.payment_methods);
            } else {
                setMethods([]);
            }
        } catch (err) {
            console.error('Error loading payment methods:', err);
            setMethods([]);
        }
    };

    const handleLeaseChange = async (e) => {
        const leaseId = e.target.value;
        const lease = leases.find(l => l.id === parseInt(leaseId));
        const rent = lease?.unit?.rent_amount || 0;

        setForm(prev => ({
            ...prev,
            lease_id: leaseId,
            amount: parseFloat(rent).toFixed(2),
            method: '',
        }));

        setSelectedMethod(null);
        setMinAmount(parseFloat(rent));
        setIsDisabled(!leaseId);
        await loadLandlordMethods();
    };

    const handleMethodChange = (methodObj) => {
        setSelectedMethod(methodObj);
        setForm(prev => ({ ...prev, method: methodObj.type }));
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'amount' && form.payment_type === 'rent') {
            const parsed = parseFloat(value);
            if (!isNaN(minAmount) && parsed < minAmount) return;
        }

        if (name === 'proof_image' && files?.[0]) {
            const file = files[0];

            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, proof_image: 'Image must be 2MB or smaller.' }));
                setForm(prev => ({ ...prev, proof_image: null }));
                setPreview(null);
                return;
            } else {
                setErrors(prev => ({ ...prev, proof_image: null }));
                setForm(prev => ({ ...prev, proof_image: file }));
                setPreview(URL.createObjectURL(file));
                return;
            }
        }

        setForm(prev => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || isDisabled) return;

        if (!form.proof_image) {
            setErrors(prev => ({ ...prev, proof_image: 'Please upload a valid image (max 2MB).' }));
            return;
        }

        setLoading(true);
        const data = new FormData();
        const today = new Date().toISOString().split('T')[0];

        Object.entries(form).forEach(([key, value]) => data.append(key, value));
        data.append('payment_date', today);

        try {
            await submitTenantPayment(data);
            alert('Payment submitted successfully!');
            resetForm();
        } catch (err) {
            console.error('Payment submission failed:', err);
            const msg = err?.response?.data?.message || 'Validation error';
            alert(`Failed to submit payment. Reason: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            lease_id: '',
            amount: '',
            method: '',
            payment_type: 'rent',
            reference_number: '',
            proof_image: null,
        });
        setPreview(null);
        setErrors({});
        setMethods([]);
        setSelectedMethod(null);
        setMinAmount(null);
        setIsDisabled(true);
        fetchLeases();
    };

    return (
        <div>
            <h4>Submit Rent or Utility Payment</h4>
            <form onSubmit={handleSubmit} className="p-3 border bg-light rounded">

                {/* Lease Select */}
                <div className="mb-3">
                    <label className="form-label">Select Lease</label>
                    <select
                        name="lease_id"
                        className="form-select"
                        value={form.lease_id}
                        onChange={handleLeaseChange}
                        required
                    >
                        <option value="">-- Choose Lease --</option>
                        {leases.map(lease => (
                            <option key={lease.id} value={lease.id}>
                                Unit {lease.unit?.unit_number} - {lease.unit?.property?.name}
                            </option>
                        ))}
                    </select>
                    {leases.length === 0 && (
                        <div className="alert alert-warning mt-2">
                            No active leases found. You must have an active lease to submit a payment.
                        </div>
                    )}
                </div>

                {/* Payment Type */}
                <div className="mb-3">
                    <label className="form-label">Payment Type</label>
                    <select
                        name="payment_type"
                        className="form-select"
                        value={form.payment_type}
                        onChange={handleChange}
                        required
                        disabled={isDisabled}
                    >
                        <option value="rent">Rent</option>
                        <option value="deposit">Deposit</option>
                        <option value="utility">Utility</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Payment Method */}
                <div className="mb-3">
                    <label className="form-label">Select Payment Method</label>

                    {methods.length === 0 && (
                        <div className="alert alert-warning">
                            No payment methods available. Please contact your landlord.
                        </div>
                    )}

                    <div className="d-flex flex-wrap gap-3">
                        {methods.map((method, i) => (
                            <div
                                key={i}
                                onClick={() => handleMethodChange(method)}
                                className={`card p-2 border ${selectedMethod?.type === method.type ? 'border-primary' : ''}`}
                                style={{ cursor: 'pointer', minWidth: '220px' }}
                            >
                                <div><strong>{method.type}</strong></div>
                                <div>{method.account_name}</div>
                                <div>{method.account_number}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* QR Code Preview */}
                {selectedMethod?.qr_code_url && (
                    <div className="mb-3 text-center">
                        <label className="form-label d-block">QR Code:</label>
                        <img
                            src={selectedMethod.qr_code_url}
                            alt="QR Code"
                            className="img-fluid"
                            style={{ maxWidth: '200px', border: '1px solid #ccc', padding: '5px' }}
                        />
                    </div>
                )}

                {/* Amount */}
                <div className="mb-3">
                    <label className="form-label">Amount (₱)</label>
                    <input
                        type="number"
                        name="amount"
                        min={minAmount || 0}
                        step="0.01"
                        className="form-control"
                        value={form.amount}
                        onChange={handleChange}
                        required
                        disabled={isDisabled}
                    />
                    {form.payment_type === 'rent' && minAmount !== null && (
                        <small className="text-muted">Minimum: ₱{minAmount.toFixed(2)}</small>
                    )}
                </div>

                {/* Reference Number */}
                <div className="mb-3">
                    <label className="form-label">Reference Number <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        className="form-control"
                        name="reference_number"
                        value={form.reference_number}
                        onChange={handleChange}
                        required
                        disabled={isDisabled}
                    />
                </div>

                {/* Upload Proof */}
                <div className="mb-3">
                    <label className="form-label">
                        Upload Proof of Payment <span className="text-danger">*</span>
                    </label>
                    <input
                        type="file"
                        className={`form-control ${errors.proof_image ? 'is-invalid' : ''}`}
                        name="proof_image"
                        onChange={handleChange}
                        disabled={isDisabled}
                        accept="image/*"
                        required
                    />
                    {errors.proof_image && (
                        <div className="invalid-feedback d-block">{errors.proof_image}</div>
                    )}
                    {preview && (
                        <div className="mt-2">
                            <strong>Preview:</strong><br />
                            <img
                                src={preview}
                                alt="Proof Preview"
                                className="img-thumbnail"
                                style={{ maxHeight: '150px' }}
                            />
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button type="submit" className="btn btn-primary" disabled={isDisabled || loading}>
                    {loading ? 'Submitting...' : 'Submit Payment'}
                </button>
            </form>
        </div>
    );
}

export default TenantPaymentForm;
