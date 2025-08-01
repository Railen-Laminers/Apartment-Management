import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Register() {
    const { register } = useAuth();

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        contact_number: '',
        business_info: '',
        address: ''
    });

    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const onChange = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
        setErrors(err => ({ ...err, [name]: '' }));
        setGeneralError('');
    };

    const validate = () => {
        const newErrors = {};

        if (!form.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!form.last_name.trim()) newErrors.last_name = 'Last name is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        if (!form.password) newErrors.password = 'Password is required';
        if (!form.password_confirmation) newErrors.password_confirmation = 'Confirm your password';
        if (form.password !== form.password_confirmation)
            newErrors.password_confirmation = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSubmit = async e => {
        e.preventDefault();

        // Prevent multiple submissions
        if (loading) return;

        setErrors({});
        setGeneralError('');

        if (!validate()) return;

        setLoading(true);
        try {
            await register(form);
            // You can optionally redirect here
        } catch (er) {
            const status = er.response?.status;
            const message = er.response?.data?.message;

            if (status === 409) {
                setGeneralError('This registration already exists. Please login or reset your password.');
            } else if (status === 422 && er.response.data?.errors) {
                setErrors(er.response.data.errors);
            } else {
                setGeneralError(message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 700 }}>
            <h2>Register (Landlord Only)</h2>

            {generalError && <div className="alert alert-danger">{generalError}</div>}

            <form onSubmit={onSubmit}>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">First Name</label>
                        <input
                            name="first_name"
                            className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                            value={form.first_name}
                            onChange={onChange}
                        />
                        {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Middle Name</label>
                        <input
                            name="middle_name"
                            className="form-control"
                            value={form.middle_name}
                            onChange={onChange}
                        />
                    </div>

                    <div className="col-12">
                        <label className="form-label">Last Name</label>
                        <input
                            name="last_name"
                            className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                            value={form.last_name}
                            onChange={onChange}
                        />
                        {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
                    </div>
                </div>

                <div className="mb-3 mt-3">
                    <label className="form-label">Email</label>
                    <input
                        name="email"
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={form.email}
                        onChange={onChange}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Password</label>
                        <div className="input-group">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                value={form.password}
                                onChange={onChange}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>
                        {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">Confirm Password</label>
                        <div className="input-group">
                            <input
                                name="password_confirmation"
                                type={showConfirmPassword ? 'text' : 'password'}
                                className={`form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                                value={form.password_confirmation}
                                onChange={onChange}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <div className="invalid-feedback d-block">{errors.password_confirmation}</div>
                        )}
                    </div>
                </div>

                <div className="mb-3 mt-3">
                    <label className="form-label">Contact Number</label>
                    <input
                        name="contact_number"
                        className="form-control"
                        value={form.contact_number}
                        onChange={onChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Business Info</label>
                    <textarea
                        name="business_info"
                        className="form-control"
                        value={form.business_info}
                        onChange={onChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                        name="address"
                        className="form-control"
                        value={form.address}
                        onChange={onChange}
                    />
                </div>

                <button type="submit" className="btn btn-success w-100" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>

            <p className="mt-3">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
}
