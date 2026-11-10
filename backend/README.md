# Backend

NestJS API with TypeORM migrations and PostgreSQL. Companies organize the data:
each question and saved code snippet belongs to a company. Code execution is
forwarded to a separate local service over a Unix socket.

## Endpoints

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `DELETE /api/v1/users/:id` (deactivates the account)
- `GET /api/v1/specialties`
- `POST /api/v1/specialties`
- `PATCH /api/v1/specialties/:id`
- `DELETE /api/v1/specialties/:id`
- `GET /api/v1/companies`
- `POST /api/v1/companies`
- `GET /api/v1/companies/:companyId/questions`
- `GET /api/v1/companies/:companyId/questions/:id`
- `POST /api/v1/companies/:companyId/questions`
- `PATCH /api/v1/companies/:companyId/questions/:id`
- `PATCH /api/v1/companies/:companyId/questions/:id/favorite`
- `DELETE /api/v1/companies/:companyId/questions/:id`
- `GET /api/v1/companies/:companyId/code-snippets`
- `POST /api/v1/companies/:companyId/code-snippets`
- `PATCH /api/v1/companies/:companyId/code-snippets/:id`
- `DELETE /api/v1/companies/:companyId/code-snippets/:id`
- `POST /api/v1/companies/:companyId/code/run`
- OpenAPI interface: `/api/docs`

Questions require `prompt` and may include an `answer`. Saved code snippets
include a title, language (`python` or `node`), and source code. Execution
returns stdout, stderr, and the exit code, but does not store execution history.
Each company can have up to ten favorite questions, which are returned before
the others. The migration assigns existing questions to the default company;
code snippets that previously existed only in memory cannot be recovered.

All endpoints except health and login require a bearer token. Tokens expire
after 20 hours. Root users have global access; master and user accounts are
restricted to their linked companies. Masters manage only user accounts;
users can read company content and edit or delete only their own questions and
code snippets. User deletion is logical (deactivation).

Set a unique `AUTH_TOKEN_SECRET` of at least 32 bytes in `backend/.env` before
starting the stack. Start the API, PostgreSQL, and code runner with
`docker compose up --build`. Once the API is healthy, create the initial root
account using `docker compose exec api npm run auth:create-root`.

The runner is isolated for local development; the Compose configuration must
not be used as the only security boundary for public code execution.
