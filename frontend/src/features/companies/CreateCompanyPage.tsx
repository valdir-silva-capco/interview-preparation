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
        <p className="eyebrow">Organização</p>
        <h1 className="page-title">Cadastrar empresa</h1>
        <p className="mt-2 text-slate-400">
          Cada empresa terá sua própria coleção de perguntas e códigos salvos.
        </p>
      </div>
      <form className="panel grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-200">
          Nome da empresa
          <input
            required
            autoFocus
            maxLength={120}
            className="field"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Acme Tecnologia"
          />
        </label>
        {mutation.isError && (
          <p
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
          >
            Não foi possível cadastrar a empresa: {mutation.error.message}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            className="button-primary"
            type="submit"
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? 'Salvando…' : 'Cadastrar empresa'}
          </button>
          <Link className="button-secondary" to="/">
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  );
}
