import { createContext, useContext, type ReactNode } from 'react';
import type { Company } from './companies-api';

interface CompanyContextValue {
  company: Company | null;
  isPending: boolean;
  error: Error | null;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({
  value,
  children,
}: {
  value: CompanyContextValue;
  children: ReactNode;
}) {
  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompanyContext(): CompanyContextValue {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyContext must be used inside CompanyProvider.');
  }
  return context;
}
