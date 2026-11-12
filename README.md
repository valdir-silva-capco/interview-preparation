# Interview Preparation

The application is split into two projects, each with its own Docker Compose
configuration:

- `backend/`: NestJS API, PostgreSQL, and a restricted local code execution service.
- `frontend/`: React, Vite, Tailwind CSS, TanStack Query/Router, Zustand, and CodeMirror.

Users sign in locally with an email and password. Companies scope questions and
saved code snippets; users can access only their linked companies. Root users
manage companies, master accounts, and technology specialties. Masters manage
user accounts within their linked companies. Users can read company content
and manage their own questions and code snippets.

Open **Manage Companies** from the **Company Selection** menu to rename or
activate/deactivate companies. Root can manage all companies; other roles can
manage companies linked to their accounts. Deactivation preserves company
data and memberships, removes the company from the selector, and can be
reversed from the management screen.

## Run locally with Docker Compose

Start the API, database, and code runner:

```bash
cd /home/vdld/projects/interview-preparation/backend
cp .env.example .env
# Replace AUTH_TOKEN_SECRET with a unique value from: openssl rand -hex 32
docker compose up --build
```

After the API and database are ready, provision the initial root account:

```bash
docker compose exec api npm run auth:create-root
```

The setup prompts for a name and a password (at least 8 characters). The
initial root email defaults to `valdir.silva@capco.com` and can be changed with
`ROOT_EMAIL`. Do not use the example secret in a running environment.

In another terminal, start the frontend:

```bash
cd /home/vdld/projects/interview-preparation/frontend
docker compose up --build
```

Open the frontend at <http://localhost:5173>. The API is available at
<http://localhost:3000/api/v1>, and the OpenAPI documentation is at
<http://localhost:3000/api/docs>.

Compose publishes services only on loopback. The code runner has no network
access or published ports, runs snippets as unprivileged users, and limits each
execution to 3 seconds, Python to 256 MB of virtual memory, Node.js to 96 MB of
V8 heap, and the runner container to 512 MB and 1 CPU. Up to two executions can
run concurrently; source code is limited to 20 KB and each output stream to
32 KB. These protections are intended for local development and are not a
production sandbox for arbitrary code. Do not expose the application or runner
to the internet.

Tokens expire after 20 hours. Logging out, changing a password, or
deactivating an account invalidates its active tokens.
Root can generate a one-time password for any account. Masters can generate one
for themselves and users in their linked companies. The generated password is
displayed once in the user-management screen for copying.

The PostgreSQL password in `.env.example` is for local development only. Change
it before using the stack in any shared environment.

## Project checks

Install dependencies in each project when the npm registry is available:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Then run `npm run build` in either project to build it.
