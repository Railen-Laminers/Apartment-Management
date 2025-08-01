import React, { useEffect, useState } from 'react';
import {
    getAllPlansAdmin,
    createPlan,
    updatePlan,
    deletePlan,
    getPlan,
} from '../../../api/axios';

export default function PlanManager() {
    const [plans, setPlans] = useState([]);
    const [editing, setEditing] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        allowed_properties: '',
        allowed_units: '',
        enable_notifications: [],
        price: 0,
        duration_days: '',
        is_default: false,
        is_active: true,
    });

    const parseNotifications = (value) => {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return typeof value === 'string' ? [value] : [];
        }
    };

    const fetchPlans = async () => {
        const res = await getAllPlansAdmin();
        setPlans(res.data);
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox' && name !== 'enable_notifications') {
            setForm((prev) => ({ ...prev, [name]: checked }));
        } else if (type === 'checkbox' && name === 'enable_notifications') {
            const updated = checked
                ? [...form.enable_notifications, value]
                : form.enable_notifications.filter((n) => n !== value);
            setForm((prev) => ({ ...prev, enable_notifications: updated }));
        } else {
            const newValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;

            setForm((prev) => {
                // 🔄 If price is updated and higher than 0, disable default toggle
                if (name === 'price' && newValue > 0 && prev.is_default) {
                    return { ...prev, [name]: newValue, is_default: false };
                }
                return { ...prev, [name]: newValue };
            });
        }

        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Plan name is required.';
        if (form.price === '' || form.price < 0) newErrors.price = 'Price must be 0 or greater.';
        if (form.duration_days !== '' && form.duration_days <= 0) {
            newErrors.duration_days = 'Duration must be greater than 0.';
        }

        // ✅ Only free plans can be set as default
        if (form.is_default && form.price > 0) {
            newErrors.is_default = 'Only free (₱0) plans can be set as default.';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setFeedback(null);

        const payload = {
            ...form,
            allowed_properties: form.allowed_properties === '' ? null : form.allowed_properties,
            allowed_units: form.allowed_units === '' ? null : form.allowed_units,
            duration_days: form.duration_days === '' ? null : form.duration_days,
        };

        try {
            if (editing) {
                await updatePlan(editing.id, payload);
                setFeedback({ type: 'success', message: 'Plan updated successfully.' });
            } else {
                await createPlan(payload);
                setFeedback({ type: 'success', message: 'Plan created successfully.' });
            }

            resetForm();
            fetchPlans();
        } catch (error) {
            console.error(error);
            if (error?.response?.status === 409) {
                setFeedback({ type: 'error', message: 'A plan with the same name already exists.' });
            } else {
                setFeedback({ type: 'error', message: 'Something went wrong. Please try again.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id) => {
        const res = await getPlan(id);
        const data = res.data;
        setForm({
            ...data,
            allowed_properties: data.allowed_properties ?? '',
            allowed_units: data.allowed_units ?? '',
            duration_days: data.duration_days ?? '',
            enable_notifications: parseNotifications(data.enable_notifications),
        });
        setEditing(data);
        setErrors({});
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            setLoading(true);
            setFeedback(null);

            try {
                await deletePlan(id);
                setFeedback({ type: 'success', message: 'Plan deleted successfully.' });
                fetchPlans();
            } catch (error) {
                console.error(error);
                if (error?.response?.status === 409) {
                    setFeedback({
                        type: 'error',
                        message: 'Cannot delete this plan. It is currently used in one or more subscriptions.',
                    });
                } else {
                    setFeedback({
                        type: 'error',
                        message: 'An unexpected error occurred. Please try again.',
                    });
                }
            } finally {
                setLoading(false);
            }
        }
    };


    const resetForm = () => {
        setEditing(null);
        setErrors({});
        setForm({
            name: '',
            description: '',
            allowed_properties: '',
            allowed_units: '',
            enable_notifications: [],
            price: 0,
            duration_days: '',
            is_default: false,
            is_active: true,
        });
    };

    return (
        <div className="container my-4">
            <h3 className="mb-4">Manage Plans</h3>

            {feedback && (
                <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                    <i className={`bi me-2 ${feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                    {feedback.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="border p-4 rounded shadow-sm mb-5 bg-white">
                <div className="row mb-3">
                    <div className="col-md-4">
                        <label className="form-label">Plan Name</label>
                        <input
                            type="text"
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                        />
                        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Price (₱)</label>
                        <input
                            type="number"
                            className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                            name="price"
                            value={form.price}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                        />
                        {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Duration (days)</label>
                        <input
                            type="number"
                            className={`form-control ${errors.duration_days ? 'is-invalid' : ''}`}
                            name="duration_days"
                            value={form.duration_days}
                            onChange={handleChange}
                            placeholder="Leave blank for unlimited"
                        />
                        {errors.duration_days && <div className="invalid-feedback">{errors.duration_days}</div>}
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-md-6">
                        <label className="form-label">Allowed Properties</label>
                        <input
                            type="number"
                            className="form-control"
                            name="allowed_properties"
                            value={form.allowed_properties}
                            onChange={handleChange}
                            placeholder="Leave blank for unlimited"
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Allowed Units</label>
                        <input
                            type="number"
                            className="form-control"
                            name="allowed_units"
                            value={form.allowed_units}
                            onChange={handleChange}
                            placeholder="Leave blank for unlimited"
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label">Notification Types</label>
                    {['email', 'telegram', 'messenger'].map((type) => (
                        <div className="form-check form-check-inline" key={type}>
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="enable_notifications"
                                value={type}
                                id={`notify-${type}`}
                                checked={form.enable_notifications.includes(type)}
                                onChange={handleChange}
                            />
                            <label className="form-check-label" htmlFor={`notify-${type}`}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </label>
                        </div>
                    ))}
                </div>

                <div className="form-check form-switch mb-3">
                    <input
                        className={`form-check-input ${errors.is_default ? 'is-invalid' : ''}`}
                        type="checkbox"
                        name="is_default"
                        checked={form.is_default}
                        onChange={handleChange}
                    />
                    <label className="form-check-label">Is Default</label>
                    {errors.is_default && (
                        <div className="invalid-feedback d-block">{errors.is_default}</div>
                    )}
                </div>

                <div className="form-check form-switch mb-3">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                    />
                    <label className="form-check-label">Is Active</label>
                </div>

                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-control"
                        name="description"
                        rows="3"
                        value={form.description}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary me-2"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check-circle me-1"></i>
                            {editing ? 'Update Plan' : 'Create Plan'}
                        </>
                    )}
                </button>
                {editing && (
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                        <i className="bi bi-x-circle me-1"></i>
                        Cancel
                    </button>
                )}
            </form>

            <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Duration</th>
                            <th>Properties</th>
                            <th>Units</th>
                            <th>Notifications</th>
                            <th>Description</th>
                            <th>Default</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan) => {
                            const notifications = Array.isArray(plan.enable_notifications)
                                ? plan.enable_notifications
                                : parseNotifications(plan.enable_notifications);

                            return (
                                <tr key={plan.id}>
                                    <td>{plan.name}</td>
                                    <td>₱{plan.price}</td>
                                    <td>{plan.duration_days === null ? 'Unlimited' : `${plan.duration_days} days`}</td>
                                    <td>{plan.allowed_properties === null ? 'Unlimited' : plan.allowed_properties}</td>
                                    <td>{plan.allowed_units === null ? 'Unlimited' : plan.allowed_units}</td>
                                    <td>{notifications.join(', ')}</td>
                                    <td>{plan.description || '-'}</td>
                                    <td>{plan.is_default ? 'Yes' : 'No'}</td>
                                    <td>{plan.is_active ? 'Yes' : 'No'}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-warning me-2"
                                            onClick={() => handleEdit(plan.id)}
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(plan.id)}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
