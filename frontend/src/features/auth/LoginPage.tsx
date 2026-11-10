import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { login } from './auth-api';
import { useAuthStore } from './auth-store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: async (result) => {
      setSession(result.accessToken, result.expiresIn, result.user);
      await navigate({ to: '/' });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <section className="mx-auto grid w-full max-w-md gap-6">
      <div>
        <p className="eyebrow">Interview Preparation</p>
        <h1 className="page-title">Sign in</h1>
      </div>
      <form className="panel grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-200">
          Email
          <input
            required
            autoFocus
            type="email"
            autoComplete="username"
            maxLength={320}
            className="field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-200">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            maxLength={200}
            className="field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {mutation.isError && (
          <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-red-200">
            Sign-in failed: {mutation.error.message}
          </p>
        )}
        <button className="button-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
