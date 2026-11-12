import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useCompanyContext } from './CompanyContext';

export function CompanyGate({
  children,
}: {
  children: (companyId: string) => ReactNode;
}) {
  const { company, isPending, error } = useCompanyContext();

  if (isPending) {
    return <p className="panel text-slate-300">Carregando empresas…</p>;
  }
  if (error) {
    return (
      <p role="alert" className="panel text-red-200">
        Não foi possível carregar as empresas: {error.message}
      </p>
    );
  }
  if (!company) {
    return (
      <div className="panel grid justify-items-start gap-3">
        <h1 className="text-lg font-semibold">No active companies</h1>
        <p className="text-slate-400">
          Manage your linked companies to reactivate one and continue working
          with its questions and code snippets.
        </p>
        <Link className="button-primary" to="/companies/manage">
          Manage Companies
        </Link>
      </div>
    );
  }
  return children(company.id);
}
