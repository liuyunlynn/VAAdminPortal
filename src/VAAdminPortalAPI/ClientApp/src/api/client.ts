import type {
  AdminInfo,
  AiVirtualAssistantRegistration,
  ApiResponse,
  RegistrationQuery,
} from './types';

// Base path is relative so the same build works whether served by the backend
// directly or through the Vite dev-server proxy.
const BASE = '';

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  const body = (await res.json()) as ApiResponse<T>;
  if (body.hasError) {
    const message = body.responseMessages?.[0]?.value ?? 'The request returned an error.';
    throw new Error(message);
  }
  return body.model as T;
}

export async function getAdminInfo(id: string): Promise<AdminInfo> {
  const res = await fetch(`${BASE}/Admin/GetAdminInformation?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return unwrap<AdminInfo>(res);
}

export async function getRegistrations(
  query: RegistrationQuery,
): Promise<AiVirtualAssistantRegistration[]> {
  const params = new URLSearchParams();
  params.set('pageIndex', String(query.pageIndex ?? 0));
  params.set('pageSize', String(query.pageSize ?? 100));
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.searchTerm) params.set('searchTerm', query.searchTerm);
  if (query.validationStatus) params.set('validationStatus', query.validationStatus);
  if (query.legalStatus) params.set('legalStatus', query.legalStatus);

  const res = await fetch(
    `${BASE}/Admin/GetAiVirtualAssistantRegistrations?${params.toString()}`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
    },
  );
  return unwrap<AiVirtualAssistantRegistration[]>(res);
}
