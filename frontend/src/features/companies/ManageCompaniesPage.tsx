import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  companyKeys,
  getManageableCompanies,
  updateCompany,
  type Company,
} from './companies-api';

export function ManageCompaniesPage() {
  const queryClient = useQueryClient();
  const companiesQuery = useQuery({
    queryKey: companyKeys.manageable,
    queryFn: getManageableCompanies,
  });
  const [names, setNames] = useState<Record<string, string>>({});
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; isActive?: boolean };
    }) => updateCompany(id, input),
    onSuccess: async (updatedCompany, variables) => {
      if (variables.input.name !== undefined) {
        setNames((current) => {
          const next = { ...current };
          delete next[updatedCompany.id];
          return next;
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: companyKeys.manageable }),
        queryClient.invalidateQueries({ queryKey: companyKeys.all }),
      ]);
    },
  });

  function saveName(event: FormEvent<HTMLFormElement>, company: Company) {
    event.preventDefault();
    const name = (names[company.id] ?? company.name).trim();
    if (!name || name === company.name) return;
    updateMutation.mutate({ id: company.id, input: { name } });
  }

  return (
    <section className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Company administration</p>
          <h1 className="page-title">Manage Companies</h1>
          <p className="mt-2 text-slate-400">
            Root users can manage every company. Other users can manage
            companies linked to their accounts. Deactivated companies and their
            data are preserved and can be reactivated.
          </p>
        </div>
        <Link className="button-secondary" to="/">
          Back
        </Link>
      </div>

      {companiesQuery.isPending && (
        <p className="panel text-slate-300">Loading companies…</p>
      )}
      {companiesQuery.isError && (
        <p role="alert" className="panel text-red-200">
          Failed to load companies: {companiesQuery.error.message}
        </p>
      )}
      {updateMutation.isError && (
        <p role="alert" className="panel text-red-200">
          Failed to update the company: {updateMutation.error.message}
        </p>
      )}
      {companiesQuery.data?.length === 0 && (
        <p className="panel text-slate-400">
          No companies are linked to your account.
        </p>
      )}
      {companiesQuery.data?.map((company) => {
        const currentName = names[company.id] ?? company.name;
        const nameChanged = currentName.trim() !== company.name;
        return (
          <article
            className="panel grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            key={company.id}
          >
            <form
              className="flex min-w-0 flex-wrap items-end gap-3"
              onSubmit={(event) => saveName(event, company)}
            >
              <label className="grid min-w-0 flex-1 gap-2 text-sm text-slate-200">
                Company name
                <input
                  required
                  maxLength={120}
                  className="field"
                  value={currentName}
                  onChange={(event) =>
                    setNames((current) => ({
                      ...current,
                      [company.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <button
                className="button-secondary"
                type="submit"
                disabled={
                  updateMutation.isPending || !nameChanged || !currentName.trim()
                }
              >
                Save name
              </button>
            </form>
            <div className="flex items-end gap-3">
              <span
                className={
                  company.isActive
                    ? 'pb-2 text-sm text-emerald-300'
                    : 'pb-2 text-sm text-slate-400'
                }
              >
                {company.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                className={
                  company.isActive ? 'button-danger' : 'button-secondary'
                }
                type="button"
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    id: company.id,
                    input: { isActive: !company.isActive },
                  })
                }
              >
                {company.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
