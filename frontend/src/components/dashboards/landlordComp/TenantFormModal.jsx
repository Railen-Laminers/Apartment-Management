import React, { useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext'; // Adjust path as needed

export default function TenantFormModal({ form, setForm, handleSubmit, editingId, error }) {
    const { plan } = useAuth();
    const enabledChannels = plan?.channels || [];

    useEffect(() => {
        const modal = document.getElementById('tenantModal');
        const handleHide = () => {
            if (document.activeElement && modal.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        };
        modal?.addEventListener('hide.bs.modal', handleHide);
        return () => modal?.removeEventListener('hide.bs.modal', handleHide);
    }, []);

    return (
        <div className="modal fade" id="tenantModal" tabIndex="-1" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <form onSubmit={handleSubmit}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                {editingId ? 'Edit Tenant' : 'Register Tenant'}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div className="modal-body row g-3">
                            {error && <div className="alert alert-danger">{error}</div>}

                            {/* Basic Info */}
                            <div className="col-md-4">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.first_name ?? ''}
                                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label>Middle Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.middle_name ?? ''}
                                    onChange={e => setForm({ ...form, middle_name: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.last_name ?? ''}
                                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={form.email ?? ''}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label>Contact Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.contact_number ?? ''}
                                    onChange={e => setForm({ ...form, contact_number: e.target.value })}
                                />
                            </div>

                            {/* Password Fields (Only when Registering) */}
                            {!editingId && (
                                <>
                                    <div className="col-md-6">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={form.password ?? ''}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={form.password_confirmation ?? ''}
                                            onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* Telegram Notification Only */}
                            {enabledChannels.includes('telegram') && (
                                <div className="col-md-6">
                                    <label>Telegram ID</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.telegram_id ?? ''}
                                        onChange={e => setForm({ ...form, telegram_id: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Tenant Profile Info */}
                            <div className="col-md-4">
                                <label>Occupation</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.occupation ?? ''}
                                    onChange={e => setForm({ ...form, occupation: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4">
                                <label>Income</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={form.income ?? ''}
                                    onChange={e => setForm({ ...form, income: e.target.value })}
                                />
                            </div>
                            <div className="col-md-4">
                                <label>Civil Status</label>
                                <select
                                    className="form-select"
                                    value={form.civil_status ?? ''}
                                    onChange={e => setForm({ ...form, civil_status: e.target.value })}
                                >
                                    <option value="">-- Select Status --</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Separated">Separated</option>
                                    <option value="Divorced">Divorced</option>
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label>Dependents</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={form.dependents ?? ''}
                                    onChange={e => setForm({ ...form, dependents: e.target.value })}
                                />

                            </div>
                            <div className="col-md-6">
                                <label>Employer Info</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.employer_info ?? ''}
                                    onChange={e => setForm({ ...form, employer_info: e.target.value })}
                                />
                            </div>
                            <div className="col-md-12">
                                <label>Valid ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={form.valid_id ?? ''}
                                    onChange={e => setForm({ ...form, valid_id: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="submit" className="btn btn-success">
                                {editingId ? 'Update Tenant' : 'Register Tenant'}
                            </button>
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
