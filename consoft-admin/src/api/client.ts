import { fetchWithRateLimit, fetchWithCache, cache, debounce, RATE_LIMIT_CONFIG } from '../utils/rateLimiter';

async function apiFetchRaw<T = unknown>(baseUrl: string, path: string, init: RequestInit = {}, useCache: boolean = false): Promise<T> {
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/api/${path}`;
  
  // Determinar si usar cache (solo para GET requests)
  const shouldCache = useCache && (!init.method || init.method === 'GET');
  
  // Configuración con headers por defecto
  const config: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  } as RequestInit;
  
  try {
    if (shouldCache) {
      return await fetchWithCache<T>(url, config, path, true);
    } else {
      return await fetchWithRateLimit<T>(url, config, path);
    }
  } catch (error: any) {
    // Si es 429, limpiar cache y reintentar con más delay
    if (error.message?.includes('429') || error.status === 429) {
      cache.clear(); // Limpiar cache por si acaso
      console.warn('Rate limit detected, clearing cache and retrying...');
      // Reintentar con delay manual
      await new Promise(resolve => setTimeout(resolve, 3000));
      return await fetchWithRateLimit<T>(url, config, path);
    }
    throw error;
  }
}

export async function apiFetch<T = unknown>(baseUrl: string, path: string, init: RequestInit = {}, useCache: boolean = false): Promise<T> {
  try {
    return await apiFetchRaw<T>(baseUrl, path, init, useCache);
  } catch (error: any) {
    // Si es 401/403, intentar refresh y reintentar
    if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('Unauthorized')) {
      console.log('🔄 Refresh token triggered for:', path);
      try {
        // Refresh directo sin rate limiter para evitar bloqueos
        const refreshUrl = path.startsWith('/') ? `${baseUrl}/api/auth/refresh` : `${baseUrl}/auth/refresh`;
        console.log('🔄 Calling refresh endpoint:', refreshUrl);
        const response = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error('🔄 Refresh failed:', response.status);
          throw new Error('Refresh failed');
        }
        
        console.log('🔄 Refresh successful, retrying original request');
        // Reintentar la request original
        return await apiFetchRaw<T>(baseUrl, path, init, useCache);
      } catch (refreshError: any) {
        console.error('🔄 Refresh error:', refreshError.message);
        throw error;
      }
    }
    throw error;
  }
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
  search: async (query: string) => {
    const q = (query || '').trim();
    const paramsToTry = q.length > 0
      ? [
          `/api/users?search=${encodeURIComponent(q)}`,
          `/api/users?q=${encodeURIComponent(q)}`,
          `/api/users?name=${encodeURIComponent(q)}`,
          `/api/users?term=${encodeURIComponent(q)}`,
          `/api/users/search?query=${encodeURIComponent(q)}`,
        ]
      : ['/api/users'];
    let lastError: unknown = null;
    for (const path of paramsToTry) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await apiFetch(API, path);
        // If query is present but server returns empty list, fallback to full list
        if (q.length > 0) {
          const r: any = res as any;
          const arr =
            r?.users ??
            r?.results ??
            r?.items ??
            r?.data?.users ??
            r?.data?.results ??
            (Array.isArray(r) ? r : []);
          if (!arr || (Array.isArray(arr) && arr.length === 0)) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const all = await apiFetch(API, '/api/users');
              return all as any;
            } catch {
              // ignore and return original res
            }
          }
        }
        return res as any;
      } catch (e) {
        // try next, keep last error
        lastError = e;
      }
    }
    // If all attempts failed, surface the error so UI can display it
    if (lastError) throw lastError;
    // Otherwise, return empty compatible shape
    return { users: [] };
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
  quick: (items: any[], adminNotes?: string) =>
    apiFetch(API, '/api/quotations/quick', { method: 'POST', body: JSON.stringify({ items, adminNotes }) }),
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
  list: () => apiFetch(API, '/api/quotations'),
  decision: (id: string, decision: 'accepted' | 'rejected') =>
    apiFetch(API, `/api/quotations/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
  quote: (id: string, payload: { totalEstimate: number; adminNotes?: string; items?: any[] }) =>
    apiFetch(API, `/api/quotations/${id}/quote`, { method: 'POST', body: JSON.stringify(payload) }),
  addCustomItem: async (payload: { name: string; description: string; woodType?: string; quantity?: number; color?: string; size?: string; imageUri?: string; quotationId?: string }) => {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('description', payload.description);
    form.append('woodType', payload.woodType || 'Por definir');
    form.append('quantity', String(payload.quantity || 1));
    if (payload.color) form.append('color', payload.color);
    if (payload.size) form.append('size', payload.size);
    if (payload.quotationId) form.append('quotationId', payload.quotationId);
    if (payload.imageUri) {
      const filename = payload.imageUri.split('/').pop() || 'custom.jpg';
      const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      form.append('referenceImage', { uri: payload.imageUri, name: filename, type: mimeType } as any);
    }
    const res = await fetch(`${API}/api/quotations/cart/custom`, {
      method: 'POST',
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

export const OrdersApi = (API: string) => ({
  createForUser: (payload: { user: string; status?: string; address?: string; items: Array<{ tipo?: string; id_producto?: string; id_servicio?: string; detalles?: string; cantidad?: number; valor: number }>; payments?: any[] }) =>
    apiFetch(API, '/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  listAdmin: async () => {
    const candidates = [
      '/api/orders',
      '/api/orders?limit=100',
      '/api/orders/all',
      '/api/admin/orders',
      '/api/orders/list',
    ];
    let lastErr: unknown = null;
    for (const path of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await apiFetch(API, path);
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return { orders: [] } as any;
  },
  get: async (id: string) => {
    const candidates = [
      `/api/orders/${id}`,
      `/api/admin/orders/${id}`,
      `/api/orders/get/${id}`,
    ];
    let lastErr: unknown = null;
    for (const path of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await apiFetch(API, path);
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return null as any;
  },
  addAttachments: async (orderId: string, imageUris: string[], itemId?: string) => {
    const form = new FormData();
    if (itemId) form.append('item_id', itemId);
    imageUris.forEach((uri, idx) => {
      const filename = uri.split('/').pop() || `img_${idx}.jpg`;
      const type = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.append('product_images', { uri, name: filename, type } as any);
    });
    const res = await fetch(`${API}/api/orders/${orderId}/attachments`, {
      method: 'POST',
      body: form,
      credentials: 'include' as any,
    } as RequestInit);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || 'Upload failed';
      throw new Error(message);
    }
    return data;
  },
  updateStatus: async (orderId: string, status: string) => {
    const candidates: Array<{ path: string; method: 'PATCH' | 'POST' | 'PUT'; body: any; contentType?: string }> = [
      { path: `/api/orders/${orderId}`, method: 'PATCH', body: { status }, contentType: 'application/json' },
      { path: `/api/orders/${orderId}/status`, method: 'POST', body: { status }, contentType: 'application/json' },
      { path: `/api/admin/orders/${orderId}/status`, method: 'POST', body: { status }, contentType: 'application/json' },
      { path: `/api/orders/${orderId}`, method: 'PUT', body: { status }, contentType: 'application/json' },
    ];
    let lastErr: unknown = null;
    for (const c of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(`${API}${c.path}`, {
          method: c.method,
          body: JSON.stringify(c.body),
          credentials: 'include' as any,
          headers: { 'Content-Type': c.contentType || 'application/json' },
        } as RequestInit);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = (data && (data.message || data.error)) || 'Request failed';
          throw new Error(msg);
        }
        return data;
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return null;
  },
});

export const VisitsApi = (API: string) => ({
  getAvailableSlots: (date: string) =>
    apiFetch(API, `/api/visits/available-slots?date=${date}`),
  createForUser: (payload: { user: string; visitDate: string; visitTime: string; address: string; description?: string; status?: string; services?: string[] }) =>
    apiFetch(API, '/api/visits', { method: 'POST', body: JSON.stringify(payload) }),
  listAdmin: async () => {
    const candidates = [
      '/api/visits',
      '/api/visits?limit=100',
      '/api/visits/all',
      '/api/admin/visits',
      '/api/visits/list',
      '/api/visits/mine',
      '/api/appointments',
    ];
    let lastErr: unknown = null;
    for (const path of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await apiFetch(API, path);
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return { visits: [] } as any;
  },
  get: async (id: string) => {
    const candidates = [
      `/api/visits/${id}`,
      `/api/admin/visits/${id}`,
      `/api/appointments/${id}`,
    ];
    let lastErr: unknown = null;
    for (const path of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await apiFetch(API, path);
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return null as any;
  },
  update: async (id: string, payload: Partial<{ visitDate: string; address: string; status: string; services: string[] }>) => {
    const candidates = [
      { path: `/api/visits/${id}`, method: 'PATCH' as const },
      { path: `/api/visits/${id}`, method: 'PUT' as const },
      { path: `/api/appointments/${id}`, method: 'PATCH' as const },
    ];
    let lastErr: unknown = null;
    for (const c of candidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(`${API}${c.path}`, {
          method: c.method,
          credentials: 'include' as any,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        } as RequestInit);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = (data && (data.message || data.error)) || 'Request failed';
          throw new Error(msg);
        }
        return data;
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return null as any;
  },
  updateStatus: async (id: string, status: string) => {
    // Usa la ruta canónica del backend: PATCH /api/visits/:id con { status }
    const body = { status };
    const pathCandidates: Array<{ path: string; method: 'PATCH' | 'PUT' }> = [
      { path: `/api/visits/${id}`, method: 'PATCH' },
      { path: `/api/visits/${id}`, method: 'PUT' },
    ];
    let lastErr: unknown = null;
    for (const pc of pathCandidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(`${API}${pc.path}`, {
          method: pc.method,
          credentials: 'include' as any,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        } as RequestInit);
        const text = await res.text().catch(() => '');
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
        if (!res.ok) {
          const msg = (data && (data.message || data.error || text)) || `Request failed (${pc.path})`;
          throw new Error(msg);
        }
        return data;
      } catch (e) {
        lastErr = e;
      }
    }
    if (lastErr) throw lastErr;
    return null as any;
  },
});

export const DashboardApi = (API: string) => ({
  get: (params?: { period?: 'month' | 'quarter' | 'semester' | 'year'; compare?: boolean; limit?: number; from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (params?.period) p.append('period', params.period);
    if (params?.compare !== undefined) p.append('compare', String(params.compare));
    if (params?.limit) p.append('limit', String(params.limit));
    if (params?.from) p.append('from', params.from);
    if (params?.to) p.append('to', params.to);
    const qs = p.toString();
    return apiFetch(API, `/api/dashboard${qs ? `?${qs}` : ''}`, {}, true); // Cache para dashboard
  },
});

export const ChatApi = (API: string) => ({
  getDmMessages: (userId: string) => apiFetch(API, `/api/chat/dm/${userId}`),
});

export const SalesApi = (API: string) => ({
  list: () => apiFetch(API, '/api/sales', {}, true), // Cache para lista
  get: (id: string) => apiFetch(API, `/api/sales/${id}`, {}, true), // Cache para detalle
});

export const PermissionsApi = (API: string) => ({
  list: () => apiFetch(API, '/api/permissions', {}, true), // Cache para lista
  create: (payload: { module: string; action: string }) =>
    apiFetch(API, '/api/permissions', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: { module?: string; action?: string }) =>
    apiFetch(API, `/api/permissions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) => apiFetch(API, `/api/permissions/${id}`, { method: 'DELETE' }),
});

export const RolesApi = (API: string) => ({
  list: () => apiFetch(API, '/api/roles', {}, true), // Cache para lista
  get: (id: string) => apiFetch(API, `/api/roles/${id}`, {}, true), // Cache para detalle
  create: (payload: { name: string; description?: string; permissions: string[] }) =>
    apiFetch(API, '/api/roles', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: { name?: string; description?: string; permissions?: string[] }) =>
    apiFetch(API, `/api/roles/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) => apiFetch(API, `/api/roles/${id}`, { method: 'DELETE' }),
});

export const PaymentsApi = (API: string) => ({
  list: () => apiFetch(API, '/api/payments', {}, true), // Cache para lista
  get: (id: string) => apiFetch(API, `/api/payments/${id}`, {}, true), // Cache para detalle
  create: (payload: any) => apiFetch(API, '/api/payments', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => apiFetch(API, `/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) => apiFetch(API, `/api/payments/${id}`, { method: 'DELETE' }),
  previewOCR: async (orderId: string, imageUri: string) => {
    const form = new FormData();
    const filename = imageUri.split('/').pop() || 'receipt.jpg';
    const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    form.append('payment_image', { uri: imageUri, name: filename, type: mimeType } as any);
    
    // Usar rate limiter con endpoint específico para OCR
    const url = `${API}/api/orders/${orderId}/payments/ocr`;
    const config: RequestInit = {
      method: 'POST',
      body: form,
      credentials: 'include' as any,
    } as RequestInit;
    
    try {
      return await fetchWithRateLimit(url, config, `/api/orders/${orderId}/payments/ocr`);
    } catch (error: any) {
      // Manejo específico para 429 en OCR
      if (error.message?.includes('429') || error.status === 429) {
        throw new Error('Demasiadas solicitudes de OCR. Por favor espera unos segundos antes de intentar nuevamente.');
      }
      throw error;
    }
  },
  submitOCR: (orderId: string, payload: { amount: number; method?: string; receiptUrl: string; ocrText: string; paidAt?: string }) =>
    apiFetch(API, `/api/orders/${orderId}/payments/ocr/submit`, { method: 'POST', body: JSON.stringify(payload) }),
});

export async function uploadImage(API: string, fileUri: string): Promise<{ url: string }> {
  const form = new FormData();
  const filename = fileUri.split('/').pop() || 'image.jpg';
  const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
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


