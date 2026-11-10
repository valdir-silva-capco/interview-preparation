import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { companyKeys, getCompanies } from '../companies/companies-api';
import { useAuthStore } from './auth-store';
import {
  authKeys,
  createUser,
  deactivateUser,
  getSpecialties,
  getUsers,
  resetUserPassword,
  updateUser,
  type ManagedUser,
  type SaveUserInput,
} from './auth-api';

export function UsersPage() {
  const actor = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'master'>('user');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [passwordReset, setPasswordReset] = useState<{
    userId: string;
    userName: string;
    password: string;
  } | null>(null);
  const [copyError, setCopyError] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);
  const usersQuery = useQuery({
    queryKey: authKeys.users,
    queryFn: getUsers,
    enabled: actor?.role === 'root' || actor?.role === 'master',
  });
  const companiesQuery = useQuery({
    queryKey: companyKeys.all,
    queryFn: getCompanies,
    enabled: actor?.role === 'root' || actor?.role === 'master',
  });
  const specialtiesQuery = useQuery({
    queryKey: authKeys.specialties,
    queryFn: getSpecialties,
    enabled: actor?.role === 'root' || actor?.role === 'master',
  });
  const saveMutation = useMutation({
    mutationFn: (input: SaveUserInput) =>
      editingUser
        ? updateUser(editingUser.id, input)
        : createUser({
            ...input,
            name: input.name ?? '',
            email: input.email ?? '',
            password: input.password ?? '',
          }),
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: authKeys.users });
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.users }),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.users }),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: async (result, id) => {
      const target = usersQuery.data?.find((user) => user.id === id);
      setPasswordReset({
        userId: id,
        userName: target?.name ?? 'the account',
        password: result.password,
      });
      setCopyError('');
      setPasswordCopied(false);
      if (id !== actor?.id) {
        await queryClient.invalidateQueries({ queryKey: authKeys.users });
      }
    },
  });

  function resetForm() {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setAvatarUrl('');
    setCompanyIds([]);
    setSpecialtyIds([]);
    saveMutation.reset();
  }

  function editUser(user: ManagedUser) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role === 'master' ? 'master' : 'user');
    setAvatarUrl(user.avatarUrl ?? '');
    setCompanyIds(user.companyIds);
    setSpecialtyIds(user.specialties.map(({ id }) => id));
    saveMutation.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: SaveUserInput = {
      name: name.trim(),
      email: email.trim(),
      role,
      avatarUrl: avatarUrl.trim() || null,
      companyIds,
      specialtyIds,
    };
    if (password) input.password = password;
    saveMutation.mutate(input);
  }

  async function copyTemporaryPassword() {
    if (!passwordReset) return;
    if (!navigator.clipboard) {
      setCopyError('Clipboard access is not available in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(passwordReset.password);
      setPasswordCopied(true);
      setCopyError('');
    } catch (error) {
      setCopyError(
        error instanceof Error
          ? error.message
          : 'Failed to copy the temporary password.',
      );
    }
  }

  async function finishPasswordReset() {
    const resetOwnPassword = passwordReset?.userId === actor?.id;
    setPasswordReset(null);
    if (resetOwnPassword) {
      clearSession();
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
    }
  }

  if (!actor || (actor.role !== 'root' && actor.role !== 'master')) {
    return (
      <p role="alert" className="panel text-red-200">
        You do not have permission to manage users.
      </p>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="page-title">Users</h1>
          <p className="mt-2 text-slate-400">
            Accounts are deactivated instead of permanently deleted.
          </p>
        </div>
        <Link className="button-secondary" to="/">
          Back
        </Link>
      </div>

      <form
        autoComplete="off"
        className="panel grid gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold md:col-span-2">
          {editingUser ? 'Edit user' : 'Add user'}
        </h2>
        <label className="grid gap-2 text-sm text-slate-200">
          Name
          <input
            required
            autoComplete="off"
            maxLength={120}
            className="field"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          Email
          <input
            required
            autoComplete="off"
            type="email"
            maxLength={320}
            className="field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {!editingUser && (
          <label className="grid gap-2 text-sm text-slate-200">
            Initial password (at least 8 characters)
            <input
              required
              autoComplete="new-password"
              type="password"
              minLength={8}
              maxLength={200}
              className="field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
        )}
        {actor.role === 'root' && (
          <label className="grid gap-2 text-sm text-slate-200">
            Role
            <select
              className="field"
              value={role}
              onChange={(event) =>
                setRole(event.target.value === 'master' ? 'master' : 'user')
              }
            >
              <option value="user">User</option>
              <option value="master">Master</option>
            </select>
          </label>
        )}
        <label className="grid gap-2 text-sm text-slate-200">
          Avatar URL (optional)
          <input
            autoComplete="off"
            type="url"
            maxLength={2048}
            className="field"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          Companies (select at least one)
          <select
            required
            autoComplete="off"
            multiple
            className="field min-h-32"
            value={companyIds}
            onChange={(event) =>
              setCompanyIds(
                Array.from(event.target.selectedOptions, ({ value }) => value),
              )
            }
          >
            {(companiesQuery.data ?? []).map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          Technology specialties
          <select
            autoComplete="off"
            multiple
            className="field min-h-32"
            value={specialtyIds}
            onChange={(event) =>
              setSpecialtyIds(
                Array.from(event.target.selectedOptions, ({ value }) => value),
              )
            }
          >
            {(specialtiesQuery.data ?? []).map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </label>
        {(usersQuery.isError ||
          companiesQuery.isError ||
          specialtiesQuery.isError ||
          saveMutation.isError ||
          statusMutation.isError ||
          deactivateMutation.isError) && (
          <p role="alert" className="text-red-200 md:col-span-2">
            {saveMutation.error?.message ??
              statusMutation.error?.message ??
              deactivateMutation.error?.message ??
              usersQuery.error?.message ??
              companiesQuery.error?.message ??
              specialtiesQuery.error?.message}
          </p>
        )}
        <div className="flex gap-3 md:col-span-2">
          <button
            className="button-primary"
            disabled={
              saveMutation.isPending ||
              companyIds.length === 0 ||
              (!editingUser && password.length < 8)
            }
          >
            {saveMutation.isPending ? 'Saving…' : 'Save user'}
          </button>
          {editingUser && (
            <button
              className="button-secondary"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {usersQuery.isPending && <p className="panel">Loading users…</p>}
      {resetPasswordMutation.isError && (
        <p role="alert" className="panel text-red-200">
          Failed to reset the password:{' '}
          {resetPasswordMutation.error.message}
        </p>
      )}
      {usersQuery.data?.map((user) => (
        <article className="panel flex flex-wrap items-center gap-4" key={user.id}>
          {user.avatarUrl && (
            <img
              className="size-12 rounded-full object-cover"
              src={user.avatarUrl}
              alt=""
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
            <p className="text-xs text-slate-500">
              {user.role} · {user.isActive ? 'Active' : 'Inactive'} ·{' '}
              {user.companies.map(({ name: companyName }) => companyName).join(', ')}
            </p>
            <p className="text-xs text-slate-500">
              {user.specialties.map(({ name: specialtyName }) => specialtyName).join(', ')}
            </p>
          </div>
          {user.role !== 'root' &&
            (actor.role === 'root' || user.role === 'user') && (
            <>
              <button
                className="button-secondary"
                type="button"
                onClick={() => editUser(user)}
              >
                Edit
              </button>
              {user.id !== actor.id && (
                <button
                  className="button-danger"
                  type="button"
                  disabled={
                    deactivateMutation.isPending || statusMutation.isPending
                  }
                  onClick={() => {
                    if (
                      window.confirm(
                        user.isActive
                          ? `Deactivate ${user.name}'s account?`
                          : `Reactivate ${user.name}'s account?`,
                      )
                    ) {
                      if (user.isActive) {
                        deactivateMutation.mutate(user.id);
                      } else {
                        statusMutation.mutate({
                          id: user.id,
                          isActive: true,
                        });
                      }
                    }
                  }}
                >
                  {user.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              )}
            </>
          )}
          {(actor.role === 'root' ||
            (actor.role === 'master' &&
              (user.id === actor.id || user.role === 'user'))) && (
            <button
              className="button-secondary"
              type="button"
              disabled={resetPasswordMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    user.id === actor.id
                      ? 'Generate a new password for your account? Your current session will end after you copy it.'
                      : `Generate a new password for ${user.name}? Their existing sessions will be ended.`,
                  )
                ) {
                  resetPasswordMutation.mutate(user.id);
                }
              }}
            >
              Reset password
            </button>
          )}
        </article>
      ))}
      {passwordReset && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/90 p-5">
          <section
            aria-labelledby="temporary-password-title"
            aria-modal="true"
            className="panel grid w-full max-w-lg gap-4"
            role="dialog"
          >
            <div>
              <p className="eyebrow">One-time display</p>
              <h2
                className="text-xl font-semibold"
                id="temporary-password-title"
              >
                Temporary password for {passwordReset.userName}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Copy and share this password securely. It will not be shown
                again. Existing sessions for this account have been ended.
              </p>
            </div>
            <code className="select-all break-all rounded-lg bg-slate-950 p-4 text-sky-200">
              {passwordReset.password}
            </code>
            {copyError && (
              <p role="alert" className="text-sm text-red-200">
                Failed to copy the password: {copyError}
              </p>
            )}
            {passwordCopied && (
              <p role="status" className="text-sm text-sky-300">
                Password copied to the clipboard.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                className="button-secondary"
                type="button"
                onClick={() => void copyTemporaryPassword()}
              >
                Copy password
              </button>
              <button
                className="button-primary"
                type="button"
                disabled={!passwordCopied}
                onClick={() => void finishPasswordReset()}
              >
                {passwordReset.userId === actor.id
                  ? 'Copied — sign in again'
                  : 'Done'}
              </button>
            </div>
            {copyError && (
              <button
                className="text-sm text-sky-300 underline"
                type="button"
                onClick={() => {
                  setPasswordCopied(true);
                  setCopyError('');
                }}
              >
                I copied the selected password manually
              </button>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
