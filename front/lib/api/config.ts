/**
 * Configuración de la API
 * Centraliza la URL base del backend y configuraciones globales
 */

// URL base del backend - usar variable de entorno en producción
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Timeout por defecto para requests (ms)
export const API_TIMEOUT = 30000

// Headers por defecto
export const getDefaultHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// Tipos de errores de API
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Función base para hacer requests
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...getDefaultHeaders(),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new APIError(
        errorData?.message || `Error ${response.status}`,
        response.status,
        errorData
      )
    }

    // Si la respuesta está vacía, retornar null
    const text = await response.text()
    if (!text) return null as T
    
    return JSON.parse(text) as T
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Error de conexión',
      0
    )
  }
}

// Métodos HTTP helpers
export const api = {
  get: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }),
    
  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  put: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  patch: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
}
