import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { createCompany, companyKeys, type Company } from './companies-api';
import { useCompanyStore } from './company-store';

export function CreateCompanyPage() {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const selectCompany = useCompanyStore((state) => state.selectCompany);
  const mutation = useMutation({
    mutationFn: createCompany,
    onSuccess: async (company) => {
      queryClient.setQueryData<Company[]>(companyKeys.all, (companies = []) =>
        [...companies, company].sort((a, b) => a.name.localeCompare(b.name)),
      );
      selectCompany(company.id);
      await queryClient.invalidateQueries({ queryKey: companyKeys.all });
      await navigate({ to: '/' });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(name.trim());
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6">
      <div>
        <p className="eyebrow">Organization</p>
        <h1 className="page-title">Create Company</h1>
        <p className="mt-2 text-slate-400">
          Each company has its own collection of questions and saved code snippets.
        </p>
      </div>
      <form className="panel grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-200">
          Company name
          <input
            required
            autoFocus
            maxLength={120}
            className="field"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g., Acme Technologies"
          />
        </label>
        {mutation.isError && (
          <p
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
          >
            Failed to create the company: {mutation.error.message}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            className="button-primary"
            type="submit"
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? 'Saving…' : 'Create company'}
          </button>
          <Link className="button-secondary" to="/">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
