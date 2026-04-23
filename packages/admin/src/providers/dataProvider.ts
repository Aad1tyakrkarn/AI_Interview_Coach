import simpleRestProvider from 'ra-data-simple-rest';
import { DataProvider } from 'react-admin';
import { API_URL } from '../config/env';

const ADMIN_API = `${API_URL}/admin`;

const baseProvider = simpleRestProvider(ADMIN_API);

export const dataProvider: DataProvider = {
  ...baseProvider,

  getList: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 };
    const { field, order } = params.sort || { field: 'createdAt', order: 'DESC' };
    const query = new URLSearchParams({
      page: String(page),
      limit: String(perPage),
      sortBy: field,
      sortOrder: order,
      ...Object.fromEntries(
        Object.entries(params.filter || {}).filter(
          ([_, v]) => v !== '' && v !== undefined && v !== null,
        ),
      ),
    });

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${ADMIN_API}/${resource}?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return {
      data: (json.data || []).map((item: any) => ({ ...item, id: item.id })),
      total: json.total || 0,
    };
  },

  getOne: async (resource: string, params: any) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${ADMIN_API}/${resource}/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return { data: { ...json, id: json.id } };
  },

  getMany: async (resource: string, params: any) => {
    const token = localStorage.getItem('admin_token');
    const results = await Promise.all(
      params.ids.map(async (id: string | number) => {
        const response = await fetch(`${ADMIN_API}/${resource}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return null;
        const json = await response.json();
        return { ...json, id: json.id };
      }),
    );
    return { data: results.filter(Boolean) };
  },

  getManyReference: async (resource: string, params: any) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 };
    const { field, order } = params.sort || { field: 'createdAt', order: 'DESC' };
    const query = new URLSearchParams({
      page: String(page),
      limit: String(perPage),
      sortBy: field,
      sortOrder: order,
      [params.target]: String(params.id),
      ...Object.fromEntries(
        Object.entries(params.filter || {}).filter(
          ([_, v]) => v !== '' && v !== undefined && v !== null,
        ),
      ),
    });

    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${ADMIN_API}/${resource}?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return {
      data: (json.data || []).map((item: any) => ({ ...item, id: item.id })),
      total: json.total || 0,
    };
  },

  update: async (resource: string, params: any) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${ADMIN_API}/${resource}/${params.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return { data: { ...json, id: json.id } };
  },

  updateMany: async (resource: string, params: any) => {
    const token = localStorage.getItem('admin_token');
    await Promise.all(
      params.ids.map((id: string | number) =>
        fetch(`${ADMIN_API}/${resource}/${id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params.data),
        }),
      ),
    );
    return { data: params.ids };
  },

  create: async (resource: string, params: any) => {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${ADMIN_API}/${resource}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return { data: { ...json, id: json.id } };
  },

  delete: async (resource: string, params: any) => {
    const token = localStorage.getItem('admin_token');
    await fetch(`${ADMIN_API}/${resource}/${params.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return { data: { id: params.id } as any };
  },

  deleteMany: async (resource: string, params: any) => {
    const token = localStorage.getItem('admin_token');
    await Promise.all(
      params.ids.map((id: string | number) =>
        fetch(`${ADMIN_API}/${resource}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
    );
    return { data: params.ids };
  },
};
