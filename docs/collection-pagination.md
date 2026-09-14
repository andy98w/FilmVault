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
