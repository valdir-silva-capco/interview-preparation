import { apiRequest } from '../../lib/api';

export interface Company {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const companyKeys = {
  all: ['companies'] as const,
  manageable: ['companies', 'manageable'] as const,
};

export function getCompanies(): Promise<Company[]> {
  return apiRequest<Company[]>('/companies');
}

export function getManageableCompanies(): Promise<Company[]> {
  return apiRequest<Company[]>('/companies/manage');
}

export function createCompany(name: string): Promise<Company> {
  return apiRequest<Company>('/companies', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function updateCompany(
  id: string,
  input: { name?: string; isActive?: boolean },
): Promise<Company> {
  return apiRequest<Company>(`/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
