# FilmVault client

The browser application is built with React, TypeScript, React Router, and Axios.

## Commands

```bash
npm ci
npm start       # local development server
npm run build   # production bundle in build/
npm test        # interactive test runner
```

Copy `.env.example` to `.env` for local development. `REACT_APP_API_URL` points the client at the FilmVault API. `REACT_APP_OCI_PAR_URL` is optional and must never contain a production pre-authenticated URL in source control.

The main routes are the public catalog and authentication screens, member profiles, title and person details, search results, and the signed-in collection view.
