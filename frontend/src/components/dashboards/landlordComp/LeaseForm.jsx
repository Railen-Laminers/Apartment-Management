import React, { useEffect, useState } from 'react';
import {
    getProperties,
    getUnits,
    getTenants,
    getAllLeases,
    createLease
} from '../../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function LeaseForm() {
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [leases, setLeases] = useState([]);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        property_id: '',
        unit_id: '',
        tenant_id: '',
        start_date: '',
        end_date: '',
        security_deposit: '',
        contract_terms: {
            rent_due_day: '',
            grace_period_days: '',
            other_terms: ['']
        },
        notes: '',
        auto_renew: false,
    });

    const navigate = useNavigate();

    useEffect(() => {
        getProperties()
            .then(res => {
                const props = Array.isArray(res.data.properties) ? res.data.properties : [];
                setProperties(props.filter(p => p.editable));
            })
            .catch(() => setProperties([]));

        getTenants()
            .then(res => setTenants(Array.isArray(res.data) ? res.data : []))
            .catch(() => setTenants([]));

        getAllLeases()
            .then(res => setLeases(Array.isArray(res.data) ? res.data : []))
            .catch(() => setLeases([]));
    }, []);

    useEffect(() => {
        if (form.property_id) {
            getUnits(form.property_id)
                .then(res => {
                    const unitList = Array.isArray(res.data.units) ? res.data.units : [];
                    setUnits(unitList.filter(u => u.is_available));
                })
                .catch(() => setUnits([]));
        } else {
            setUnits([]);
        }
        setForm(prev => ({ ...prev, unit_id: '' }));
    }, [form.property_id]);

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        if (name === 'rent_due_day' || name === 'grace_period_days') {
            setForm(prev => ({
                ...prev,
                contract_terms: {
                    ...prev.contract_terms,
                    [name]: value === '' ? '' : parseInt(value)
                }
            }));
        } else {
            setForm(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    }

    function handleContractTermChange(index, value) {
        const terms = [...form.contract_terms.other_terms];
        terms[index] = value;
        setForm(prev => ({
            ...prev,
            contract_terms: {
                ...prev.contract_terms,
                other_terms: terms
            }
        }));
    }

    function addContractTerm() {
        setForm(prev => ({
            ...prev,
            contract_terms: {
                ...prev.contract_terms,
                other_terms: [...prev.contract_terms.other_terms, '']
            }
        }));
    }

    function removeContractTerm(index) {
        const updated = form.contract_terms.other_terms.filter((_, i) => i !== index);
        setForm(prev => ({
            ...prev,
            contract_terms: {
                ...prev.contract_terms,
                other_terms: updated.length > 0 ? updated : ['']
            }
        }));
    }

    function validateForm() {
        if (!form.property_id) return 'Please select a property.';
        if (!form.unit_id) return 'Please select a unit.';
        if (!form.tenant_id) return 'Please select a tenant.';
        if (!form.start_date) return 'Start date is required.';
        if (!form.end_date) return 'End date is required.';

        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        if (end <= start) return 'End date must be after start date.';

        const deposit = parseFloat(form.security_deposit);
        if (isNaN(deposit) || deposit < 0) return 'Security deposit must be a positive number.';

        const dueDay = form.contract_terms.rent_due_day;
        if (dueDay === '' || isNaN(dueDay) || dueDay < 1 || dueDay > 31)
            return 'Rent due day must be between 1 and 31.';

        const grace = form.contract_terms.grace_period_days;
        if (grace === '' || isNaN(grace) || grace < 0 || grace > 15)
            return 'Grace period must be between 0 and 15 days.';

        return null;
    }

    function isDuplicateLease() {
        return leases.some(lease =>
            lease.unit?.id === parseInt(form.unit_id) &&
            lease.tenant?.id === parseInt(form.tenant_id) &&
            lease.start_date?.split('T')[0] === form.start_date &&
            lease.end_date?.split('T')[0] === form.end_date &&
            JSON.stringify(lease.contract_terms?.other_terms?.sort()) ===
            JSON.stringify(form.contract_terms.other_terms.filter(Boolean).sort())
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }
        if (isDuplicateLease()) {
            setError('A similar lease already exists with the same unit, tenant, dates, and terms.');
            return;
        }

        setSubmitting(true);
        const payload = {
            ...form,
            security_deposit: parseFloat(form.security_deposit),
            contract_terms: {
                rent_due_day: parseInt(form.contract_terms.rent_due_day),
                grace_period_days: parseInt(form.contract_terms.grace_period_days),
                other_terms: form.contract_terms.other_terms.filter(Boolean)
            }
        };

        try {
            await createLease(payload);
            navigate('/landlord/dashboard/leases');
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Error creating lease';
            if (status === 400) {
                setError('This unit is not available for leasing.');
            } else if (status === 409) {
                setError('Cannot create lease: this unit already has an active or pending lease.');
            } else {
                setError(msg);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="container mt-4">
            <h3><i className="bi bi-file-earmark-plus-fill me-2"></i>Create Lease</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                {/* Property */}
                <div className="mb-2">
                    <label>Property</label>
                    <select
                        className="form-select"
                        name="property_id"
                        value={form.property_id}
                        onChange={handleChange}
                    >
                        <option value="">Select Property</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Unit */}
                <div className="mb-2">
                    <label>Unit (only available units shown)</label>
                    <select
                        className="form-select"
                        name="unit_id"
                        value={form.unit_id}
                        onChange={handleChange}
                        disabled={!form.property_id}
                    >
                        <option value="">Select Unit</option>
                        {units.map(u => (
                            <option key={u.id} value={u.id}>{u.unit_number}</option>
                        ))}
                    </select>
                </div>

                {/* Tenant */}
                <div className="mb-2">
                    <label>Tenant</label>
                    <select
                        className="form-select"
                        name="tenant_id"
                        value={form.tenant_id}
                        onChange={handleChange}
                    >
                        <option value="">Select Tenant</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.first_name} {t.last_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Dates */}
                <div className="mb-2">
                    <label>Start Date</label>
                    <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>
                <div className="mb-2">
                    <label>End Date</label>
                    <input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Security Deposit */}
                <div className="mb-2">
                    <label>Security Deposit (₱)</label>
                    <input
                        type="number"
                        name="security_deposit"
                        min="0"
                        step="0.01"
                        value={form.security_deposit}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Rent Due Day */}
                <div className="mb-2">
                    <label>Rent Due Day <span className="text-muted">(1–31)</span></label>
                    <input
                        type="number"
                        name="rent_due_day"
                        min="1"
                        max="31"
                        value={form.contract_terms.rent_due_day || ''}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Grace Period Days */}
                <div className="mb-2">
                    <label>Grace Period (days, 0–15)</label>
                    <input
                        type="number"
                        name="grace_period_days"
                        min="0"
                        max="15"
                        value={form.contract_terms.grace_period_days || ''}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                {/* Other Contract Terms */}
                <div className="mb-2">
                    <label>Other Contract Terms</label>
                    {form.contract_terms.other_terms.map((term, i) => (
                        <div className="input-group mb-1" key={i}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. No pets allowed"
                                value={term}
                                onChange={e => handleContractTermChange(i, e.target.value)}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => removeContractTerm(i)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addContractTerm}
                    >
                        + Add Term
                    </button>
                </div>

                {/* Notes */}
                <div className="mb-2">
                    <label>Notes</label>
                    <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        className="form-control"
                        rows={2}
                    />
                </div>

                {/* Auto Renew */}
                <div className="form-check mb-2">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        name="auto_renew"
                        checked={form.auto_renew}
                        onChange={handleChange}
                    />
                    <label className="form-check-label">Auto Renew</label>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Creating...' : 'Create Lease'}
                </button>
            </form>
        </div>
    );
}
