import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProperties, deleteProperty } from '../../../api/axios';
import PropertyForm from './PropertyForm';

export default function PropertyList() {
    const [properties, setProperties] = useState([]);
    const [limits, setLimits] = useState({ max_properties: null, current_properties: 0 });
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await getProperties();
            setProperties(res.data.properties);
            setLimits(res.data.limits);
        } catch {
            alert('Failed to fetch properties.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this property? All of its units and leases will be deleted.')) return;
        try {
            await deleteProperty(id);
            fetchProperties();
        } catch {
            alert('Delete failed.');
        }
    };

    const handleEdit = (prop) => {
        setEditing(prop);
        setShowForm(true);
    };

    const isUnlimited = limits.max_properties === null || limits.max_properties === 0;
    const reachedLimit = !isUnlimited && limits.current_properties >= limits.max_properties;

    return (
        <div className="container mt-4">
            <h2>My Properties</h2>
            <h6 className="text-muted mb-3">
                {isUnlimited
                    ? `${limits.current_properties} properties used (Unlimited plan)`
                    : `${limits.current_properties} of ${limits.max_properties} properties used`}
            </h6>

            <button
                className="btn btn-success mb-3"
                onClick={() => { setEditing(null); setShowForm(true); }}
                disabled={reachedLimit}
            >
                <i className="bi bi-plus-circle me-1"></i>Add Property
            </button>

            {reachedLimit && (
                <div className="alert alert-warning">
                    You've reached your plan's property limit.
                </div>
            )}

            {showForm && (
                <PropertyForm
                    editing={editing}
                    onClose={() => {
                        setShowForm(false);
                        fetchProperties();
                    }}
                />
            )}

            <div className="row">
                {properties.map(prop => (
                    <div className="col-md-4 mb-3" key={prop.id}>
                        <div className="card h-100 shadow">
                            {prop.image_url && (
                                <img
                                    src={prop.image_url}
                                    alt="Property"
                                    className="card-img-top"
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                            )}
                            <div className="card-body">
                                <h5 className="card-title">{prop.name}</h5>
                                <p>{prop.address}</p>
                                <p><strong>Units:</strong> {prop.units_count}</p>

                                <button
                                    className="btn btn-sm btn-primary me-2"
                                    onClick={() => handleEdit(prop)}
                                    disabled={!prop.editable}
                                    title={!prop.editable
                                        ? "Upgrade plan to edit this property"
                                        : "Edit property"}
                                >
                                    <i className="bi bi-pencil-square me-1"></i>Edit
                                </button>

                                <button
                                    className="btn btn-sm btn-danger me-2"
                                    onClick={() => handleDelete(prop.id)}
                                >
                                    <i className="bi bi-trash me-1"></i>Delete
                                </button>

                                <Link
                                    to={`/landlord/dashboard/properties/${prop.id}/units`}
                                    className="btn btn-sm btn-warning"
                                    title={
                                        prop.editable
                                            ? "Manage Units"
                                            : "View Units (edit/creation locked under current plan)"
                                    }
                                >
                                    <i className="bi bi-boxes me-1"></i>
                                    {prop.editable ? 'Manage Units' : 'View Units'}
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
