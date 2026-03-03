/**
 * Rate Limiter para evitar error 429 Too Many Requests
 * Implementa delay, debounce y retry con exponential backoff
 */

// Configuración global de rate limiting
export const RATE_LIMIT_CONFIG = {
  // Delay base entre peticiones (ms)
  BASE_DELAY: 1000, // 1 segundo
  
  // Delay específico por endpoint
  ENDPOINT_DELAYS: {
    '/api/orders/*/payments/ocr': 3000, // 3 segundos para OCR
    '/api/auth/refresh': 500, // 500ms para refresh
    '/api/visits/available-slots': 1000, // 1 segundo para slots
    default: 1000, // 1 segundo por defecto
  },
  
  // Configuración de retry
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // exponential backoff: 1s, 2s, 4s
  
  // Debounce time para acciones repetitivas (ms)
  DEBOUNCE_TIME: 500,
};

// Queue de peticiones para controlar el flujo
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;

  async add<T>(request: () => Promise<T>, endpoint?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.isProcessing) {
        this.processQueue(endpoint);
      }
    });
  }

  private async processQueue(endpoint?: string) {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) break;
      
      // Calcular delay necesario
      const delay = this.calculateDelay(endpoint);
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Esperar si es necesario
      if (timeSinceLastRequest < delay) {
        await this.sleep(delay - timeSinceLastRequest);
      }
      
      this.lastRequestTime = Date.now();
      
      try {
        await request();
      } catch (error) {
        // El error se maneja en la promise individual
        console.error('Request failed:', error);
      }
    }
    
    this.isProcessing = false;
  }

  private calculateDelay(endpoint?: string): number {
    if (!endpoint) return RATE_LIMIT_CONFIG.BASE_DELAY;
    
    // Buscar delay específico para el endpoint
    for (const [pattern, delay] of Object.entries(RATE_LIMIT_CONFIG.ENDPOINT_DELAYS)) {
      if (this.matchesEndpoint(endpoint, pattern)) {
        return delay;
      }
    }
    
    return RATE_LIMIT_CONFIG.ENDPOINT_DELAYS.default;
  }

  private matchesEndpoint(endpoint: string, pattern: string): boolean {
    // Soporta wildcards como /api/orders/*/payments/ocr
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(endpoint);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instancia global
const requestQueue = new RequestQueue();

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Retry con exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = RATE_LIMIT_CONFIG.MAX_RETRIES,
  delays: number[] = RATE_LIMIT_CONFIG.RETRY_DELAYS
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Si es 429, esperar más tiempo
      if (error.message?.includes('429') || error.status === 429) {
        if (i < maxRetries) {
          const delay = delays[i] || delays[delays.length - 1];
          console.warn(`Rate limit exceeded, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Si no es 429 o ya no hay reintentos, lanzar error
      if (i === maxRetries || !error.message?.includes('429')) {
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Wrapper para fetch con rate limiting y retry
export async function fetchWithRateLimit<T>(
  url: string,
  options: RequestInit = {},
  endpoint?: string
): Promise<T> {
  const operation = () => requestQueue.add(async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response.json() as Promise<T>;
  }, endpoint);
  
  return retryWithBackoff(operation);
}

// Cache simple para evitar peticiones repetidas
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutos

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// Wrapper para peticiones con cache
export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  useCache: boolean = true
): Promise<T> {
  if (!useCache) {
    return fetchWithRateLimit<T>(url, options);
  }
  
  const key = cacheKey || url;
  const cached = cache.get(key);
  
  if (cached) {
    console.log('Cache hit for:', key);
    return cached;
  }
  
  const data = await fetchWithRateLimit<T>(url, options);
  cache.set(key, data);
  return data;
}

// Configuración ya exportada arriba (línea 7)
