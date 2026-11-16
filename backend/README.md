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
- `POST /api/v1/users/:id/reset-password` (generates a one-time password)
- `GET /api/v1/specialties`
- `POST /api/v1/specialties`
- `PATCH /api/v1/specialties/:id`
- `DELETE /api/v1/specialties/:id`
- `GET /api/v1/companies`
- `POST /api/v1/companies`
- `GET /api/v1/companies/manage`
- `PATCH /api/v1/companies/:id`
- `GET /api/v1/companies/:companyId/questions`
- `GET /api/v1/companies/:companyId/questions/:id`
- `POST /api/v1/companies/:companyId/questions`
- `PATCH /api/v1/companies/:companyId/questions/:id`
- `PATCH /api/v1/companies/:companyId/questions/:id/favorite`
- `PATCH /api/v1/companies/:companyId/questions/favorites/order`
- `DELETE /api/v1/companies/:companyId/questions/:id`
- `GET /api/v1/companies/:companyId/code-snippets`
- `POST /api/v1/companies/:companyId/code-snippets`
- `PATCH /api/v1/companies/:companyId/code-snippets/:id`
- `DELETE /api/v1/companies/:companyId/code-snippets/:id`
- `POST /api/v1/companies/:companyId/code/run`
- OpenAPI interface: `/api/docs`

Questions require a non-empty `prompt` and `answer`, and may include
`specialtyIds`, an array of technology specialty UUIDs. Saved code snippets
include a title, language (`python` or `node`), and source code. Execution
returns stdout, stderr, and the exit code, but does not store execution history.
Each company can have up to twelve favorite questions, which are returned before
the others in a user-defined order. Root and master users can reorder favorites
by sending all favorite question IDs in the desired order. The migration assigns
existing questions to the default company;
code snippets that previously existed only in memory cannot be recovered.

All endpoints except health and login require a bearer token. Tokens expire
after 20 hours. Root users have global access; master and user accounts are
restricted to their linked companies. Masters manage only user accounts;
users can read company content and edit or delete only their own questions and
code snippets. User deletion is logical (deactivation). Root can reset any
account password; masters can reset their own password and passwords for users
in their linked companies. The generated password is returned once with
no-store caching and invalidates the target account's existing sessions.

Root can rename, activate, or deactivate any company. Master and user accounts
can perform those actions only for companies linked to their account.
Deactivation preserves company memberships, questions, and code snippets;
inactive companies are omitted from the company selector and cannot be used
until reactivated.

Set a unique `AUTH_TOKEN_SECRET` of at least 32 bytes in `backend/.env` before
starting the stack. Start the API, PostgreSQL, and code runner with
`docker compose up --build`. Once the API is healthy, create the initial root
account using `docker compose exec api npm run auth:create-root`.

The runner is isolated for local development; the Compose configuration must
not be used as the only security boundary for public code execution.
