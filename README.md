# Interview Preparation

The application is split into two projects, each with its own Docker Compose
configuration:

- `backend/`: NestJS API, PostgreSQL, and a restricted local code execution service.
- `frontend/`: React, Vite, Tailwind CSS, TanStack Query/Router, Zustand, and CodeMirror.

Companies group questions and saved code snippets. Select a company from the
navigation or create a new one; questions and code snippets are scoped to the
selected company. Existing questions are assigned to the default company by the
migration. Editor drafts are kept separately per company in the browser session.
Up to ten questions per company can be favorited and are kept at the top of the
list.

The company selector does not provide authentication or access control: any
user of this instance can access all companies. Do not treat this separation as
isolation for confidential data.

## Run locally with Docker Compose

Start the API, database, and code runner:

```bash
cd /home/vdld/projects/interview-preparation/backend
cp .env.example .env
docker compose up --build
```

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

The PostgreSQL password in `.env.example` is for local development only. Change
it before using the stack in any shared environment.

## Project checks

Install dependencies in each project when the npm registry is available:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Then run `npm run build` in either project to build it.
