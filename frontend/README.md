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
five minutes when changes are present. Root can generate one-time passwords
for any account; masters can generate one for themselves and linked users. The
password is displayed once in the user-management screen for copying.

Questions can be assigned one or more technology specialties when created or
edited. Selected specialties appear as tags beside each question title.
Root and master users can mark up to twelve questions per company as favorites
and drag them into the desired order.

The Company Selection menu includes company management. Root can manage all
companies; other users can rename or activate/deactivate companies linked to
their accounts. Deactivated companies are hidden from the selector and their
content is preserved.

Run `docker compose up --build` to start the container at
<http://localhost:5173>. Configure `VITE_API_URL` if the API is not available
at `http://localhost:3000/api/v1`.
