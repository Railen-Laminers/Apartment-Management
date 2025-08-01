// src/pages/admin/TenantManagement.js
import React, { useEffect, useState } from 'react';
import {
    getTenants,
    registerTenant,
    updateTenant,
    deleteTenant
} from '../../../api/axios';
import TenantFormModal from './TenantFormModal';

export default function TenantManagement() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState(defaultForm());

    function defaultForm() {
        return {
            first_name: '',
            middle_name: '',
            last_name: '',
            email: '',
            password: '',
            password_confirmation: '',
            contact_number: '',
            profile_image: '',
            telegram_id: '',
            messenger_psid: '',
            messenger_link: '',
            occupation: '',
            income: '',
            civil_status: '',
            dependents: '',
            employer_info: '',
            valid_id: '',
        };
    }

    useEffect(() => {
        fetchTenants();
    }, []);

    async function fetchTenants() {
        try {
            setLoading(true);
            const res = await getTenants();
            setTenants(res.data);
        } catch (err) {
            console.error('Failed to fetch tenants:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (editingId) {
                await updateTenant(editingId, form);
            } else {
                await registerTenant(form);
            }
            fetchTenants();
            setForm(defaultForm());
            setEditingId(null);
            setError('');
            bootstrap.Modal.getInstance(document.getElementById('tenantModal')).hide();
        } catch (err) {
            console.error(err);
            setError('Failed to save tenant. Please check input.');
        }
    }

    function handleEdit(tenant) {
        setEditingId(tenant.id);
        setForm({
            ...defaultForm(),
            ...tenant,
            ...tenant.tenantProfile,
            password: '',
            password_confirmation: '',
        });
        new bootstrap.Modal(document.getElementById('tenantModal')).show();
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this tenant?')) return;
        try {
            await deleteTenant(id);
            fetchTenants();
        } catch (err) {
            console.error('Failed to delete tenant:', err);
        }
    }

    function renderTenantDetails(tenant) {
        if (!tenant) return null;
        const profile = tenant.tenantProfile || {};
        const display = (value) => value ?? 'N/A';

        return (
            <div className="card mt-4">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                        <i className="bi bi-person-circle me-2" />
                        {tenant.first_name} {tenant.middle_name} {tenant.last_name}
                    </h5>
                </div>
                <div className="card-body">
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item"><strong>Email:</strong> {display(tenant.email)}</li>
                        <li className="list-group-item"><strong>Contact Number:</strong> {display(tenant.contact_number)}</li>
                        <li className="list-group-item"><strong>Telegram ID:</strong> {display(tenant.telegram_id)}</li>
                        <li className="list-group-item"><strong>Messenger PSID:</strong> {display(tenant.messenger_psid)}</li>
                        <li className="list-group-item"><strong>Messenger Link:</strong> {display(tenant.messenger_link)}</li>
                        <li className="list-group-item"><strong>Occupation:</strong> {display(profile.occupation)}</li>
                        <li className="list-group-item"><strong>Income:</strong> {display(profile.income)}</li>
                        <li className="list-group-item"><strong>Civil Status:</strong> {display(profile.civil_status)}</li>
                        <li className="list-group-item"><strong>Dependents:</strong> {display(profile.dependents)}</li>
                        <li className="list-group-item"><strong>Employer Info:</strong> {display(profile.employer_info)}</li>
                        <li className="list-group-item"><strong>Valid ID:</strong> {display(profile.valid_id)}</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4><i className="bi bi-people-fill me-2"></i>Tenant Management</h4>
                <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#tenantModal">
                    <i className="bi bi-plus-lg me-1"></i>Add Tenant
                </button>
            </div>

            {loading ? (
                <div className="text-center my-4">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead className="table-dark">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Contact</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-3">
                                        <i className="bi bi-exclamation-circle me-2"></i>No tenants found.
                                    </td>
                                </tr>
                            ) : (
                                tenants.map(t => (
                                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedTenant(t)}>
                                        <td>{t.first_name} {t.last_name}</td>
                                        <td>{t.email}</td>
                                        <td>{t.contact_number || 'N/A'}</td>
                                        <td>
                                            <button className="btn btn-sm btn-warning me-2" onClick={(e) => { e.stopPropagation(); handleEdit(t); }}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>
                </div>
            )}

            {selectedTenant && renderTenantDetails(selectedTenant)}

            {/* Modal component */}
            <TenantFormModal
                form={form}
                setForm={setForm}
                handleSubmit={handleSubmit}
                editingId={editingId}
                error={error}
            />
        </div>
    );
}
