import type {
  AdminInfo,
  AiVirtualAssistantRegistration,
  AllOverview,
  ApiResponse,
  RegistrationList,
  RegistrationActionRequest,
  RegistrationQuery,
} from './types';

// Base path is relative so the same build works whether served by the backend
// directly or through the Vite dev-server proxy.
const BASE = '';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message = `Request failed with status ${status}`,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

let antiforgeryTokenPromise: Promise<string> | null = null;

async function getAntiforgeryToken(): Promise<string> {
  antiforgeryTokenPromise ??= fetch(`${BASE}/auth/antiforgery`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  }).then(async (response) => {
    if (!response.ok) throw new HttpError(response.status);
    const body = (await response.json()) as { token: string };
    return body.token;
  }).catch((error: unknown) => {
    antiforgeryTokenPromise = null;
    throw error;
  });

  return antiforgeryTokenPromise;
}

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const method = init?.method?.toUpperCase() ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    headers.set('X-CSRF-TOKEN', await getAntiforgeryToken());
  }

  return fetch(input, { ...init, credentials: 'same-origin', headers });
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new HttpError(res.status);
  }
  const body = (await res.json()) as ApiResponse<T>;
  if (body.hasError) {
    const message = body.responseMessages?.[0]?.value ?? 'The request returned an error.';
    throw new Error(message);
  }
  return body.model as T;
}

export async function getAdminInfo(): Promise<AdminInfo> {
  const res = await apiFetch(`${BASE}/auth/me`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return unwrap<AdminInfo>(res);
}

export async function getAllOverview(
  startDate?: string | null,
  endDate?: string | null,
): Promise<AllOverview> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const queryString = params.size > 0 ? `?${params.toString()}` : '';

  const res = await apiFetch(`${BASE}/Admin/GetAllOverview${queryString}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  return unwrap<AllOverview>(res);
}

export async function getRegistrations(
  query: RegistrationQuery,
): Promise<RegistrationList> {
  const params = new URLSearchParams();
  params.set('pageIndex', String(query.pageIndex ?? 0));
  params.set('pageSize', String(query.pageSize ?? 50));
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.searchTerm) params.set('searchTerm', query.searchTerm);
  if (query.validationStatus) params.set('validationStatus', query.validationStatus);
  if (query.verification) params.set('verification', query.verification);

  const res = await apiFetch(
    `${BASE}/Admin/GetAiVirtualAssistantRegistrations?${params.toString()}`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
    },
  );
  return unwrap<RegistrationList>(res);
}

export async function applyRegistrationAction(
  request: RegistrationActionRequest,
): Promise<AiVirtualAssistantRegistration> {
  const res = await apiFetch(`${BASE}/Admin/ApplyRegistrationAction`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  return unwrap<AiVirtualAssistantRegistration>(res);
}
