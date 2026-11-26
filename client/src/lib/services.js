
// Every API call the app makes, in one place.
import { request, query } from './api.js';

export const publicApi = {
  profile: () => request('/profile'),
  projects: (params) => request(`/projects${query(params)}`),
  project: (id) => request(`/projects/${id}`),
  brandPartners: () => request('/brand-partners'),
  sendMessage: (payload) => request('/messages', { method: 'POST', body: payload }),
};

export const staffApi = {
  me: () => request('/me', { auth: true }),
  updateMe: (name) => request('/me', { method: 'PUT', body: { name }, auth: true }),
  stats: () => request('/admin/stats', { auth: true }),

  updateSection: (section, data) => request(`/profile/${section}`, { method: 'PUT', body: data, auth: true }),

  manageProjects: () => request('/projects/manage', { auth: true }),
  createProject: (data) => request('/projects', { method: 'POST', body: data, auth: true }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: data, auth: true }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE', auth: true }),

  manageBrandPartners: () => request('/brand-partners/manage', { auth: true }),
  createBrandPartner: (data) => request('/brand-partners', { method: 'POST', body: data, auth: true }),
  updateBrandPartner: (id, data) => request(`/brand-partners/${id}`, { method: 'PUT', body: data, auth: true }),
  deleteBrandPartner: (id) => request(`/brand-partners/${id}`, { method: 'DELETE', auth: true }),
  reorderBrandPartners: (items) => request('/brand-partners/reorder', { method: 'PATCH', body: { items }, auth: true }),

  messages: (unreadOnly) => request(`/messages${unreadOnly ? '?filter=unread' : ''}`, { auth: true }),
  setMessageRead: (id, read) => request(`/messages/${id}`, { method: 'PATCH', body: { read }, auth: true }),
  deleteMessage: (id) => request(`/messages/${id}`, { method: 'DELETE', auth: true }),

  users: () => request('/users', { auth: true }),
  createUser: (data) => request('/users', { method: 'POST', body: data, auth: true }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE', auth: true }),

  uploadImage: (file, folder) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/uploads?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      formData,
      auth: true,
    });
  },

  uploadBrandImages: (files) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    return request('/uploads/batch', {
      method: 'POST',
      formData,
      auth: true,
    });
  },

  deleteUpload: (path) => request('/uploads', { method: 'DELETE', body: { path }, auth: true }),
};
