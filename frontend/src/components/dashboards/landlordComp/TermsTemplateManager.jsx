import React, { useEffect, useState } from 'react';
import {
    getTermsTemplates,
    createTermsTemplate,
    updateTermsTemplate,
    deleteTermsTemplate,
} from '../../../api/axios';

const CATEGORY_OPTIONS = ['Pets', 'Visitors', 'Noise', 'Maintenance', 'Smoking', 'Other'];

export default function TermsTemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [form, setForm] = useState({ category: '', customCategory: '', content: [''] });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTemplates = async () => {
        try {
            const res = await getTermsTemplates();
            setTemplates(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to load templates');
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleChange = (e, index = null) => {
        const { name, value } = e.target;
        if (name === 'content') {
            const newContent = [...form.content];
            newContent[index] = value;
            setForm({ ...form, content: newContent });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const addContentField = () => {
        setForm({ ...form, content: [...form.content, ''] });
    };

    const removeContentField = (index) => {
        const newContent = form.content.filter((_, i) => i !== index);
        setForm({ ...form, content: newContent });
    };

    const isCategoryValid =
        form.category && (form.category !== 'Other' || form.customCategory.trim() !== '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const payload = {
                category: form.category === 'Other' ? form.customCategory : form.category,
                content: form.content,
            };

            if (editingId) {
                await updateTermsTemplate(editingId, payload);
                alert('Template updated.');
            } else {
                await createTermsTemplate(payload);
                alert('Template created.');
            }

            setForm({ category: '', customCategory: '', content: [''] });
            setEditingId(null);
            await fetchTemplates();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setEditingId(template.id);
        setForm({
            category: CATEGORY_OPTIONS.includes(template.category) ? template.category : 'Other',
            customCategory: CATEGORY_OPTIONS.includes(template.category) ? '' : template.category,
            content: template.content,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await deleteTermsTemplate(id);
            await fetchTemplates();
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    return (
        <div className="container py-4">
            <h3 className="mb-4">{editingId ? 'Edit Template' : 'Create Terms Template'}</h3>

            <form onSubmit={handleSubmit} className="mb-5">
                <fieldset disabled={loading}>
                    <div className="mb-3">
                        <label className="form-label">Select Category</label>
                        <select
                            className="form-select"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- Choose Category --</option>
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {form.category === 'Other' && (
                        <div className="mb-3">
                            <label className="form-label">Custom Category</label>
                            <input
                                type="text"
                                className="form-control"
                                name="customCategory"
                                value={form.customCategory}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    {form.content.map((item, index) => (
                        <div className="mb-3" key={index}>
                            <label className="form-label">Content Block {index + 1}</label>
                            <div className="input-group">
                                <textarea
                                    className="form-control"
                                    name="content"
                                    value={item}
                                    onChange={(e) => handleChange(e, index)}
                                    disabled={!isCategoryValid}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => removeContentField(index)}
                                    title="Remove Block"
                                    disabled={!isCategoryValid}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="btn btn-secondary mb-3"
                        onClick={addContentField}
                        disabled={!isCategoryValid}
                    >
                        <i className="bi bi-plus-lg"></i> Add Content Block
                    </button>

                    <div>
                        <button type="submit" className="btn btn-primary" disabled={loading || !isCategoryValid}>
                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    Saving...
                                </>
                            ) : editingId ? 'Update' : 'Create'}
                        </button>
                    </div>
                </fieldset>
            </form>

            <hr />

            <h4>Your Templates</h4>
            {templates.length === 0 ? (
                <p>No templates found.</p>
            ) : (
                <div className="accordion" id="templatesAccordion">
                    {templates.map((tpl) => (
                        <div className="accordion-item" key={tpl.id}>
                            <h2 className="accordion-header" id={`heading-${tpl.id}`}>
                                <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target={`#collapse-${tpl.id}`}
                                    aria-expanded="false"
                                    aria-controls={`collapse-${tpl.id}`}
                                >
                                    {tpl.category}
                                </button>
                            </h2>
                            <div
                                id={`collapse-${tpl.id}`}
                                className="accordion-collapse collapse"
                                aria-labelledby={`heading-${tpl.id}`}
                                data-bs-parent="#templatesAccordion"
                            >
                                <div className="accordion-body">
                                    <strong>Content:</strong>
                                    <ul>
                                        {tpl.content.map((block, i) => (
                                            <li key={i}>{block}</li>
                                        ))}
                                    </ul>

                                    <strong>Agreed by Tenants:</strong>
                                    {tpl.agreements?.length > 0 ? (
                                        <ul>
                                            {tpl.agreements.map((agreement, i) => {
                                                const user = agreement.user;
                                                const agreedAt = new Date(agreement.date_agreed).toLocaleString();
                                                const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Unknown';
                                                return (
                                                    <li key={i}>
                                                        {fullName} ({user?.email ?? 'No email'})<br />
                                                        <small className="text-muted">Agreed on: {agreedAt}</small>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-muted">No tenants have agreed yet.</p>
                                    )}

                                    <div className="mt-3">
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => handleEdit(tpl)}
                                            disabled={loading}
                                        >
                                            <i className="bi bi-pencil-square"></i> Edit
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(tpl.id)}
                                            disabled={loading}
                                        >
                                            <i className="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
