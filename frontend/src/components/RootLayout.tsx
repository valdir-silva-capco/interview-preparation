import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { CompanyProvider } from '../features/companies/CompanyContext';
import { companyKeys, getCompanies } from '../features/companies/companies-api';
import { useCompanyStore } from '../features/companies/company-store';
import { logout } from '../features/auth/auth-api';
import { LoginPage } from '../features/auth/LoginPage';
import { useAuthStore } from '../features/auth/auth-store';

export function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isQuestionsPage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const user = useAuthStore((state) => state.user);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companiesQuery = useQuery({
    queryKey: companyKeys.all,
    queryFn: getCompanies,
    enabled: Boolean(user),
  });
  const selectedCompanyId = useCompanyStore((state) => state.selectedCompanyId);
  const selectCompany = useCompanyStore((state) => state.selectCompany);
  const company =
    companiesQuery.data?.find(({ id }) => id === selectedCompanyId) ??
    companiesQuery.data?.[0] ??
    null;

  useEffect(() => {
    if (!user && !isLoginPage) {
      void navigate({ to: '/login', replace: true });
    } else if (user && isLoginPage) {
      void navigate({ to: '/', replace: true });
    }
  }, [isLoginPage, navigate, user]);

  useEffect(() => {
    if (!user || !expiresAt) return;
    const timerId = window.setTimeout(() => {
      clearSession();
      queryClient.clear();
      void navigate({ to: '/login', replace: true });
    }, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timerId);
  }, [clearSession, expiresAt, navigate, queryClient, user]);

  useEffect(() => {
    if (company && selectedCompanyId !== company.id) {
      selectCompany(company.id);
    }
  }, [company, selectedCompanyId, selectCompany]);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to end the server session:', error);
    } finally {
      clearSession();
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
    }
  }

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
              aria-label="Main navigation"
              className="flex flex-wrap items-center gap-2"
            >
              {user && companiesQuery.data && companiesQuery.data.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  Company
                  <select
                    className="field w-auto py-2"
                    aria-label="Selected company"
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
              {user?.role === 'root' && (
                <Link
                  className="nav-link"
                  activeProps={{ className: 'nav-link nav-link-active' }}
                  to="/companies/new"
                >
                  New company
                </Link>
              )}
              {user && (
                <Link
                  className="nav-link"
                  activeProps={{ className: 'nav-link nav-link-active' }}
                  to="/"
                >
                  Questions
                </Link>
              )}
              {user && (
                <Link
                  className="nav-link"
                  activeProps={{ className: 'nav-link nav-link-active' }}
                  to="/code"
                >
                  Code
                </Link>
              )}
              {user && (user.role === 'root' || user.role === 'master') && (
                <Link
                  className="nav-link"
                  activeProps={{ className: 'nav-link nav-link-active' }}
                  to="/users"
                >
                  Users
                </Link>
              )}
              {user?.role === 'root' && (
                <Link
                  className="nav-link"
                  activeProps={{ className: 'nav-link nav-link-active' }}
                  to="/specialties"
                >
                  Specialties
                </Link>
              )}
              {user ? (
                <>
                  <Link className="nav-link" to="/account">
                    {user.name}
                  </Link>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() => void handleLogout()}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link className="button-primary" to="/login">
                  Log in
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main
          className={`mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-5 pb-4 pt-32 md:pt-24 ${
            isQuestionsPage ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {user || isLoginPage ? <Outlet /> : <LoginPage />}
        </main>
        <footer className="mx-auto w-full max-w-6xl flex-none px-5 pb-4 text-xs text-slate-500">
          Local interview preparation environment.
        </footer>
      </div>
    </CompanyProvider>
  );
}
