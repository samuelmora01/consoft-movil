import { fetchWithRateLimit, fetchWithCache, cache, debounce, RATE_LIMIT_CONFIG } from '../utils/rateLimiter';

// Función para manejar logout cuando el refresh falla
async function handleAuthFailure(baseUrl: string): Promise<void> {
  try {
    // Limpiar cookies
    await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch (error) {
    console.error('Error during logout:', error);
  }
  
  // Limpiar cache
  cache.clear();
  
  // Resetear estado de refresh
  isRefreshing = false;
  refreshQueue = [];
  
  // Actualizar estado de sesión (importado dinámicamente para evitar circular dependency)
  try {
    const { useSessionStore } = await import('../store/sessionStore');
    useSessionStore.getState().setSignedIn(false);
  } catch (error) {
    console.error('Error updating session store:', error);
  }
}

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
    // TEMPORAL: Desactivar rate limiter y cache para aislar el problema
    console.log('🚀 Direct fetch to:', url);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Direct fetch success:', url);
    return data;
    
  } catch (error: any) {
    console.error('❌ Direct fetch error:', url, error);
    throw error;
  }
}

// Flag para evitar loops de refresh
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (value: any) => void; reject: (reason: any) => void }> = [];

export async function apiFetch<T = unknown>(baseUrl: string, path: string, init: RequestInit = {}, useCache: boolean = false): Promise<T> {
  try {
    return await apiFetchRaw<T>(baseUrl, path, init, useCache);
  } catch (error: any) {
    // Detectar errores de autenticación
    const isAuthError = 
      error.message?.includes('401') || 
      error.message?.includes('403') || 
      error.message?.includes('Unauthorized') ||
      error.status === 401 || 
      error.status === 403 ||
      (error.response && (error.response.status === 401 || error.response.status === 403));
    
    if (isAuthError && !isRefreshing) {
      console.log('🔄 Refresh token triggered for:', path);
      
      // Si ya estamos refrescando, agregar a la cola
      if (isRefreshing) {
        console.log('🔄 Adding to refresh queue:', path);
        return new Promise<T>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        });
      }

      isRefreshing = true;
      
      try {
        // Refresh directo sin rate limiter para evitar bloqueos
        const refreshUrl = `${baseUrl}/api/auth/refresh`;
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
          
          // Si el refresh falla, limpiar estado y manejar logout
          await handleAuthFailure(baseUrl);
          
          throw new Error('Session expired - Please login again');
        }
        
        console.log('🔄 Refresh successful, clearing cache and retrying');
        
        // Limpiar cache después de refresh exitoso
        cache.clear();
        
        // Reintentar la request original
        const result = await apiFetchRaw<T>(baseUrl, path, init, useCache);
        
        // Resolver todas las peticiones en cola
        refreshQueue.forEach(({ resolve }) => resolve(result));
        refreshQueue = [];
        
        return result;
        
      } catch (refreshError: any) {
        console.error('🔄 Refresh error:', refreshError.message);
        
        // Limpiar estado en caso de error
        await handleAuthFailure(baseUrl);
        
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }
    
    throw error;
  }
}

