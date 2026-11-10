# Frontend

React and Vite application using TypeScript, Tailwind CSS, TanStack Query,
TanStack Router, Zustand, and CodeMirror.

The interface supports creating and selecting companies. Questions and saved
code snippets are queried and updated within the selected company. The editor
runs Python or Node.js snippets through the API and keeps drafts separate per
company in the browser session. Code snippets with a title and source are
automatically saved every five minutes when changes are present. Up to ten
questions per company can be favorited and kept at the top of the list.

Run `docker compose up --build` to start the container at
<http://localhost:5173>. Configure `VITE_API_URL` if the API is not available
at `http://localhost:3000/api/v1`. The company selector organizes data but does
not replace login or authorization: all registered companies are accessible
to users of this instance.
