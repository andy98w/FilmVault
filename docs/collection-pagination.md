# Collection read performance

The old collection endpoints returned every saved movie. My Collection then searched, sorted, and paginated that array in the browser. Movie and TV detail pages also downloaded the entire array just to check membership.

Both collection endpoints now return at most 100 movies (default 15). My Collection and public profiles request 15 at a time with Previous/Next navigation. Search and sorting run against the whole collection on the server. Detail pages query one TMDB ID. Aborted or late browser responses cannot replace a newer search or another user's profile. Rating/removal refreshes from page one to avoid retaining obsolete sort positions.

## API contract

- `GET /api/movies/user/list`: authenticated; user identity comes only from the verified token. Returns `{ movies, nextCursor }`; movie fields retain PascalCase.
- `GET /api/users/profile/:id`: deliberately public, as before. Returns `{ user, movies, nextCursor }`; movie fields retain lowercase names. Profile metadata excludes credentials. Missing user returns 404.
- Parameters: `limit` (1–100, default 15), `sort` (`dateAdded`, `title`, `rating`, `releaseDate`), `direction` (`asc` or `desc`), `q` (literal title substring, max 200 characters), optional `tmdbId` (positive integer), and `cursor` from the preceding response.
- Malformed options, invalid cursors, and cursors from another user/filter/order return 400. `nextCursor: null` means no further rows were observed in that query. No count query or offset scan is needed.
- A cursor is an opaque, validated position, not a credential or signed authorization claim. Modifying a position cannot change the route's user scope. SQL sort expressions are whitelisted; values are bound parameters.

`dateAdded` orders by immutable collection membership ID (insertion sequence), not TMDB ID or a fabricated date. This works across the existing SQLite `added_at` and MySQL `created_at` schema variants. Other sorts use membership ID as the tie-breaker. Missing ratings sort as zero; missing release dates sort as an empty string (first ascending, last descending). Title ordering/search follows the database collation; it need not reproduce JavaScript localeCompare exactly.

## Concurrent edits

These are live reads, not a database snapshot. Deleting the anchor still permits continuation. Newer entries do not shift a descending date-added continuation and appear on refresh. Changes to mutable sort keys (title/rating/release date), or deleting/re-adding an item, can move that item across the current cursor and cause omissions/reappearances. Refresh to restart. Previous re-queries the recorded page boundary, rather than promising a frozen historical page.

## Index decision

The MySQL bootstrap already has `(user_id,movie_id)` unique indexes on memberships and ratings, plus `idx_user_movies_user_id(user_id)`. Do not blindly duplicate them. InnoDB's user index includes the membership primary key, supporting the default user-and-membership-order walk. Verify the effective deployment schema with `SHOW INDEX FROM user_movies` before rollout; runtime databases may differ from bootstrap.

The SQLite schema lacked the user-only index. Its EXPLAIN QUERY PLAN used a temporary B-tree for the default order; adding `idx_user_movies_user_id(user_id)` removes that sort. Startup now creates it idempotently for existing SQLite databases. There is no new MySQL migration. Nondefault sorting and substring search may still scan/sort the user's collection; bounded response size does not imply bounded query work for those options.

## Validation and benchmark

Use Node 22 (the CI runtime). The host's Node 26 currently breaks the existing JWT dependency before route tests can start.

```sh
cd server
npm ci
npm run build
node -r ts-node/register --test src/services/collection.test.ts src/services/collection-http.test.ts src/services/catalog-client.test.ts
cd ../client
npm ci --legacy-peer-deps
npm test -- --watchAll=false --runInBand
npx tsc --noEmit
```

`Collection performance` CI provisions a disposable MySQL 8.0 service, loads the repository bootstrap schema, runs the same pagination contract against MySQL, and runs `server/scripts/benchmark-collections.ts`. The benchmark refuses to run unless `DB_NAME=filmvault_test` and `COLLECTION_TEST_MYSQL=1`, connects only to localhost, and deletes fixture tables. Never point it at an application database.

Fixture: 10,000 synthetic movies, four users with 10 / 100 / 1,000 / 10,000 memberships, half rated. It saves engine version, host details, effective schema/indexes, first-run and 30-iteration warm p50/p95, serialized response bytes, and EXPLAIN ANALYZE plans for old full reads, first pages, and middle-of-collection continuation. Timings include driver decoding and DTO construction but exclude HTTP/browser/network geography. First-run timings are **not cold-cache measurements** because seeding and ANALYZE ran first. This is synthetic evidence, not a production traffic or latency claim.

## Rollout

The response envelope changes: ship the server and client together. Existing cached JavaScript expects an array at the private endpoint, so an independent API-only deployment would break old clients. A versioned endpoint or compatibility window is required if deployments cannot be coordinated. No live production deployment is implied by the benchmark or feature branch.

## Recorded result — September 14, 2026

[Successful CI run](https://github.com/andy98w/FilmVault/actions/runs/34903266101),
commit `4da151d`. [Raw measurements and plans](benchmarks/collections-mysql-2026-09-14.json).
MySQL 8.0.46, Node 22.23.2, GitHub Linux runner with four visible AMD EPYC 7763 CPUs
and roughly 16 GiB memory. All rows below use the same synthetic fixture described above.

| Collection rows | Old full read p50 / p95 ms | First 15 p50 / p95 ms | Middle page p50 / p95 ms | Full → first-page JSON bytes |
|---|---|---|---|---|
| 10 | 0.54 / 0.72 | 0.56 / 0.68 | 0.53 / 0.60 | 6,242 → 6,271 |
| 100 | 0.99 / 1.25 | 0.59 / 0.65 | 0.58 / 0.72 | 62,493 → 9,512 |
| 1,000 | 3.95 / 4.68 | 0.74 / 0.86 | 0.74 / 1.03 | 625,894 → 9,530 |
| 10,000 | 33.62 / 43.44 | 0.56 / 0.71 | 3.73 / 3.82 | 6,268,895 → 9,547 |

The result measures fetching a useful first page instead of the entire collection;
it is not a claim that reading all 10,000 rows became this much faster. Walking every
page adds round trips. Tiny collections show little benefit and a small envelope overhead.

EXPLAIN ANALYZE for the 10,000-row first page visits 16 membership rows before the limit.
The middle-page plan visits 5,016 index entries, then joins only the 16 qualifying rows.
MySQL chose an ordered index scan rather than an immediate range seek. Explicit user
ordering, removing the duplicate order expression, and selecting memberships in a
limited derived table did not remove that scan (plans retained in the raw artifact).
No optimizer override or redundant MySQL index was added. Do not claim constant-work
or O(page-size) deep reads from this result. Recheck plans on the deployment's actual
schema and distribution. MySQL documents this preference for ordered indexes with
LIMIT in its [optimizer reference](https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html).

The SQLite index adds another B-tree to maintain on membership inserts/deletes. An
in-memory SQLite 3.53.4 fixture with 10,000 memberships used 21 additional 4,096-byte
pages (86,016 bytes) for that index; this is a local allocation observation, not a
production storage estimate. Initial index creation can briefly block local writes.

Validation: 13 passing server/catalog/HTTP/SQLite tests, six passing MySQL contract
tests, five passing client tests, server build, client typecheck, and a successful
local optimized client build. No production database or deployment was changed.
