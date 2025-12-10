export async function apiFetch<T = unknown>(baseUrl: string, path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/api/${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  } as RequestInit);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && ((data as any).message || (data as any).error)) || 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export const AuthApi = (API: string) => ({
  login: (email: string, password: string) =>
    apiFetch(API, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => apiFetch(API, '/api/auth/me'),
  logout: () => apiFetch(API, '/api/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch(API, '/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  forgotPassword: (email: string) =>
    apiFetch(API, '/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    apiFetch(API, '/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
});

export const UsersApi = (API: string) => ({
  me: () => apiFetch(API, '/api/users/me'),
  register: (name: string, email: string, password: string) =>
    apiFetch(API, '/api/users', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  updateMe: async (payload: Partial<{ name: string; email: string; phone: string; address: string; avatarUrl: string }>) => {
    try {
      return await apiFetch(API, '/api/users/me', { method: 'PATCH', body: JSON.stringify(payload) });
    } catch {
      try {
        return await apiFetch(API, '/api/auth/me', { method: 'PATCH', body: JSON.stringify(payload) });
      } catch {
        const me: any = await apiFetch(API, '/api/auth/me');
        const userId = me?._id || me?.id;
        if (!userId) throw new Error('No se pudo identificar el usuario');
        return await apiFetch(API, `/api/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
    }
  },
  updateMeMultipart: async (payload: Partial<{ name: string; email: string; phone: string; address: string }> & { profilePictureUri?: string }) => {
    const form = new FormData();
    if (payload.name != null) form.append('name', String(payload.name));
    if (payload.email != null) form.append('email', String(payload.email));
    if (payload.phone != null) form.append('phone', String(payload.phone));
    if (payload.address != null) form.append('address', String(payload.address));
    const uri = payload.profilePictureUri;
    if (uri && !/^https?:\/\//i.test(uri)) {
      const filename = uri.split('/').pop() || 'profile.jpg';
      const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.append('profile_picture', { uri, name: filename, type: mimeType } as any);
    }
    const res = await fetch(`${API}/api/users/me`, {
      method: 'PUT',
      body: form,
      credentials: 'include' as any,
    } as RequestInit);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || 'Request failed';
      throw new Error(message);
    }
    return data;
  },
});

export const QuotationsApi = (API: string) => ({
  quick: (productId: string, opts: any = {}) =>
    apiFetch(API, '/api/quotations/quick', { method: 'POST', body: JSON.stringify({ productId, ...opts }) }),
  getCart: () => apiFetch(API, '/api/quotations/cart', { method: 'POST' }),
  addItem: (id: string, payload: any) =>
    apiFetch(API, `/api/quotations/${id}/items`, { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (id: string, itemId: string, payload: any) =>
    apiFetch(API, `/api/quotations/${id}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  removeItem: (id: string, itemId: string) =>
    apiFetch(API, `/api/quotations/${id}/items/${itemId}`, { method: 'DELETE' }),
  submit: (id: string) => apiFetch(API, `/api/quotations/${id}/submit`, { method: 'POST' }),
  mine: () => apiFetch(API, '/api/quotations/mine'),
  get: (id: string) => apiFetch(API, `/api/quotations/${id}`),
});

export const OrdersApi = (API: string) => ({
  mine: () => apiFetch(API, '/api/orders/mine'),
});

export const ProductsApi = (API: string) => ({
  list: (params?: Record<string, unknown>) => {
    const p = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        if (Array.isArray(v)) {
          v.forEach((vv) => p.append(k, String(vv)));
        } else {
          p.append(k, String(v));
        }
      });
    }
    const qs = p.toString();
    const path = qs ? `/api/products?${qs}` : '/api/products';
    return apiFetch(API, path);
  },
  get: (id: string) => apiFetch(API, `/api/products/${id}`),
});

export const ServicesApi = (API: string) => ({
  list: () => apiFetch(API, '/api/services'),
  get: (id: string) => apiFetch(API, `/api/services/${id}`),
});

export async function uploadImage(API: string, fileUri: string): Promise<{ url: string }> {
  const form = new FormData();
  const filename = fileUri.split('/').pop() || 'image.jpg';
  const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append('file', { uri: fileUri, name: filename, type: mimeType } as any);
  const res = await fetch(`${API}/api/uploads`, {
    method: 'POST',
    body: form,
    credentials: 'include' as any,
  } as RequestInit);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Upload failed';
    throw new Error(message);
  }
  const url: string | undefined = (data && (data.url || data.avatarUrl || data.location)) as string | undefined;
  if (!url) throw new Error('Upload did not return a URL');
  return { url };
}


