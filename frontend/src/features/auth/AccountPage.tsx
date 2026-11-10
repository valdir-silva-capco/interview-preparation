import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { changePassword } from './auth-api';
import { useAuthStore } from './auth-store';

export function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: async () => {
      clearSession();
      await navigate({ to: '/login' });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <section className="mx-auto grid w-full max-w-xl gap-6">
      <div>
        <p className="eyebrow">Account security</p>
        <h1 className="page-title">Change password</h1>
      </div>
      <form className="panel grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-slate-200">
          Current password
          <input
            required
            type="password"
            autoComplete="current-password"
            className="field"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          New password (at least 8 characters)
          <input
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            className="field"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>
        {mutation.isError && (
          <p role="alert" className="text-red-200">
            Failed to change password: {mutation.error.message}
          </p>
        )}
        <div className="flex gap-3">
          <button className="button-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Change password'}
          </button>
          <Link className="button-secondary" to="/">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