// Función para forzar logout (usable desde cualquier parte de la app)
export async function forceLogout(API?: string): Promise<void> {
  const baseUrl = API || '';
  
  try {
    // Limpiar cookies
    if (baseUrl) {
      await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    }
  } catch (error) {
    console.error('Error during forced logout:', error);
  }
  
  // Limpiar cache
  cache.clear();
  
  // Resetear estado de refresh
  isRefreshing = false;
  refreshQueue = [];
  
  // Actualizar estado de sesión
  try {
    const { useSessionStore } = await import('../store/sessionStore');
    useSessionStore.getState().setSignedIn(false);
  } catch (error) {
    console.error('Error updating session store:', error);
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
  me: async () => {
    try {
      return await apiFetch(API, '/api/users/me');
    } catch {
      return await apiFetch(API, '/users/me');
    }
  },
  register: (name: string, email: string, password: string) =>
    apiFetch(API, '/api/users', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  updateMe: async (payload: Partial<{ name: string; email: string; phone: string; address: string; avatarUrl: string }>) => {
    const attempts: Array<() => Promise<unknown>> = [
      () => apiFetch(API, '/api/users/me', { method: 'PUT', body: JSON.stringify(payload) }),
      () => apiFetch(API, '/api/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),
      () => apiFetch(API, '/users/me', { method: 'PUT', body: JSON.stringify(payload) }),
      () => apiFetch(API, '/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),
      () => apiFetch(API, '/api/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
      () => apiFetch(API, '/api/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
    ];

    let lastErr: unknown;
    for (const run of attempts) {
      try {
        return await run();
      } catch (e) {
        lastErr = e;
      }
    }

    // Último fallback: actualizar por id
    try {
      const me: any = await apiFetch(API, '/api/auth/me');
      const userId = me?._id || me?.id;
      if (!userId) throw new Error('No se pudo identificar el usuario');
      return await apiFetch(API, `/api/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    } catch {
      const me: any = await apiFetch(API, '/api/auth/me');
      const userId = me?._id || me?.id;
      if (!userId) throw new Error('No se pudo identificar el usuario');
      return await apiFetch(API, `/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) });
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
    const tryUpload = async (path: string) => {
      const res = await fetch(`${API}${path}`, {
        method: 'PUT',
        body: form,
        credentials: 'include' as any,
      } as RequestInit);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (data && (data.message || data.error)) || `Request failed (${res.status})`;
        throw new Error(message);
      }
      return data;
    };
    try {
      return await tryUpload('/api/users/me');
    } catch {
      return await tryUpload('/users/me');
    }
  },
});

export const QuotationsApi = (API: string) => ({
  // POST sin body = get-or-create carrito activo (nunca falla con 404)
  getCart: () => apiFetch(API, '/api/quotations/cart', { method: 'POST' }),
  // Agregar item al carrito activo.
  // En la app web: primero getCart (POST /cart) y luego addItem (POST /:id/items)
  addItemToCart: async (payload: { productId: string; quantity: number; color: string; size?: string }) => {
    const cartRes: any = await apiFetch(API, '/api/quotations/cart', { method: 'POST' });
    const cartId: string = cartRes?.cart?._id || cartRes?.cart?.id || cartRes?._id || cartRes?.id || '';
    if (!cartId) throw new Error('No se pudo obtener el ID del carrito');
    return apiFetch(API, `/api/quotations/${cartId}/items`, { method: 'POST', body: JSON.stringify(payload) });
  },
  // Agregar producto a una cotización por id: POST /api/quotations/:id/items
  addItem: (id: string, payload: { productId: string; quantity: number; color?: string; size?: string }) =>
    apiFetch(API, `/api/quotations/${id}/items`, { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (id: string, itemId: string, payload: { quantity?: number; color?: string; size?: string; price?: number }) =>
    apiFetch(API, `/api/quotations/${id}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  removeItem: (id: string, itemId: string) =>
    apiFetch(API, `/api/quotations/${id}/items/${itemId}`, { method: 'DELETE' }),
  // Solicitar cotización: cambia status Carrito → Solicitada
  submit: (id: string) => apiFetch(API, `/api/quotations/${id}/submit`, { method: 'POST' }),
  mine: () => apiFetch(API, '/api/quotations/mine'),
  get: (id: string) => apiFetch(API, `/api/quotations/${id}`),
  decision: (id: string, decision: 'accepted' | 'rejected') =>
    apiFetch(API, `/api/quotations/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
  // Creación rápida (solo admin)
  quick: (items: any[], adminNotes?: string) =>
    apiFetch(API, '/api/quotations/quick', { method: 'POST', body: JSON.stringify({ items, adminNotes }) }),
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
  mine: () => apiFetch(API, '/api/orders/mine', {}, true), // Cache para lista
  get: (id: string) => apiFetch(API, `/api/orders/${id}`, {}, true), // Cache para detalle
  previewPaymentOCR: async (orderId: string, imageUri: string) => {
    const form = new FormData();
    const filename = imageUri.split('/').pop() || 'receipt.jpg';
    const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    form.append('payment_image', { uri: imageUri, name: filename, type: mimeType } as any);
    
    // Intentar endpoints según documentación primero, luego fallback
    const attempts = [
      `/orders/${orderId}/payments/ocr`,        // Documentación oficial
      `/api/quotations/${orderId}/payments/ocr` // Backend real
    ];
    
    for (const endpoint of attempts) {
      try {
        const url = `${API}${endpoint}`;
        const config: RequestInit = {
          method: 'POST',
          body: form,
          credentials: 'include' as any,
        } as RequestInit;
        
        return await fetchWithRateLimit(url, config, endpoint);
      } catch (error: any) {
        // Manejo específico para 429 en OCR
        if (error.message?.includes('429') || error.status === 429) {
          throw new Error('Demasiadas solicitudes de OCR. Por favor espera unos segundos antes de intentar nuevamente.');
        }
        // Si es el último intento, lanzar el error
        if (endpoint === attempts[attempts.length - 1]) {
          throw error;
        }
        // Si no, continuar con el siguiente intento
        continue;
      }
    }
  },
  submitPaymentOCR: async (orderId: string, payload: { amount: number; method?: string; receiptUrl: string; ocrText: string; paidAt?: string }) => {
    // Intentar endpoints según documentación primero, luego fallback
    const attempts = [
      () => apiFetch(API, `/orders/${orderId}/payments/ocr/submit`, { method: 'POST', body: JSON.stringify(payload) }),        // Documentación oficial
      () => apiFetch(API, `/api/quotations/${orderId}/payments/ocr/submit`, { method: 'POST', body: JSON.stringify(payload) }) // Backend real
    ];
    
    let lastErr: unknown;
    for (const run of attempts) {
      try {
        return await run();
      } catch (e) {
        lastErr = e;
      }
    }
    
    throw lastErr;
  },
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
    return apiFetch(API, path, {}, true); // Cache para lista de productos
  },
  get: (id: string) => apiFetch(API, `/api/products/${id}`, {}, true), // Cache para detalle
});

export const ServicesApi = (API: string) => ({
  list: () => apiFetch(API, '/api/services', {}, true), // Cache para lista
  get: (id: string) => apiFetch(API, `/api/services/${id}`, {}, true), // Cache para detalle
});

export const VisitsApi = (API: string) => ({
  getAvailableSlots: (date: string) => apiFetch(API, `/api/visits/available-slots?date=${date}`, {}, true), // Cache para slots
  mine: () => apiFetch(API, '/api/visits/mine'),
  create: (payload: { visitDate: string; visitTime: string; address: string; description?: string; userName?: string; userEmail?: string; userPhone?: string }) =>
    apiFetch(API, '/api/visits/mine', { method: 'POST', body: JSON.stringify(payload) }),
});

export const ChatApi = (API: string) => ({
  // Mensajes directos (DM) entre usuarios
  getDmMessages: (userId: string) => apiFetch(API, `/api/chat/dm/${userId}`),
  // Mensajes de una cotización específica
  getQuotationMessages: (quotationId: string) => apiFetch(API, `/api/quotations/${quotationId}/messages`),
});

export const ReviewsApi = (API: string) => ({
  list: (orderId: string) => apiFetch(API, `/api/orders/${orderId}/reviews`, {}, true), // Cache para lista de reseñas de un pedido
  listAll: () => apiFetch(API, '/api/orders/reviews', {}, true), // Cache para todas las reseñas
  create: (orderId: string, payload: { rating: number; comment?: string }) =>
    apiFetch(API, `/api/orders/${orderId}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),
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


