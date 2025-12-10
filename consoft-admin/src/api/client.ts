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
  search: (query: string) => {
    const q = (query || '').trim();
    const path = q.length > 0 ? `/api/users?search=${encodeURIComponent(q)}` : '/api/users';
    return apiFetch<{ users: Array<{ _id: string; name: string; email: string }> }>(API, path);
  },
  updateMe: async (payload: Partial<{ name: string; email: string; phone: string; address: string; avatarUrl: string }>) => {
    // Try common endpoints: /api/users/me → /api/auth/me → /api/users/:id
    try {
      return await apiFetch(API, '/api/users/me', { method: 'PATCH', body: JSON.stringify(payload) });
    } catch {
      // fallback 1
      try {
        return await apiFetch(API, '/api/auth/me', { method: 'PATCH', body: JSON.stringify(payload) });
      } catch {
        // fallback 2: resolve id, then PATCH /api/users/:id
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
  createForUser: (payload: { user: string; status?: string; address?: string; items: Array<{ id_servicio?: string; detalles?: string; valor: number }>; payments?: any[] }) =>
    apiFetch(API, '/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
});

export const VisitsApi = (API: string) => ({
  createForUser: (payload: { user: string; visitDate: string; address: string; status?: string; services?: string[] }) =>
    apiFetch(API, '/api/visits', { method: 'POST', body: JSON.stringify(payload) }),
});

export async function uploadImage(API: string, fileUri: string): Promise<{ url: string }> {
  const form = new FormData();
  const filename = fileUri.split('/').pop() || 'image.jpg';
  const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  // React Native FormData file
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append('file', { uri: fileUri, name: filename, type: mimeType } as any);
  const res = await fetch(`${API}/api/uploads`, {
    method: 'POST',
    body: form,
    // do NOT set Content-Type; RN will add the correct multipart boundary
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


