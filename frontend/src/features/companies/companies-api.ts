import { apiRequest } from '../../lib/api';

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const companyKeys = {
  all: ['companies'] as const,
};

export function getCompanies(): Promise<Company[]> {
  return apiRequest<Company[]>('/companies');
}

export function createCompany(name: string): Promise<Company> {
  return apiRequest<Company>('/companies', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
