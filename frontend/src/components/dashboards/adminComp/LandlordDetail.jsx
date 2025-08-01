import React from 'react';

export default function LandlordDetail({ landlord }) {
    if (!landlord) return <p className="text-muted">No landlord data provided.</p>;

    const {
        first_name,
        middle_name,
        last_name,
        email,
        contact_number,
        profile_image,
        telegram_id,
        messenger_psid,
        messenger_link,
        landlord_profile,
        subscriptions,
        properties,
        tenants,
    } = landlord;

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                    <i className="bi bi-person-circle me-2" />
                    {first_name} {middle_name ? `${middle_name} ` : ''}{last_name}
                </h5>
            </div>

            <div className="card-body">
                <h6 className="mb-3 text-secondary">Basic Information</h6>
                <ul className="list-group mb-3">
                    <li className="list-group-item"><strong>Email:</strong> {email}</li>
                    <li className="list-group-item"><strong>Contact Number:</strong> {contact_number || 'N/A'}</li>
                    <li className="list-group-item"><strong>Telegram ID:</strong> {telegram_id || 'N/A'}</li>
                    <li className="list-group-item"><strong>Messenger PSID:</strong> {messenger_psid || 'N/A'}</li>
                    <li className="list-group-item"><strong>Messenger Link:</strong> {messenger_link || 'N/A'}</li>
                    <li className="list-group-item">
                        <strong>Profile Image:</strong><br />
                        {profile_image ? (
                            <img src={profile_image} alt="Profile" className="img-thumbnail mt-2" style={{ maxWidth: '120px' }} />
                        ) : 'No profile image'}
                    </li>
                </ul>

                {landlord_profile && (
                    <>
                        <h6 className="mb-3 text-secondary">Landlord Profile</h6>
                        <ul className="list-group mb-3">
                            <li className="list-group-item"><strong>Business Info:</strong> {landlord_profile.business_info || 'N/A'}</li>
                            <li className="list-group-item"><strong>Address:</strong> {landlord_profile.address || 'N/A'}</li>
                            <li className="list-group-item">
                                <strong>Payment Methods:</strong><br />
                                {Array.isArray(landlord_profile.payment_methods) && landlord_profile.payment_methods.length > 0 ? (
                                    <ul className="mt-2">
                                        {landlord_profile.payment_methods.map((method, index) => (
                                            <li key={index} className="mb-2">
                                                <strong>Type:</strong> {method.type || 'N/A'}<br />
                                                <strong>Account Name:</strong> {method.account_name || 'N/A'}<br />
                                                <strong>Account Number:</strong> {method.account_number || 'N/A'}<br />
                                                {method.qr_code_url && (
                                                    <span>
                                                        <strong>QR Code:</strong> <a href={method.qr_code_url} target="_blank" rel="noopener noreferrer">View</a><br />
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-muted">No payment methods provided.</span>
                                )}
                            </li>
                        </ul>
                    </>
                )}

                <hr />

                <h6><i className="bi bi-bookmark me-1" /> Subscriptions</h6>
                {subscriptions?.length > 0 ? (() => {
                    const hasActivePaidPlan = subscriptions.some(
                        sub => sub.status === 'active' && sub.plan && !sub.plan.is_default
                    );

                    const visibleSubscriptions = subscriptions.filter(sub => {
                        if (hasActivePaidPlan) {
                            return sub.plan && !sub.plan.is_default; // Hide free plan
                        }
                        return true; // Show all (including free) if no active paid plan
                    });

                    return visibleSubscriptions.length > 0 ? (
                        <ul className="list-group mb-3">
                            {visibleSubscriptions.map(sub => (
                                <li key={sub.id} className="list-group-item">
                                    <strong>{sub.plan?.name || 'N/A'}</strong><br />
                                    Status: <span className={`badge ${getStatusClass(sub.status)} text-uppercase`}>{sub.status}</span><br />
                                    <small>
                                        Start: {formatDate(sub.started_at || sub.starts_at)}<br />
                                        Ends: {formatDate(sub.ends_at || sub.expires_at)}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted">No subscriptions to display.</p>
                    );
                })() : (
                    <p className="text-muted">No subscriptions found.</p>
                )}

                <hr />

                <h6><i className="bi bi-house-door me-1" /> Properties, Units & Leases</h6>
                {properties?.length > 0 ? (
                    properties.map(prop => (
                        <div key={prop.id} className="mb-3">
                            <strong>{prop.name}</strong>
                            {prop.units?.length > 0 ? (
                                <ul className="list-group mt-2">
                                    {prop.units.map(unit => (
                                        <li key={unit.id} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>
                                                    Unit #{unit.unit_number} – <span className={`badge ${getUnitStatusClass(unit.status)}`}>{unit.status}</span>
                                                </span>
                                            </div>
                                            {unit.leases?.length > 0 ? (
                                                <ul className="mt-2">
                                                    {unit.leases.map(lease => (
                                                        <li key={lease.id}>
                                                            <strong>Lease #{lease.id}</strong> <br />
                                                            Tenant: {lease.tenant?.first_name} {lease.tenant?.last_name} ({lease.tenant?.email})<br />
                                                            Status: <span className={`badge ${getStatusClass(lease.status)}`}>{lease.status}</span><br />
                                                            Period: {formatDate(lease.start_date)} – {formatDate(lease.end_date)}<br />
                                                            Deposit: ₱{Number(lease.security_deposit).toLocaleString()}<br />
                                                            Auto Renew: {lease.auto_renew ? 'Yes' : 'No'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <small className="text-muted">No leases for this unit.</small>}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-muted">No units under this property.</p>}
                        </div>
                    ))
                ) : <p className="text-muted">No properties found.</p>}

                <hr />

                <h6><i className="bi bi-people-fill me-1" /> Tenants</h6>
                {tenants?.length > 0 ? (
                    tenants.map(t => (
                        <div key={t.id} className="card mb-2">
                            <div className="card-body p-2">
                                <strong>{t.user?.first_name} {t.user?.last_name}</strong><br />
                                <small>Email: {t.user?.email}</small><br />
                                <small>Contact: {t.user?.contact_number || 'N/A'}</small><br />
                                {t.occupation && <small>Occupation: {t.occupation}</small>}<br />
                                {t.income !== null && <small>Income: ₱{Number(t.income).toLocaleString()}</small>}<br />
                                {t.civil_status && <small>Civil Status: {t.civil_status}</small>}<br />
                                <small>Dependents: {t.dependents}</small><br />
                                {t.employer_info && <small>Employer: {t.employer_info}</small>}<br />
                                {t.valid_id && <small>Valid ID: {t.valid_id}</small>}
                            </div>
                        </div>
                    ))
                ) : <p className="text-muted">No tenants linked.</p>}
            </div>
        </div>
    );
}

// Helper functions
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'active': return 'bg-success';
        case 'pending': return 'bg-warning text-dark';
        case 'terminated': return 'bg-danger';
        case 'expired': return 'bg-secondary';
        case 'paused': return 'bg-info text-dark';
        case 'canceled': return 'bg-danger';
        default: return 'bg-light text-dark';
    }
}

function getUnitStatusClass(status) {
    switch (status) {
        case 'occupied': return 'bg-danger';
        case 'vacant': return 'bg-success';
        case 'maintenance': return 'bg-warning text-dark';
        default: return 'bg-secondary';
    }
}
