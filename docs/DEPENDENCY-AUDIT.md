# Dependency audit — ElectroVibeHome

## Evidence available (21 Oct 2026)

The last recorded GitHub Actions install logs reported:

- Frontend root (`npm ci`, 1,552 packages audited): **112 advisories** — 6 low, 17 moderate, 85 high, 4 critical.
- Backend (`backend/npm ci`, 224 packages audited): **24 advisories** — 1 low, 5 moderate, 16 high, 2 critical.
- These totals come from a previous run and must be refreshed; they are not a current per-package inventory.
- The backend JavaScript syntax check and four backend unit tests passed in the most recent available run. Frontend tests exited successfully only because the repository has no frontend tests yet. The frontend production build then failed because `src/components/PedidoForm.js` declared an unused `navigate` variable; that unused import and variable have now been removed on the feature branch, but the build has not yet been rerun against the fix.

## New audit-report collection

The manual-only workflow now runs `npm audit --json` separately for the frontend and backend and uploads the complete JSON reports as artifacts, retained for 14 days. This should expose package names, affected paths, severity, and available remediation metadata from the next manual run, even if npm audit exits non-zero. It does **not** automatically change dependency versions or claim the issues are fixed.

## Additional checkout hardening

The Wompi checkout controller now reuses a persisted payment reference for a pending order and uses a conditional database update to claim the first reference. This reduces the risk that reopening checkout creates a new reference while a previous transaction is still in flight. It is a code-level hardening change, not proof that concurrent payment attempts are fully resolved; Wompi Sandbox tests and payment reconciliation are still required.

## Remediation approach

1. Run the workflow manually from GitHub Actions on branch `security/electrovibehome-hardening`.
2. Download both audit artifacts and map advisories to direct/transitive dependencies, severity, and fixed versions.
3. Apply compatible updates in this isolated branch, review both lockfiles, and test the application. Do not use `npm audit fix --force` blindly: it may introduce major-version changes or break the React app and API.
4. For advisories that remain, update the responsible direct dependency deliberately. The frontend uses Create React App / `react-scripts@5`, whose older build-tool dependency tree may require a separately planned migration; do not mix an unverified migration into a security patch.
5. Run clean installs, frontend tests and production build, backend syntax checks and unit tests, then smoke-test routes and checkout.
6. Re-run both audits and document the verified result. Do not claim “zero vulnerabilities” unless the final reports confirm it.

## Release blockers

- No refreshed per-package audit output has been reviewed yet, so vulnerable package versions have **not** been upgraded as part of this work.
- The last available frontend build failed on an unused `navigate` variable; the variable/import have been removed on this branch, but the fixed build is not yet confirmed. Two storefront smoke tests have been added and the workflow now requires tests to exist, but these tests have not yet been executed in a fresh CI run.
- Configure Wompi Sandbox and its HTTPS webhook; verify SMTP password reset and MongoDB connectivity; test approved, declined, pending, and abandoned payment flows.
- Define safe reconciliation for abandoned pending orders. Do not restore reserved stock for a Wompi reference until its payment outcome is verified.
- Rotate any real private key that was ever committed. Removing a key from the current branch does not purge it from Git history.
- Confirm `REACT_APP_API_BASE_URL`, `ALLOWED_ORIGINS`, and `FRONTEND_URL` match the actual deployed domains. Do not enable production payments until Sandbox tests pass.

## Notifications

The repository CI workflow is manual-dispatch-only, so commits do not automatically start this workflow. This reduces workflow-triggered email noise, but does not change separate GitHub, Dependabot, pull-request, review, or account-level notifications. Those require notification settings in GitHub.
