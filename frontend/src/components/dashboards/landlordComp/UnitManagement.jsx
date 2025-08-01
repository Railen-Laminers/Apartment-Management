import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnits, deleteUnit } from '../../../api/axios';
import UnitForm from './UnitForm';

export default function UnitManagement() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [units, setUnits] = useState([]);
    const [limits, setLimits] = useState({ current: 0, max: null });
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await getUnits(id);
            setProperty(res.data.property);
            setUnits(res.data.units);
            setLimits({
                current: res.data.limits.current,
                max: res.data.limits.max
            });
        } catch {
            alert('Failed to load data');
        }
    };

    const handleDelete = async uid => {
        if (!window.confirm('Delete this unit?')) return;
        try {
            await deleteUnit(id, uid);
            fetchData();
        } catch {
            alert('Failed to delete unit');
        }
    };

    const handleEdit = unit => {
        setEditing(unit);
        setShowForm(true);
    };

    const isUnlimited = limits.max === null || limits.max === 0;
    const reachedLimit = !isUnlimited && limits.current >= limits.max;
    const canAddUnit = property?.editable && !reachedLimit;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Units in {property?.name}</h3>
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/landlord/dashboard/properties')}
                >
                    <i className="bi bi-arrow-left-circle me-1"></i>Back
                </button>
            </div>

            <h6 className="text-muted mb-3">
                {isUnlimited
                    ? `${limits.current} units used (Unlimited plan)`
                    : `${limits.current} of ${limits.max} units used`}
            </h6>

            {!isUnlimited && (
                <div className="progress mb-3" style={{ height: '20px' }}>
                    <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                            width: `${(limits.current / limits.max) * 100}%`
                        }}
                    >
                        {limits.current} / {limits.max}
                    </div>
                </div>
            )}

            {/* Add Unit Button */}
            <button
                className="btn btn-success mb-3"
                onClick={() => {
                    setEditing(null);
                    setShowForm(true);
                }}
                disabled={!canAddUnit}
                title={
                    !property?.editable
                        ? "Your plan does not allow editing this property."
                        : reachedLimit
                            ? `Unit limit reached: ${limits.current} of ${limits.max}`
                            : "Add Unit"
                }
            >
                <i className="bi bi-plus-circle me-1"></i>Add Unit
            </button>

            {/* Show Unit Form if adding/editing */}
            {showForm && (
                <UnitForm
                    propertyId={id}
                    editing={editing}
                    onClose={() => {
                        setShowForm(false);
                        fetchData();
                    }}
                />
            )}

            {/* Unit Cards */}
            {units.map(u => (
                <div key={u.id} className="card mb-2 shadow-sm">
                    <div className="card-body">
                        <h5 className="card-title">Unit {u.unit_number}</h5>
                        <p>Type: {u.unit_type}</p>
                        <p>Rent: ₱{u.rent_amount}</p>
                        <p>Floor: {u.floor}, {u.square_meters} sqm</p>
                        <p>
                            Availability:{" "}
                            <span className={`badge ${u.is_available ? 'bg-success' : 'bg-secondary'}`}>
                                {u.is_available ? 'Available' : 'Not Available'}
                            </span>
                        </p>

                        {/* Edit Button */}
                        <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEdit(u)}
                            disabled={!u.editable}
                            title={!u.editable
                                ? "Your plan does not allow editing this unit."
                                : "Edit"}
                        >
                            <i className="bi bi-pencil-square me-1"></i>Edit
                        </button>

                        {/* Delete Button (always allowed) */}
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(u.id)}
                        >
                            <i className="bi bi-trash me-1"></i>Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
