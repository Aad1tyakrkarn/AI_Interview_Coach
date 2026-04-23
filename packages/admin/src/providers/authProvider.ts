import { AuthProvider } from 'react-admin';
import { API_URL } from '../config/env';

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const { token, user } = await response.json();

    if (user.role !== 'admin') {
      throw new Error('Insufficient permissions. Admin role required.');
    }

    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_identity', JSON.stringify(user));
  },

  logout: async () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_identity');
  },

  checkAuth: async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      throw new Error('Not authenticated');
    }
  },

  checkError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_identity');
      throw new Error('Session expired');
    }
  },

  getIdentity: async () => {
    const identity = localStorage.getItem('admin_identity');
    if (!identity) {
      throw new Error('No identity found');
    }
    const user = JSON.parse(identity);
    return {
      id: user.id,
      fullName: user.fullName ?? user.email,
      avatar: user.avatar,
    };
  },

  getPermissions: async () => {
    const identity = localStorage.getItem('admin_identity');
    if (!identity) {
      return [];
    }
    const user = JSON.parse(identity);
    return user.role ? [user.role] : [];
  },
};
