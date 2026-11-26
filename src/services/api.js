const API_BASE = '/api';

/**
 * Get authorization headers with token if available
 */
function getHeaders(additionalHeaders = {}) {
  const token = localStorage.getItem('as_dairy_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...additionalHeaders
  };
}

async function handleResponse(res, { redirectOnUnauthorized = true } = {}) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    // Only authenticated API calls should invalidate the current session.
    if (res.status === 401 && redirectOnUnauthorized) {
      localStorage.removeItem('as_dairy_token');
      localStorage.removeItem('as_dairy_user');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res, { redirectOnUnauthorized: false });
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res, { redirectOnUnauthorized: false });
  },

  // Products
  getProducts: async (category) => {
    const url = category && category !== 'all'
      ? `${API_BASE}/products?category=${encodeURIComponent(category)}`
      : `${API_BASE}/products`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  getProductById: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createProduct: async (productData) => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse(res);
  },

  updateProduct: async (id, productData) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData)
    });
    return handleResponse(res);
  },

  deleteProduct: async (id) => {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Milking Batches
  getBatches: async () => {
    const res = await fetch(`${API_BASE}/batches`, { headers: getHeaders() });
    return handleResponse(res);
  },

  recordBatch: async (batchData) => {
    const res = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(batchData)
    });
    return handleResponse(res);
  },

  // Orders
  getOrders: async (customerId) => {
    const url = customerId
      ? `${API_BASE}/orders?customer_id=${customerId}`
      : `${API_BASE}/orders`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  createOrder: async (orderData) => {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(orderData)
    });
    return handleResponse(res);
  },

  updateOrderStatus: async (orderId, status) => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ order_status: status })
    });
    return handleResponse(res);
  },

  getRiders: async () => {
    const res = await fetch(`${API_BASE}/users/riders`, { headers: getHeaders() });
    return handleResponse(res);
  },

  assignOrderRider: async (orderId, riderId) => {
    const res = await fetch(`${API_BASE}/orders/${orderId}/rider`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ rider_id: riderId })
    });
    return handleResponse(res);
  },

  getFarmSummary: async () => {
    const res = await fetch(`${API_BASE}/farm/summary`, { headers: getHeaders() });
    return handleResponse(res);
  },

  getFarmResource: async (resource) => {
    const res = await fetch(`${API_BASE}/farm/${resource}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  createFarmResource: async (resource, data) => {
    const res = await fetch(`${API_BASE}/farm/${resource}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateFarmLivestock: async (id, data) => {
    const res = await fetch(`${API_BASE}/farm/livestock/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteFarmLivestock: async (id) => {
    const res = await fetch(`${API_BASE}/farm/livestock/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Stats
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/stats/dashboard`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // User Profile
  updateProfile: async (userData) => {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch(`${API_BASE}/users/password`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    return handleResponse(res);
  }
};
