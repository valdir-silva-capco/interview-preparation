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
        <h1 className="text-lg font-semibold">Cadastre uma empresa</h1>
        <p className="text-slate-400">
          Cadastre ou selecione uma empresa para organizar suas perguntas e
          códigos.
        </p>
        <Link className="button-primary" to="/companies/new">
          Cadastrar empresa
        </Link>
      </div>
    );
  }
  return children(company.id);
}
