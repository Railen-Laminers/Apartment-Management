import { useEffect, useState } from 'react';
import {
    getFinancialRecords,
    createFinancialRecord,
    getFinancialSummary,
} from '../../../../api/axios'; // Adjust path if needed

export default function FinancialPage() {
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false); // Prevent double-clicks
    const [form, setForm] = useState({
        type: 'income',
        category: '',
        description: '',
        amount: '',
        due_date: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [recordsRes, summaryRes] = await Promise.all([
                getFinancialRecords(),
                getFinancialSummary()
            ]);
            setRecords(recordsRes.data || []);
            setSummary(summaryRes.data || null);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to load financial data.';
            setError(msg);
            console.error('Error fetching financial data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return; // Prevent spam click

        setSubmitting(true);
        try {
            await createFinancialRecord(form);
            setForm({
                type: 'income',
                category: '',
                description: '',
                amount: '',
                due_date: '',
            });
            setShowForm(false);
            fetchData();
        } catch (err) {
            const status = err?.response?.status;
            const msg =
                status === 409
                    ? 'This record appears to be a duplicate.'
                    : err?.response?.data?.message || 'Failed to save record.';
            alert(msg);
            console.error('Error submitting record:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading financial records...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div className="container my-4">
            <h2>Financial Overview</h2>

            {summary && (
                <div className="mb-4">
                    <h5>Summary for {summary.month}/{summary.year}</h5>
                    <ul>
                        <li><strong>Total Income:</strong> ₱{summary.total_income.toFixed(2)}</li>
                        <li><strong>Total Expense:</strong> ₱{summary.total_expense.toFixed(2)}</li>
                        <li><strong>Net:</strong> ₱{summary.net.toFixed(2)}</li>
                    </ul>
                </div>
            )}

            <button className="btn btn-primary mb-3" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancel' : 'Add New Record'}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-4 border p-3 rounded bg-light">
                    <div className="row">
                        <div className="col-md-3 mb-2">
                            <label className="form-label">Type</label>
                            <select className="form-control" name="type" value={form.type} onChange={handleChange}>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                        <div className="col-md-3 mb-2">
                            <label className="form-label">Category</label>
                            <input type="text" name="category" className="form-control" value={form.category} onChange={handleChange} required />
                        </div>
                        <div className="col-md-3 mb-2">
                            <label className="form-label">Amount (₱)</label>
                            <input type="number" name="amount" className="form-control" value={form.amount} onChange={handleChange} required />
                        </div>
                        <div className="col-md-3 mb-2">
                            <label className="form-label">Due Date</label>
                            <input type="date" name="due_date" className="form-control" value={form.due_date} onChange={handleChange} />
                        </div>
                        <div className="col-12 mb-2">
                            <label className="form-label">Description</label>
                            <textarea name="description" className="form-control" value={form.description} onChange={handleChange}></textarea>
                        </div>
                        <div className="col-12">
                            <button type="submit" className="btn btn-success" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Record'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <h4>All Financial Records</h4>
            <table className="table table-bordered">
                <thead className="table-secondary">
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount (₱)</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">No records found.</td>
                        </tr>
                    ) : (
                        records.map((record) => (
                            <tr key={record.id}>
                                <td>{new Date(record.created_at).toLocaleDateString()}</td>
                                <td className={record.type === 'income' ? 'text-success' : 'text-danger'}>
                                    {record.type.toUpperCase()}
                                </td>
                                <td>{record.category}</td>
                                <td>{record.description || '—'}</td>
                                <td>₱{parseFloat(record.amount).toFixed(2)}</td>
                                <td>{record.due_date ? new Date(record.due_date).toLocaleDateString() : '-'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
