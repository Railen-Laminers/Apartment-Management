import React, { useEffect, useState } from 'react';
import {
    getTermsAgreements,
    agreeToTerms,
    getAvailableTermsTemplates,
} from '../../../api/axios';

export default function TermsAgreement() {
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submittingIds, setSubmittingIds] = useState([]);
    const [statusMessage, setStatusMessage] = useState(null);
    const [statusType, setStatusType] = useState(''); // 'success', 'warning', 'danger', 'info'

    const showMessage = (type, message) => {
        setStatusType(type);
        setStatusMessage(message);

        setTimeout(() => {
            setStatusMessage(null);
            setStatusType('');
        }, 5000);
    };

    const fetchTerms = async () => {
        try {
            setLoading(true);
            setStatusMessage(null);

            const agreedRes = await getTermsAgreements();
            const agreed = agreedRes.data.map((agreement) => ({
                ...agreement.template,
                date_agreed: agreement.date_agreed,
            }));

            const availableRes = await getAvailableTermsTemplates();
            const available = availableRes.data.map((template) => ({
                ...template,
                date_agreed: null,
            }));

            const combined = [...agreed, ...available].sort((a, b) =>
                a.category.localeCompare(b.category)
            );

            setTerms(combined);
        } catch (err) {
            console.error('Fetch error:', err);

            if (err.response?.status === 404) {
                const message = err.response?.data?.message || '';
                if (message.includes('No active lease')) {
                    showMessage(
                        'info',
                        'You do not have an active lease yet. Please wait for landlord approval.'
                    );
                } else {
                    showMessage('warning', message || 'Terms not available at the moment.');
                }
            } else {
                showMessage('danger', 'Failed to load terms. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAgree = async (templateId) => {
        const confirm = window.confirm(
            'Are you sure you want to agree to these terms?'
        );
        if (!confirm) return;

        if (submittingIds.includes(templateId)) return;

        setSubmittingIds((prev) => [...prev, templateId]);

        try {
            await agreeToTerms({ template_id: templateId });
            showMessage('success', '✅ You have successfully agreed to the terms.');
            fetchTerms();
        } catch (err) {
            if (err.response?.status === 409) {
                showMessage('info', 'ℹ️ You have already agreed to these terms.');
            } else {
                showMessage('danger', '❌ Failed to submit agreement. Please try again.');
                console.error(err);
            }
        } finally {
            setSubmittingIds((prev) => prev.filter((id) => id !== templateId));
        }
    };

    useEffect(() => {
        fetchTerms();
    }, []);

    return (
        <div className="container">
            <h3 className="mb-4">Terms & Agreements</h3>

            {statusMessage && (
                <div className={`alert alert-${statusType}`} role="alert">
                    {statusMessage}
                </div>
            )}

            {loading ? (
                <div className="d-flex align-items-center">
                    <span className="spinner-border spinner-border-sm me-2" />
                    <span>Loading terms...</span>
                </div>
            ) : terms.length === 0 ? (
                <div className="alert alert-info">
                    No terms available or required at the moment.
                </div>
            ) : (
                <div className="accordion" id="termsAccordion">
                    {terms.map((template) => {
                        const hasAgreed = template.date_agreed !== null;
                        const isSubmitting = submittingIds.includes(template.id);

                        return (
                            <div className="accordion-item" key={template.id}>
                                <h2 className="accordion-header" id={`heading-${template.id}`}>
                                    <button
                                        className="accordion-button collapsed"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#collapse-${template.id}`}
                                        aria-expanded="false"
                                        aria-controls={`collapse-${template.id}`}
                                    >
                                        {template.category}
                                    </button>
                                </h2>
                                <div
                                    id={`collapse-${template.id}`}
                                    className="accordion-collapse collapse"
                                    aria-labelledby={`heading-${template.id}`}
                                    data-bs-parent="#termsAccordion"
                                >
                                    <div className="accordion-body">
                                        <ul>
                                            {Array.isArray(template.content)
                                                ? template.content.map((clause, idx) => (
                                                    <li key={idx}>{clause}</li>
                                                ))
                                                : template.content && (
                                                    <li>{template.content}</li>
                                                )}
                                        </ul>

                                        <div className="mt-3">
                                            {hasAgreed ? (
                                                <span className="badge bg-success">
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    Agreed on{' '}
                                                    {new Date(
                                                        template.date_agreed
                                                    ).toLocaleString()}
                                                </span>
                                            ) : (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleAgree(template.id)}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-check2-square me-2"></i>
                                                            Agree to Terms
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
