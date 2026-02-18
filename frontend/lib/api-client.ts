const API_BASE_URL = '/api';

export interface ApiError {
  error: string;
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[API Client Error]', error);
    throw error;
  }
}

export async function getCustomers() {
  return apiCall('/customers');
}

export async function getProjects() {
  return apiCall('/projects');
}

export async function createCustomer(data: any) {
  return apiCall('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createProject(data: any) {
  return apiCall('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
