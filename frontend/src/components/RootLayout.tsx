import { useEffect, useRef } from 'react';
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
  const adminMenuRef = useRef<HTMLDetailsElement>(null);
  const companyMenuRef = useRef<HTMLDetailsElement>(null);
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
    adminMenuRef.current?.removeAttribute('open');
    companyMenuRef.current?.removeAttribute('open');
  }, [pathname]);

  useEffect(() => {
    function handleExpiredSession() {
      clearSession();
      queryClient.clear();
      void navigate({ to: '/login', replace: true });
    }

    window.addEventListener('auth:expired', handleExpiredSession);
    return () => {
      window.removeEventListener('auth:expired', handleExpiredSession);
    };
  }, [clearSession, navigate, queryClient]);

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
              className="flex flex-wrap items-center gap-3"
            >
              {user && companiesQuery.data && companiesQuery.data.length > 0 && (
                <details className="relative" ref={companyMenuRef}>
                  <summary
                    className="nav-link cursor-pointer list-none"
                    aria-label="Company Selection"
                    title="Company Selection"
                  >
                    Company Selection
                  </summary>
                  <div
                    className="absolute left-0 top-full z-50 mt-2 grid min-w-48 gap-1 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl"
                    role="group"
                    aria-label="Companies"
                  >
                    {user.role === 'root' && (
                      <>
                        <Link
                          className="nav-link w-full justify-start"
                          to="/companies/new"
                        >
                          + New Company
                        </Link>
                        <div
                          aria-hidden="true"
                          className="my-1 border-t border-slate-700"
                        />
                      </>
                    )}
                    {companiesQuery.data.map((item) => (
                      <button
                        key={item.id}
                        className={`nav-link w-full justify-start ${
                          item.id === company?.id ? 'nav-link-active' : ''
                        }`}
                        type="button"
                        aria-pressed={item.id === company?.id}
                        onClick={() => {
                          selectCompany(item.id);
                          companyMenuRef.current?.removeAttribute('open');
                        }}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </details>
              )}
              {user && (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="nav-link"
                    activeProps={{ className: 'nav-link nav-link-active' }}
                    to="/"
                  >
                    Questions
                  </Link>
                  <Link
                    className="nav-link"
                    activeProps={{ className: 'nav-link nav-link-active' }}
                    to="/code"
                  >
                    Code
                  </Link>
                </div>
              )}
              {user && (user.role === 'root' || user.role === 'master') && (
                <details className="relative" ref={adminMenuRef}>
                  <summary className="nav-link cursor-pointer list-none">
                    Admin
                  </summary>
                  <div className="absolute right-0 top-full z-50 mt-2 grid min-w-48 gap-1 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
                    {user.role === 'root' && (
                      <Link className="nav-link" to="/specialties">
                        Specialties
                      </Link>
                    )}
                    <Link className="nav-link" to="/users">
                      Users
                    </Link>
                  </div>
                </details>
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
