# Catalog dependency handling

All seven TMDB request sites in the movie router now use one client. Ratings,
collections and other user records still go directly through their existing
database paths; the catalog cache never stores them.

The client coalesces identical in-flight GETs and keeps up to 200 responses per
process. Entries are fresh for 60 seconds. During a transient upstream failure,
an entry can be served for five more minutes, labeled with
`X-FilmVault-Data-Source: stale` and a Warning header. Credential errors do not
qualify for stale fallback. Cache keys include query parameters and authentication
context, hashed rather than stored as plaintext keys.

Requests have a five-second budget and at most two attempts. Only 429 and 503
responses are retried, respecting Retry-After when it fits the budget. Redirects
are disabled, response bodies are capped at 2 MB, and non-object payloads are
rejected. In-flight unique requests are also bounded at 200.

Run from `server`:

```sh
npm run build
node -r ts-node/register --test src/services/catalog-client.test.ts
```

Tests use a local HTTP fixture, not TMDB credentials. They cover coalescing,
query isolation, eviction, mutation isolation, retry limits, stale responses,
credential failure, malformed bodies and timeouts. These are failure-contract
tests, not a production load benchmark.

The cache is not shared across replicas. Existing development mock fallback
remains separate from this client. Staleness is exposed in response headers,
not yet as a visible UI badge. No production deployment is part of this change.
