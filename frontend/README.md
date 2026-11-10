# Frontend

React and Vite application using TypeScript, Tailwind CSS, TanStack Query,
TanStack Router, Zustand, and CodeMirror.

The interface supports local email/password login, account management by role,
and company selection. Questions and saved code snippets are scoped to the
selected company. Users can read company content and edit or delete only their
own questions and snippets; masters manage users in their linked companies,
and root manages companies, masters, and technology specialties. The editor
runs Python or Node.js snippets through the API and keeps drafts separate per
company in the browser session. Editable code is automatically saved every
five minutes when changes are present.

Run `docker compose up --build` to start the container at
<http://localhost:5173>. Configure `VITE_API_URL` if the API is not available
at `http://localhost:3000/api/v1`.
