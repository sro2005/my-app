# Dependency audit — ElectroVibeHome

## Evidence available (21 Oct 2026)

The last recorded GitHub Actions install logs reported:

- Frontend root (`npm ci`, 1,552 packages audited): **112 advisories** — 6 low, 17 moderate, 85 high, 4 critical.
- Backend (`backend/npm ci`, 224 packages audited): **24 advisories** — 1 low, 5 moderate, 16 high, 2 critical.
- Both installs completed. These totals are from that run and must be refreshed before release; they are not a current per-package inventory.
- The backend JavaScript syntax check passed in that run. The frontend job stopped at “No tests found”, so the build step was skipped. The workflow was subsequently changed to allow an empty frontend test suite and to run only by manual dispatch, but that updated workflow has not yet been confirmed in a new run.

## What this means

The install logs do not include the full `npm audit` advisory tree, so they do not reliably identify which exact package/version fixes each advisory. Do not run `npm audit fix --force` blindly: it may introduce major-version changes or break the React app and API.

## Safe remediation sequence

1. Run `npm audit --json` from the repository root and from `backend/`; retain the output so each advisory can be mapped to its direct/transitive dependency, severity, and fixed version.
2. Apply ordinary compatible updates with `npm audit fix` in an isolated working branch, then review both lockfiles and package manifests.
3. For advisories that remain, update the responsible direct dependency deliberately. The frontend currently uses Create React App / `react-scripts@5`, whose old build-tool dependency tree is a likely source of legacy transitive packages; migrating build tooling is a separate, larger change and should not be mixed into an unverified patch.
4. Run clean installs, frontend tests and production build, backend syntax checks and unit tests, then smoke-test routes and checkout.
5. Re-run both audits and record the remaining findings. Do not claim “zero vulnerabilities” unless the final audit output confirms it.

## Notification control

The repository CI workflow is now manual-dispatch-only. Commits to the feature branch should no longer trigger that workflow automatically. This does not control GitHub's separate Dependabot, pull-request, review, or account-level notification emails; those are controlled in GitHub notification settings.
