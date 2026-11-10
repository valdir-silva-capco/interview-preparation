# Backend

NestJS API with TypeORM migrations and PostgreSQL. Companies organize the data:
each question and saved code snippet belongs to a company. Code execution is
forwarded to a separate local service over a Unix socket.

## Endpoints

- `GET /api/v1/health`
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

The company selector does not require login: it provides data organization,
not authorization. Anyone with access to the application can select any
registered company. Do not use this configuration for confidential data or
public exposure without implementing authentication and authorization.

Start the API, PostgreSQL, and code runner with `docker compose up --build`.
The runner is isolated for local development; the Compose configuration must
not be used as the only security boundary for public code execution.
