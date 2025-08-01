import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const onChange = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));

        // Clear specific error on change
        if (name === 'email') setEmailError('');
        if (name === 'password') setPasswordError('');
        setGeneralError('');
    };

    const validate = () => {
        let isValid = true;

        if (!form.email.trim()) {
            setEmailError('Email is required');
            isValid = false;
        }

        if (!form.password.trim()) {
            setPasswordError('Password is required');
            isValid = false;
        }

        return isValid;
    };

    const onSubmit = async e => {
        e.preventDefault();

        setEmailError('');
        setPasswordError('');
        setGeneralError('');

        if (!validate()) return;

        setLoading(true);
        try {
            await login(form);
        } catch (er) {
            setGeneralError(er.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 400 }}>
            <h2>Login</h2>

            {generalError && <div className="alert alert-danger">{generalError}</div>}

            <form onSubmit={onSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        name="email"
                        type="email"
                        className={`form-control ${emailError ? 'is-invalid' : ''}`}
                        value={form.email}
                        onChange={onChange}
                    />
                    {emailError && <div className="invalid-feedback">{emailError}</div>}
                </div>

                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                        <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            className={`form-control ${passwordError ? 'is-invalid' : ''}`}
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
                    {passwordError && <div className="invalid-feedback d-block">{passwordError}</div>}
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <p className="mt-3">
                No account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
}
