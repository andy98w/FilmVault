# FilmVault release readiness

This release combines the prior catalog-resilience work and collection pagination.
The catalog client bounds caching, retry time and in-flight duplication; collections
add cursor reads, server search/sort and targeted membership lookups.

## Compatibility and deployment order

1. Confirm the current staging/production hosts and access method. The repository's
   older deployment guide names an OCI IP; GitHub has no deployment records. Do not
   assume that historical host is still the correct target.
2. Verify Node 22 and the effective MySQL schema/indexes in staging. The repository
   bootstrap is not proof that a deployed database has the same columns/indexes.
3. Deploy the API with the compatibility adapter. Unmarked list requests return
   the original array; unmarked public profiles return full movies. New clients
   request `pagination=cursor`. Unknown pagination formats return 400.
4. Smoke-test old/new list formats, unauthorized access, public profile, search,
   next/previous pages, membership lookup and rating/removal with a disposable
   staging account. Verify one real TMDB request and explicit outage behavior.
5. Publish the built client only after these pass. Keep existing release files for
   rollback rather than deleting the active directory before the replacement works.

Rollback the client first and retain the compatible API. A pre-pagination API
cannot serve cached new clients correctly. Legacy collection reads stay unbounded
until client adoption supports removing that path; no date-based removal is assumed.
No new MySQL index migration is required by this release. SQLite startup adds an
idempotent user index for the demo path.

## Verification performed locally

Node 22 server/HTTP/catalog/SQLite contracts: 13 passing tests, including old/new
response compatibility and private ownership. Client: five tests and type-check.
Server build passed; production client build is checked separately. The existing
CI job additionally checks disposable MySQL contracts and records query plans.

## Remaining release gate

Current staging/production destination and access have not been confirmed.
A read-only request to the historically referenced `https://filmvault.space`
failed local certificate verification; that alone does not diagnose the server.
No remote credentials, database contents, server files or deployment were changed.
This is release preparation, not a completed staging smoke test or deployment.
