const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('sc_token');
  const headers = { ...options.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    if (!endpoint.includes('/auth/')) {
      window.location.href = '/auth';
    }
  }

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      data = { error: 'Failed to parse JSON response' };
    }
  } else {
    try {
      const text = await res.text();
      data = { error: text || 'Request failed' };
    } catch (e) {
      data = { error: 'Request failed' };
    }
  }
  
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('File is too large! Vercel limits direct uploads to 4.5 MB. Please upload your file to Google Drive and paste the link instead.');
    }
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  get: (url) => apiFetch(url),
  post: (url, body) => apiFetch(url, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: (url, body) => apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, body) => apiFetch(url, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};

export default api;
