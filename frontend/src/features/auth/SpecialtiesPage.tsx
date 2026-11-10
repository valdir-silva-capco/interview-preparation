import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  authKeys,
  deleteSpecialty,
  getSpecialties,
  saveSpecialty,
} from './auth-api';
import { useAuthStore } from './auth-store';

export function SpecialtiesPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const specialtiesQuery = useQuery({
    queryKey: authKeys.specialties,
    queryFn: getSpecialties,
  });
  const saveMutation = useMutation({
    mutationFn: () => saveSpecialty({ name: name.trim() }, editingId ?? undefined),
    onSuccess: async () => {
      setName('');
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: authKeys.specialties });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSpecialty,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.specialties }),
  });

  if (user?.role !== 'root') {
    return (
      <p role="alert" className="panel text-red-200">
        Only the root user can manage technology specialties.
      </p>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate();
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Root administration</p>
          <h1 className="page-title">Technology specialties</h1>
        </div>
        <Link className="button-secondary" to="/">
          Back
        </Link>
      </div>
      <form className="panel grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-slate-200">
          Specialty name
          <input
            required
            maxLength={80}
            className="field"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        {(saveMutation.isError || deleteMutation.isError) && (
          <p role="alert" className="text-red-200">
            {saveMutation.error?.message ?? deleteMutation.error?.message}
          </p>
        )}
        {specialtiesQuery.isError && (
          <p role="alert" className="text-red-200">
            Failed to load specialties: {specialtiesQuery.error.message}
          </p>
        )}
        <div className="flex gap-3">
          <button
            className="button-primary"
            disabled={!name.trim() || saveMutation.isPending}
          >
            {editingId ? 'Save changes' : 'Add specialty'}
          </button>
          {editingId && (
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setName('');
                setEditingId(null);
                saveMutation.reset();
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {specialtiesQuery.data?.map((specialty) => (
        <article
          className="panel flex flex-wrap items-center justify-between gap-3"
          key={specialty.id}
        >
          <h2 className="font-semibold">{specialty.name}</h2>
          <div className="flex gap-2">
            <button
              className="button-secondary"
              type="button"
              onClick={() => {
                setEditingId(specialty.id);
                setName(specialty.name);
                saveMutation.reset();
              }}
            >
              Edit
            </button>
            <button
              className="button-danger"
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm(`Delete the "${specialty.name}" specialty?`)) {
                  deleteMutation.mutate(specialty.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
