import { useState } from 'react';
import { createProperty, updateProperty } from '../../../api/axios';

export default function PropertyForm({ editing, onClose }) {
    const [form, setForm] = useState({
        name: editing?.name || '',
        address: editing?.address || '',
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSizeMB = 2;
            const maxSizeBytes = maxSizeMB * 1024 * 1024;

            if (file.size > maxSizeBytes) {
                alert(`Image must be less than ${maxSizeMB}MB.`);
                e.target.value = '';
                setImage(null);
                setPreview(null);
                return;
            }

            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; // Prevent double submission

        setLoading(true);

        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('address', form.address);
        if (image) fd.append('image', image);

        try {
            if (editing) {
                await updateProperty(editing.id, fd);
            } else {
                await createProperty(fd);
            }
            onClose(); // Close the form on success
        } catch (err) {
            const message =
                err.response?.data?.message ||
                (err.response?.status === 409
                    ? 'A property with the same name and address already exists.'
                    : 'Error saving property.');
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card mb-3 shadow">
            <div className="card-header fw-bold">
                {editing ? '✏️ Edit Property' : '🏠 Add New Property'}
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                            name="name"
                            className="form-control"
                            value={form.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Address</label>
                        <textarea
                            name="address"
                            className="form-control"
                            value={form.address}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Upload Property Image</label>
                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={handleFile}
                            disabled={loading}
                        />
                        <small className="text-muted">Max image size: 2MB</small> <br />

                        {preview && (
                            <img
                                src={preview}
                                alt="Preview"
                                className="mt-2"
                                style={{ height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                        )}
                    </div>

                    <button
                        className="btn btn-primary me-2"
                        type="submit"
                        disabled={loading}
                    >
                        <i className="bi bi-check-circle me-1"></i>
                        {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        type="button"
                        disabled={loading}
                    >
                        <i className="bi bi-x-circle me-1"></i>Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}
