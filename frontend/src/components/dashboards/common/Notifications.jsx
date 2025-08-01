import { useEffect, useState } from 'react';
import { getMyNotifications } from '../../../api/axios';

export default function Notifications({ title = 'My Notifications' }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const res = await getMyNotifications();
                setNotifications(res.data);
            } catch (err) {
                console.error('Failed to load notifications', err);
            } finally {
                setLoading(false);
            }
        }

        fetch();
    }, []);

    return (
        <div className="container py-3">
            <div className="card shadow">
                <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
                    <h5 className="mb-0">
                        <i className="bi bi-bell-fill me-2"></i>{title}
                    </h5>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-muted text-center">No notifications yet.</p>
                    ) : (
                        <ul className="list-group">
                            {notifications.map(n => (
                                <li key={n.id} className="list-group-item">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <i className="bi bi-info-circle-fill text-secondary me-2"></i>
                                            <strong>{n.event}</strong> via <span className="badge bg-secondary text-uppercase">{n.channel}</span>
                                        </div>
                                        <small className="text-muted">
                                            {n.sent_at ? new Date(n.sent_at).toLocaleString() : 'Pending'}
                                        </small>
                                    </div>
                                    <div className="mt-1">
                                        <span className={`badge ${n.status === 'sent' ? 'bg-success' :
                                                n.status === 'failed' ? 'bg-danger' :
                                                    'bg-warning text-dark'
                                            }`}>
                                            {n.status}
                                        </span>
                                    </div>
                                    {n.payload && (
                                        <details className="mt-2">
                                            <summary className="text-primary" style={{ cursor: 'pointer' }}>
                                                <i className="bi bi-chevron-down me-1"></i> View Payload
                                            </summary>
                                            <pre className="bg-light p-2 mt-2 border rounded small">
                                                {JSON.stringify(n.payload, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
