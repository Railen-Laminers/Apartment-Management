import React, { useState } from 'react';
import { updateProfile, generateMessengerLink } from '../../../api/axios';
import { useAuth } from '../../../contexts/AuthContext';

export default function ProfileForm() {
    const { user, profile, setUser, setProfile, plan } = useAuth();
    const allowedChannels = plan?.channels || [];
    const allowsTelegram = allowedChannels.includes('telegram');
    const allowsMessenger = allowedChannels.includes('messenger');

    const [form, setForm] = useState({
        first_name: user?.first_name || '',
        middle_name: user?.middle_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        contact_number: user?.contact_number || '',
        telegram_id: user?.telegram_id || '',
        messenger_link: user?.messenger_link || '',
        profile_image: null, // updated to file input
        business_info: profile?.business_info || '',
        address: profile?.address || '',
        occupation: profile?.occupation || '',
        income: profile?.income?.toString() || '',
        civil_status: profile?.civil_status || '',
        dependents: profile?.dependents?.toString() || '',
        employer_info: profile?.employer_info || '',
        valid_id: profile?.valid_id || '',
        payment_methods: (profile?.payment_methods || []).map(method => ({
            type: method.type || '',
            account_name: method.account_name || '',
            account_number: method.account_number || '',
            qr_code_url: method.qr_code_url || ''
        })),
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [messengerInfo, setMessengerInfo] = useState(null);
    const [preview, setPreview] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: null }));
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            const maxSizeMB = 2;
            const maxSizeBytes = maxSizeMB * 1024 * 1024;

            if (file.size > maxSizeBytes) {
                alert(`Profile image must be less than ${maxSizeMB}MB.`);
                e.target.value = ''; // Clear the file input
                setForm(prev => ({ ...prev, profile_image: null }));
                setPreview(null);
                return;
            }

            setForm(prev => ({ ...prev, profile_image: file }));
            setPreview(URL.createObjectURL(file));
        }
    }


    function updatePaymentMethodField(index, field, value) {
        const updated = [...form.payment_methods];
        updated[index][field] = value === null ? '' : value;
        setForm(prev => ({ ...prev, payment_methods: updated }));
    }

    function addPaymentMethod() {
        setForm(prev => ({
            ...prev,
            payment_methods: [
                ...prev.payment_methods,
                { type: '', account_name: '', account_number: '', qr_code_url: '' }
            ]
        }));
    }

    function removePaymentMethod(index) {
        setForm(prev => ({
            ...prev,
            payment_methods: prev.payment_methods.filter((_, i) => i !== index)
        }));
    }

    async function handleGenerateMessengerLink() {
        try {
            const res = await generateMessengerLink();
            setForm(prev => ({ ...prev, messenger_link: res.data.code || '' }));
            setMessengerInfo({
                code: res.data.code,
                instructions: res.data.instructions,
                link: res.data.messenger_page_url
            });
        } catch {
            setStatus({ type: 'error', msg: 'Failed to generate Messenger code' });
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setStatus(null);
        const errs = {};

        if (!form.first_name.trim()) errs.first_name = 'Required';
        if (!form.last_name.trim()) errs.last_name = 'Required';
        if (!form.email.trim()) errs.email = 'Required';
        if (form.income && isNaN(form.income)) errs.income = 'Must be a number';
        if (form.dependents && isNaN(form.dependents)) errs.dependents = 'Must be a number';

        if (form.new_password || form.confirm_password || form.current_password) {
            if (!form.current_password) errs.current_password = 'Required';
            if (!form.new_password || form.new_password.length < 8) errs.new_password = 'Must be 8+ characters';
            if (form.new_password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
        }

        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        try {
            const res = await updateProfile(form);
            setUser(res.data.user);
            setProfile(res.data.user.landlord_profile || res.data.user.tenant_profile || null);
            setStatus({ type: 'success', msg: 'Profile updated successfully' });
        } catch {
            setStatus({ type: 'error', msg: 'Update failed' });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
            <h5 className="mb-3"><i className="bi bi-pencil-square me-2"></i>Update Profile</h5>
            <div className="row">
                {/* Name & Email */}
                {['first_name', 'middle_name', 'last_name', 'email', 'contact_number'].map((field, idx) => (
                    <div className="col-md-6 mb-3" key={field}>
                        <label className="form-label">{field.replace('_', ' ').toUpperCase()}</label>
                        <input
                            name={field}
                            className={`form-control ${errors[field] ? 'is-invalid' : ''}`}
                            value={form[field]}
                            onChange={handleChange}
                        />
                        {errors[field] && <div className="invalid-feedback">{errors[field]}</div>}
                    </div>
                ))}

                {/* Profile Image Upload */}
                <div className="col-md-12 mb-3">
                    <label>Profile Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={handleFileChange}
                    />
                    <small className="text-muted">Max image size: 2MB</small> <br />
                    {preview && (
                        <div className="mt-2">
                            <img src={preview} alt="Preview" className="img-thumbnail" width="120" />
                        </div>
                    )}
                </div>


                {/* Telegram and Messenger */}
                {allowsTelegram && (
                    <div className="col-md-6 mb-3">
                        <label>Telegram ID</label>
                        <input name="telegram_id" className="form-control" value={form.telegram_id} onChange={handleChange} />
                    </div>
                )}

                {allowsMessenger && (
                    <div className="col-md-6 mb-3">
                        <label>Messenger Code</label>
                        <div className="input-group">
                            <input name="messenger_link" className="form-control" value={form.messenger_link} readOnly />
                            <button type="button" className="btn btn-outline-secondary" onClick={handleGenerateMessengerLink}>
                                Generate
                            </button>
                        </div>
                        {messengerInfo && (
                            <div className="alert alert-info mt-2">
                                <strong>Instructions:</strong> {messengerInfo.instructions}
                                <br />
                                <a href={messengerInfo.link} target="_blank" rel="noopener noreferrer">Messenger Page</a>
                            </div>
                        )}
                    </div>
                )}

                {/* Role-based fields */}
                {user.role === 'landlord' && (
                    <>
                        <div className="col-md-6 mb-3">
                            <label>Business Info</label>
                            <input name="business_info" className="form-control" value={form.business_info} onChange={handleChange} />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label>Address</label>
                            <input name="address" className="form-control" value={form.address} onChange={handleChange} />
                        </div>

                        {/* Payment Methods */}
                        <div className="col-12 mb-3">
                            <label>Payment Methods</label>
                            {form.payment_methods.map((method, i) => (
                                <div key={i} className="border rounded p-3 mb-2">
                                    <div className="row">
                                        <div className="col-md-4 mb-2">
                                            <label>Type</label>
                                            <select className="form-select" value={method.type} onChange={e => updatePaymentMethodField(i, 'type', e.target.value)}>
                                                <option value="">Select</option>
                                                <option value="GCash">GCash</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <label>Account Name</label>
                                            <input className="form-control" value={method.account_name} onChange={e => updatePaymentMethodField(i, 'account_name', e.target.value)} />
                                        </div>
                                        <div className="col-md-4 mb-2">
                                            <label>Account Number</label>
                                            <input className="form-control" value={method.account_number} onChange={e => updatePaymentMethodField(i, 'account_number', e.target.value)} />
                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <label>QR Code URL (optional)</label>
                                            <input className="form-control" value={method.qr_code_url} onChange={e => updatePaymentMethodField(i, 'qr_code_url', e.target.value)} />
                                        </div>
                                        <div className="col-md-6 d-flex align-items-end justify-content-end">
                                            <button type="button" className="btn btn-danger mt-2" onClick={() => removePaymentMethod(i)}>
                                                <i className="bi bi-x-circle me-1"></i> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" className="btn btn-outline-primary" onClick={addPaymentMethod}>
                                <i className="bi bi-plus-circle me-1"></i> Add Payment Method
                            </button>
                        </div>
                    </>
                )}

                {user.role === 'tenant' && (
                    <>
                        <div className="col-md-6 mb-3">
                            <label>Occupation</label>
                            <input name="occupation" className="form-control" value={form.occupation} onChange={handleChange} />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label>Income</label>
                            <input name="income" className={`form-control ${errors.income ? 'is-invalid' : ''}`} value={form.income} onChange={handleChange} />
                            {errors.income && <div className="invalid-feedback">{errors.income}</div>}
                        </div>
                        <div className="col-md-6 mb-3">
                            <label>Civil Status</label>
                            <input name="civil_status" className="form-control" value={form.civil_status} onChange={handleChange} />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label>Dependents</label>
                            <input name="dependents" className={`form-control ${errors.dependents ? 'is-invalid' : ''}`} value={form.dependents} onChange={handleChange} />
                            {errors.dependents && <div className="invalid-feedback">{errors.dependents}</div>}
                        </div>
                        <div className="col-md-12 mb-3">
                            <label>Employer Info</label>
                            <input name="employer_info" className="form-control" value={form.employer_info} onChange={handleChange} />
                        </div>
                        <div className="col-md-12 mb-3">
                            <label>Valid ID</label>
                            <input name="valid_id" className="form-control" value={form.valid_id} onChange={handleChange} />
                        </div>
                    </>
                )}

                {/* Password Section */}
                {['current_password', 'new_password', 'confirm_password'].map((field, idx) => (
                    <div className={`col-md-${field === 'current_password' ? '12' : '6'} mb-2`} key={field}>
                        <label>{field.replace('_', ' ').toUpperCase()}</label>
                        <input
                            type={showPass ? 'text' : 'password'}
                            name={field}
                            className={`form-control ${errors[field] ? 'is-invalid' : ''}`}
                            value={form[field]}
                            onChange={handleChange}
                        />
                        {errors[field] && <div className="invalid-feedback">{errors[field]}</div>}
                    </div>
                ))}

                <div className="form-check mb-3">
                    <input className="form-check-input" type="checkbox" checked={showPass} onChange={() => setShowPass(!showPass)} />
                    <label className="form-check-label">Show Password</label>
                </div>
            </div>

            {status && (
                <div className={`alert mt-3 ${status.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                    {status.msg}
                </div>
            )}

            <button type="submit" className="btn btn-primary mt-3">
                <i className="bi bi-save me-1"></i> Save Changes
            </button>
        </form>
    );
}
