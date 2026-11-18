# Production deployment verification

Use this checklist after every production deployment of the `retro` Worker.

1. Confirm the Cloudflare Workers & Pages project is connected to `TEaG3/Retro` and watches the `main` branch.
2. Confirm the build uses the repository root, runs `npx opennextjs-cloudflare build`, and deploys with `npx opennextjs-cloudflare deploy`.
3. In Deployments, verify the active deployment is the newest successful production version and receives 100% of traffic.
4. Open the deployed site's `/api/health` endpoint. A ready database returns HTTP 200 with `{"ok":true,"database":"connected"}`.
5. If the endpoint returns HTTP 503, inspect the Worker D1 binding named `DB` and the migration state before changing production data.
6. Do not apply D1 migrations blindly. Back up the existing database and inspect migration history and schema first.

A successful build alone does not prove that the production D1 database is ready. Verify the health endpoint separately.
