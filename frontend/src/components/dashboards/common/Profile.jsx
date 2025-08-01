import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile({ user, profile, plan }) {
    const navigate = useNavigate();

    useEffect(() => {
        const hasReloaded = sessionStorage.getItem('hasReloaded');
        if (user && user.id && !hasReloaded) {
            sessionStorage.setItem('hasReloaded', 'true');
            window.location.reload();
        }
    }, [user]);

    const handleAdClick = () => {
        navigate('/landlord/dashboard/subscriptions');
    };

    return (
        <>
            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                        {user.profile_image_url ? (
                            <img
                                src={user.profile_image_url}
                                alt="Profile"
                                className="rounded-circle me-3"
                                width="70"
                                height="70"
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div
                                className="bg-secondary text-white d-flex align-items-center justify-content-center rounded-circle me-3"
                                style={{ width: 70, height: 70, fontSize: 24 }}
                            >
                                {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                        )}

                        <div>
                            <h4 className="mb-0">
                                {user.first_name} {user.middle_name} {user.last_name}
                            </h4>
                            <p className="text-muted mb-0">{user.role?.toUpperCase()}</p>
                        </div>
                    </div>

                    <p className="mb-1">
                        <i className="bi bi-envelope-fill me-2 text-primary"></i>
                        {user.email}
                    </p>

                    <p className="mb-1">
                        <i className="bi bi-telephone-fill me-2 text-success"></i>
                        {user.contact_number || 'N/A'}
                    </p>

                    {user.telegram_id && (
                        <p className="mb-1">
                            <i className="bi bi-telegram me-2 text-info"></i>
                            Telegram ID: <code>{user.telegram_id}</code>
                        </p>
                    )}

                    {user.messenger_psid ? (
                        <p className="mb-1">
                            <i className="bi bi-messenger me-2 text-primary"></i>
                            Messenger: <span className="text-success fw-semibold">Linked</span>
                        </p>
                    ) : (
                        <p className="mb-1">
                            <i className="bi bi-messenger me-2 text-secondary"></i>
                            Messenger: <span className="text-muted">Not linked</span>
                        </p>
                    )}

                    {user.messenger_link && (
                        <p className="mb-1">
                            <i className="bi bi-code-slash me-2 text-primary"></i>
                            Messenger Link Code: <code>{user.messenger_link}</code>
                        </p>
                    )}


                    {user.role === 'landlord' && profile && (
                        <>
                            <h6 className="text-muted">Landlord Info</h6>
                            <p><strong>Business:</strong> {profile.business_info || 'N/A'}</p>
                            <p><strong>Address:</strong> {profile.address || 'N/A'}</p>

                            {Array.isArray(profile.payment_methods) && profile.payment_methods.length > 0 && (
                                <>
                                    <h6 className="mt-3 text-muted">Payment Methods</h6>
                                    <ul className="list-group mb-2">
                                        {profile.payment_methods.map((method, idx) => (
                                            <li key={idx} className="list-group-item">
                                                <strong>Type:</strong> {method.type || 'N/A'}<br />
                                                <strong>Account Name:</strong> {method.account_name || 'N/A'}<br />
                                                <strong>Account Number:</strong> {method.account_number || 'N/A'}<br />
                                                {method.qr_code_url && (
                                                    <span>
                                                        <strong>QR Code:</strong> <a href={method.qr_code_url} target="_blank" rel="noopener noreferrer">View</a>
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </>
                    )}

                    {user.role === 'tenant' && profile && (
                        <>
                            <h6 className="text-muted">Tenant Info</h6>
                            <p><strong>Occupation:</strong> {profile.occupation || 'N/A'}</p>
                            <p><strong>Income:</strong> {profile.income ? `₱${Number(profile.income).toLocaleString()}` : 'N/A'}</p>
                            <p><strong>Civil Status:</strong> {profile.civil_status || 'N/A'}</p>
                            <p><strong>Dependents:</strong> {profile.dependents ?? 'N/A'}</p>
                            <p><strong>Employer Info:</strong> {profile.employer_info || 'N/A'}</p>
                            <p><strong>Valid ID:</strong> {profile.valid_id || 'N/A'}</p>
                        </>
                    )}
                </div>
            </div>

            {/* 👉 Advertisement Card for Plans */}
            {user.role === 'landlord' && (
                <div className="card shadow border border-primary">
                    <div className="card-body d-flex align-items-center justify-content-between">
                        <div>
                            <h5 className="card-title text-primary">Unlock More Features</h5>
                            <p className="card-text">Upgrade your plan to enjoy more properties, units, and notifications.</p>
                        </div>
                        <button onClick={handleAdClick} className="btn btn-primary">
                            View Plans
                        </button>
                    </div>
                </div>
            )}

            <hr />
        </>
    );
}
