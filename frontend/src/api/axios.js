import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    withCredentials: true,
});

API.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

// =====================
// AUTH
// =====================
export const register = (data) => API.post('/register', data);
export const login = (data) => API.post('/login', data);
export const logout = () => API.post('/logout');
export const getMe = () => API.get('/me');

// ⭐ Handle FormData if file is included
export const updateProfile = (data) => {
    // If profile_image is a File or if you're using FormData upload
    if (data.profile_image instanceof File) {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'payment_methods' && Array.isArray(value)) {
                value.forEach((method, index) => {
                    Object.entries(method).forEach(([methodKey, methodVal]) => {
                        formData.append(`payment_methods[${index}][${methodKey}]`, methodVal ?? '');
                    });
                });
            } else {
                formData.append(key, value ?? '');
            }
        });

        formData.append('_method', 'PUT');

        return API.post('/auth/update-profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    // fallback for no file uploads
    return API.put('/auth/update-profile', data);
};

// =====================
// PUBLIC
// =====================
export const getPlans = () => API.get('/plans');
export const generateMessengerLink = () => API.post('/messenger/generate-code');
export const getMyNotifications = () => API.get('/notifications');

// =====================
// TENANT
// =====================
export const getTenantLeases = () => API.get('/leases');
export const getTenantPayments = () => API.get('/payments');
export const submitTenantPayment = (data) => API.post('/payments', data);

export const getAvailableTermsTemplates = () => API.get('/terms/available');
export const getTermsAgreements = () => API.get('/terms/agreements');
export const agreeToTerms = (data) => API.post('/terms/agreements', data);

export const getTenantServiceRequests = () => API.get('/tenant/service-requests');
export const createServiceRequest = (data) => API.post('/tenant/service-requests', data);

// =====================
// LANDLORD
// =====================
export const registerTenant = (data) => API.post('/tenant/register', data);
export const getTenants = () => API.get('/tenants');
export const getTenant = (id) => API.get(`/tenants/${id}`);
export const updateTenant = (id, data) => API.put(`/tenants/${id}`, data);
export const deleteTenant = (id) => API.delete(`/tenants/${id}`);

// Subscriptions
export const getSubscriptionPaymentHistory = () => API.get('/subscription-payments/history');
export const getSubscriptions = () => API.get('/subscriptions');
export const createSubscription = (data) => API.post('/subscriptions', data);
export const deleteSubscription = (id) => API.delete(`/subscriptions/${id}`);

// Subscription Payments
export const getSubscriptionPayments = () => API.get('/subscription-payments');
export const makeSubscriptionPayment = (data) => API.post('/subscription-payments', data);

// Properties
export const getProperties = () => API.get('/properties');
export const getProperty = (id) => API.get(`/properties/${id}`);
export const createProperty = (data) => {
    if (data instanceof FormData) {
        return API.post('/properties', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return API.post('/properties', data);
};

export const updateProperty = (id, data) => {
    if (data instanceof FormData) {
        data.append('_method', 'PUT');
        return API.post(`/properties/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return API.put(`/properties/${id}`, data);
};

export const deleteProperty = (id) => API.delete(`/properties/${id}`);

// Units
export const getUnits = (propertyId) => API.get(`/properties/${propertyId}/units`);
export const createUnit = (propertyId, data) => API.post(`/properties/${propertyId}/units`, data);
export const getUnit = (propertyId, unitId) => API.get(`/properties/${propertyId}/units/${unitId}`);
export const updateUnit = (propertyId, unitId, data) => API.put(`/properties/${propertyId}/units/${unitId}`, data);
export const deleteUnit = (propertyId, unitId) => API.delete(`/properties/${propertyId}/units/${unitId}`);

// Leases
export const getAllLeases = () => API.get('/leases/all');
export const createLease = (data) => API.post('/leases', data);
export const updateLeaseStatus = (id, data) => API.patch(`/leases/${id}/status`, data);
export const deleteLease = (id) => API.delete(`/leases/${id}`);

// Service Requests
export const getServiceRequests = () => API.get('/service-requests');
export const updateServiceRequestStatus = (id, data) => API.patch(`/service-requests/${id}/status`, data);

// Payments
export const getAllPayments = () => API.get('/payments/all');
export const reviewPayment = (id, data) => API.patch(`/payments/${id}/review`, data);

// Terms Templates
export const getTermsTemplates = () => API.get('/terms/templates');
export const createTermsTemplate = (data) => API.post('/terms/templates', data);
export const updateTermsTemplate = (id, data) => API.patch(`/terms/templates/${id}`, data);
export const deleteTermsTemplate = (id) => API.delete(`/terms/templates/${id}`);

// =====================
// ADMIN
// =====================
export const getAllLandlords = () => API.get('/admin/landlords');
export const getLandlordDetails = (id) => API.get(`/admin/landlords/${id}`);

export const getAllPlansAdmin = () => API.get('/admin/plans');
export const createPlan = (data) => API.post('/admin/plans', data);
export const getPlan = (id) => API.get(`/admin/plans/${id}`);
export const updatePlan = (id, data) => API.put(`/admin/plans/${id}`, data);
export const deletePlan = (id) => API.delete(`/admin/plans/${id}`);

export const getAllSubscriptions = () => API.get('/admin/subscriptions');
export const getAllSubscriptionPayments = () => API.get('/admin/subscription-payments');
export const activateSubscription = (id) => API.post(`/subscriptions/${id}/activate`);
export const approveSubscriptionPayment = (id) => API.post(`/subscription-payments/${id}/approve`);
export function rejectSubscriptionPayment(id, reason) {
    return API.post(`/subscription-payments/${id}/reject`, {
        rejection_reason: (reason ?? '').trim()
    });
}




// Financial Records (Admin + Landlord)
export const getFinancialRecords = () => API.get('/financial-records');
export const createFinancialRecord = (data) => API.post('/financial-records', data);
export const getFinancialRecord = (id) => API.get(`/financial-records/${id}`);
export const updateFinancialRecord = (id, data) => API.put(`/financial-records/${id}`, data);
export const deleteFinancialRecord = (id) => API.delete(`/financial-records/${id}`);
export const getFinancialSummary = () => API.get('/financial-records/summary');

export default API;
