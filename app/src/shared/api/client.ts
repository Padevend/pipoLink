import * as SecureStore from 'expo-secure-store';
import { ApiResponse, ErrorResponse, PaginatedResponse } from './types';

function envUrl(key: 'EXPO_PUBLIC_API_URL' | 'EXPO_PUBLIC_WS_URL', fallback: string): string {
  const raw = process.env[key];
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value || fallback;
}

const API_BASE_URL = envUrl('EXPO_PUBLIC_API_URL', 'http://10.0.2.2:3000');

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function getAuthToken() {
  try {
    return await SecureStore.getItemAsync('auth_token');
  } catch (e) {
    return null;
  }
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;
  
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = await getAuthToken();
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = data as ErrorResponse;
    throw new ApiError(
      response.status,
      errorData.error || 'UNKNOWN_ERROR',
      errorData.message || 'An unexpected error occurred',
      errorData.details
    );
  }

  const apiResponse = data as ApiResponse<T>;
  return apiResponse.data !== undefined ? apiResponse.data : (data as unknown as T);
}

interface PaginatedApiBody<T> {
  success?: boolean;
  data?: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export async function requestPaginated<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<PaginatedResponse<T>> {
  const { params, headers, ...rest } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
    const queryString = query.toString();
    if (queryString) url += `?${queryString}`;
  }

  const token = await getAuthToken();
  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = (await response.json()) as PaginatedApiBody<T> & ErrorResponse;
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body.error || 'UNKNOWN_ERROR',
      body.message || 'An unexpected error occurred',
      body.details,
    );
  }

  const page = body.meta?.page ?? 1;
  const limit = body.meta?.limit ?? 30;
  const total = body.meta?.total ?? body.data?.length ?? 0;
  const totalPages = body.meta?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  return {
    items: body.data ?? [],
    total,
    page,
    limit,
    totalPages,
    hasNextPage: body.meta?.hasNext ?? page < totalPages,
    hasPreviousPage: body.meta?.hasPrev ?? page > 1,
  };
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
  put: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    
  delete: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: async <T>(endpoint: string, formData: FormData, options?: RequestOptions) => {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options?.headers as any),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new ApiError(
        response.status,
        errorData.error || 'UPLOAD_ERROR',
        errorData.message || 'Failed to upload file',
        errorData.details
      );
    }

    const apiResponse = data as ApiResponse<T>;
    return apiResponse.data !== undefined ? apiResponse.data : (data as unknown as T);
  }
};
