import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { CompanyProvider } from '../features/companies/CompanyContext';
import { companyKeys, getCompanies } from '../features/companies/companies-api';
import { useCompanyStore } from '../features/companies/company-store';

export function RootLayout() {
  const isQuestionsPage = useRouterState({
    select: (state) => state.location.pathname === '/',
  });
  const companiesQuery = useQuery({
    queryKey: companyKeys.all,
    queryFn: getCompanies,
  });
  const selectedCompanyId = useCompanyStore((state) => state.selectedCompanyId);
  const selectCompany = useCompanyStore((state) => state.selectCompany);
  const company =
    companiesQuery.data?.find(({ id }) => id === selectedCompanyId) ??
    companiesQuery.data?.[0] ??
    null;

  useEffect(() => {
    if (company && selectedCompanyId !== company.id) {
      selectCompany(company.id);
    }
  }, [company, selectedCompanyId, selectCompany]);

  return (
    <CompanyProvider
      value={{
        company,
        isPending: companiesQuery.isPending,
        error: companiesQuery.error,
      }}
    >
      <div className="flex h-dvh flex-col overflow-hidden">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
            <Link className="font-semibold tracking-tight text-white" to="/">
              Interview Preparation
            </Link>
            <nav
              aria-label="Navegação principal"
              className="flex flex-wrap items-center gap-2"
            >
              {companiesQuery.data && companiesQuery.data.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  Empresa
                  <select
                    className="field w-auto py-2"
                    aria-label="Empresa selecionada"
                    value={company?.id ?? ''}
                    onChange={(event) => selectCompany(event.target.value)}
                  >
                    {companiesQuery.data.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Link
                className="nav-link"
                activeProps={{ className: 'nav-link nav-link-active' }}
                to="/companies/new"
              >
                Nova empresa
              </Link>
              <Link
                className="nav-link"
                activeProps={{ className: 'nav-link nav-link-active' }}
                to="/"
              >
                Perguntas
              </Link>
              <Link
                className="nav-link"
                activeProps={{ className: 'nav-link nav-link-active' }}
                to="/code"
              >
                Editor
              </Link>
            </nav>
          </div>
        </header>
        <main
          className={`mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pb-4 pt-32 md:pt-24 ${
            isQuestionsPage ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          <Outlet />
        </main>
        <footer className="mx-auto w-full max-w-6xl flex-none px-5 pb-4 text-xs text-slate-500">
          Ambiente local de preparação para entrevistas.
        </footer>
      </div>
    </CompanyProvider>
  );
}
