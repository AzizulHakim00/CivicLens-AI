# Deployment guide

CivicLens AI is deployed independently on Cloudflare Workers with a Cloudflare D1 database. The production deployment does not depend on ChatGPT Sites.

## Production architecture

```text
GitHub main branch
        ↓
Cloudflare Workers Builds
        ↓
Vinext / Vite production build
        ↓
Cloudflare Worker: civiclens-ai
        ↓
D1 binding: DB
        ↓
Database: civiclens-production-db
```

## Required Cloudflare resources

| Resource | Value |
|---|---|
| Worker name | `civiclens-ai` |
| D1 binding | `DB` |
| D1 database | `civiclens-production-db` |
| Production branch | `main` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

The repository's `wrangler.jsonc` contains the Worker name, compatibility settings, asset binding, and D1 configuration.

## Browser-only deployment

This method does not require Node.js or Wrangler on the user's computer.

1. Open Cloudflare Dashboard.
2. Go to **Workers & Pages**.
3. Open the `civiclens-ai` Worker.
4. Under **Settings → Builds**, connect the GitHub repository `AzizulHakim00/CivicLens-AI`.
5. Use `main` as the production branch.
6. Use `npm run build` as the build command.
7. Use `npx wrangler deploy` as the deploy command.
8. Save the configuration and deploy the latest commit.

After deployment, copy the public address from:

```text
Cloudflare → Workers & Pages → civiclens-ai → Settings → Domains & Routes
```

The address normally follows this pattern:

```text
https://civiclens-ai.<account-subdomain>.workers.dev
```

Do not write a guessed account subdomain into the README. Copy the exact URL shown by Cloudflare.

## Database initialization

The D1 database must contain these tables:

- `hazard_reports`
- `status_history`

For a new database, open the D1 console and execute `cloudflare-schema.sql` from the repository root.

Verify the tables with:

```sql
SELECT name
FROM sqlite_master
WHERE type = 'table';
```

## CLI deployment

For developers with Node.js installed:

```bash
npm ci
npm run lint
npm test
npx wrangler deploy --dry-run
npx wrangler deploy
```

## Automatic deployment

When Git integration is enabled, each push to `main` triggers a new Cloudflare build. The repository CI independently validates:

- dependency installation
- linting
- web application tests
- Wrangler deployment bundle
- local Worker runtime smoke test
- FastAPI tests

## Production verification

After each deployment, check:

```text
GET /
GET /api/reports
```

The homepage should render the CivicLens dashboard. The API should return either a reports array or a clear storage error.

Create one test report from the dashboard and then refresh `/api/reports` to confirm D1 persistence.

## Custom domain

A custom domain is optional. In Cloudflare:

```text
Workers & Pages
→ civiclens-ai
→ Settings
→ Domains & Routes
→ Add custom domain
```

Keep the `workers.dev` route enabled until the custom domain is fully working.

## Troubleshooting

### Build uses an old command

Confirm the production branch is `main` and the build command is:

```text
npm run build
```

### Future compatibility-date error

`wrangler.jsonc` must use a date that is not in the future relative to the deployment environment.

### `DB is undefined`

Confirm the D1 binding name is exactly:

```text
DB
```

### `no such table: hazard_reports`

Execute `cloudflare-schema.sql` in the production D1 console.

### Deployment succeeds but the site does not render

Check the latest GitHub CI run. The workflow includes a local Worker smoke test that requests the homepage and report API before deployment.

### Images fail to load

The application currently uses unoptimized images and does not require a paid Cloudflare Images binding.
