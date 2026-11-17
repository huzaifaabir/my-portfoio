import { auth } from '../firebase.js';

// Empty in local dev (Vite proxy). Set VITE_API_URL to your deployed API in production.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// One request helper for the whole app.
// auth: true attaches the Firebase ID token. formData: send a multipart upload.
export async function request(path, { method = 'GET', body, formData, auth: needsAuth = false } = {}) {
  const headers = {};
  if (needsAuth) {
    const user = auth?.currentUser;
    if (!user) throw new ApiError('Please log in to continue.', 401);
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  let payload;
  if (formData) {
    payload = formData; // browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet connection and try again.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || `Something went wrong (error ${res.status}).`, res.status);
  }
  return data;
}

export const query = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) search.set(k, v);
  });
  const s = search.toString();
  return s ? `?${s}` : '';
};

// Turns stored image URLs into displayable URLs. Uploaded files are absolute Firebase URLs already.
export const imageSrc = (image) => image?.url || '';
