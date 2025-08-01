import { useState } from 'react';
import { createUnit, updateUnit } from '../../../api/axios';

export default function UnitForm({ propertyId, editing, onClose }) {
    const [form, setForm] = useState({
        unit_number: editing?.unit_number || '',
        rent_amount: editing?.rent_amount || '',
        unit_type: editing?.unit_type || '',
        floor: editing?.floor || '',
        square_meters: editing?.square_meters || '',
        is_available: editing ? editing.is_available : true,
    });

    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            if (editing) {
                await updateUnit(propertyId, editing.id, form);
            } else {
                await createUnit(propertyId, form);
            }
            onClose();
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 409 && message?.includes('available')) {
                setError('This unit cannot be marked as available while it has an active or pending lease.');
            } else if (status === 409) {
                setError('A unit with this number already exists in this property.');
            } else {
                setError(message || 'Failed to save unit.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card mb-3 shadow">
            <div className="card-header fw-bold">
                {editing ? '✏️ Edit Unit' : '🏢 Add Unit'}
            </div>
            <div className="card-body">
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    {['unit_number', 'rent_amount', 'unit_type', 'floor', 'square_meters'].map(field => (
                        <div className="mb-3" key={field}>
                            <label className="form-label">
                                {field.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </label>
                            <input
                                type={['rent_amount', 'floor', 'square_meters'].includes(field) ? 'number' : 'text'}
                                className="form-control"
                                name={field}
                                value={form[field]}
                                onChange={handleChange}
                                required={['unit_number', 'rent_amount', 'unit_type'].includes(field)}
                            />
                        </div>
                    ))}

                    {/* ✅ Is Available Checkbox */}
                    <div className="mb-3 form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="is_available"
                            name="is_available"
                            checked={form.is_available}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="is_available">
                            Is Available
                        </label>
                    </div>

                    <button className="btn btn-primary me-2" type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" /> Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle me-1"></i>
                                {editing ? 'Update' : 'Create'}
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        type="button"
                        disabled={submitting}
                    >
                        <i className="bi bi-x-circle me-1"></i>Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}
