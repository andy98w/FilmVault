/** Bounded, live keyset reads. Cursors are positions, never authorization. */
const keys = {
  dateAdded: 'um.id',
  title: 'm.title',
  rating: 'COALESCE(mr.rating, 0)',
  releaseDate: "COALESCE(CAST(m.release_date AS CHAR), '')",
} as const;
export class CollectionInputError extends Error {}
export interface Queryable { query(sql: string, params?: any[]): Promise<any> }
export interface CollectionOptions {
  tmdbId?: number; limit: number; sort: keyof typeof keys; direction: 'asc' | 'desc'; q: string;
  after?: { id: number; key: string | number };
}
export function parseCollectionQuery(userId: number, query: Record<string, unknown>): CollectionOptions {
  const fail = (): never => { throw new CollectionInputError('Invalid collection pagination parameters'); };
  const scalar = (name: string, fallback: string) => query[name] === undefined ? fallback : typeof query[name] === 'string' ? query[name] as string : fail();
  const rawLimit = scalar('limit', '15');
  if (!/^\d+$/.test(rawLimit)) fail();
  const limit = Number(rawLimit);
  const sort = scalar('sort', 'dateAdded');
  const direction = scalar('direction', 'desc');
  const q = scalar('q', '').trim();
  if (!Number.isSafeInteger(userId) || userId < 1 || limit < 1 || limit > 100 || !Object.prototype.hasOwnProperty.call(keys, sort) || !['asc', 'desc'].includes(direction) || q.length > 200) fail();
  const options: CollectionOptions = { limit, sort: sort as CollectionOptions['sort'], direction: direction as CollectionOptions['direction'], q };
  const tmdbId = scalar('tmdbId', '');
  if (tmdbId) {
    if (!/^\d+$/.test(tmdbId) || !Number.isSafeInteger(Number(tmdbId)) || Number(tmdbId) < 1) fail();
    options.tmdbId = Number(tmdbId);
  }
  const cursor = scalar('cursor', '');
  if (cursor) {
    try {
      if (cursor.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(cursor)) fail();
      const c = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (c.v !== 1 || c.user !== userId || c.sort !== sort || c.direction !== direction || c.q !== q || c.tmdbId !== options.tmdbId || !Number.isSafeInteger(c.id) || c.id < 1) fail();
      if (sort === 'dateAdded' || sort === 'rating') {
        if (!Number.isSafeInteger(c.key) || (sort === 'dateAdded' && c.key !== c.id) || (sort === 'rating' && (c.key < 0 || c.key > 100))) fail();
      } else if (typeof c.key !== 'string' || c.key.length > 1000) fail();
      options.after = { id: c.id, key: c.key };
    } catch { fail(); }
  }
  return options;
}
export function collectionQuery(userId: number, options: CollectionOptions) {
  const key = keys[options.sort];
  const op = options.direction === 'asc' ? '>' : '<';
  const params: any[] = [userId];
  let where = 'um.user_id = ?';
  if (options.tmdbId) { where += ' AND m.tmdb_id = ?'; params.push(options.tmdbId); }
  if (options.q) {
    // Escape literal wildcard characters so search remains a substring search.
    where += " AND LOWER(m.title) LIKE LOWER(?) ESCAPE '!'";
    params.push('%' + options.q.replace(/[!%_]/g, '!$&') + '%');
  }
  if (options.after) {
    if (options.sort === 'dateAdded') {
      where += ` AND um.id ${op} ?`; params.push(options.after.id);
    } else {
      where += ` AND (${key} ${op} ? OR (${key} = ? AND um.id ${op} ?))`;
      params.push(options.after.key, options.after.key, options.after.id);
    }
  }
  params.push(options.limit + 1);
  const sql = `SELECT m.id, m.tmdb_id, m.title, m.poster_path, m.overview, m.release_date, mr.rating, um.id AS collection_id, ${key} AS sort_key
FROM user_movies um JOIN movies m ON m.id = um.movie_id
LEFT JOIN movie_ratings mr ON mr.movie_id = um.movie_id AND mr.user_id = um.user_id
WHERE ${where} ORDER BY ${key} ${options.direction}, um.id ${options.direction} LIMIT ?`;
  return { sql, params };
}
export async function readCollection(db: Queryable, userId: number, options: CollectionOptions) {
  const { sql, params } = collectionQuery(userId, options);
  const [rows] = await db.query(sql, params);
  const hasMore = rows.length > options.limit;
  const selected = rows.slice(0, options.limit);
  const last = selected[selected.length - 1];
  const nextCursor = hasMore ? Buffer.from(JSON.stringify({ v: 1, tmdbId: options.tmdbId, user: userId, sort: options.sort, direction: options.direction, q: options.q, id: last.collection_id, key: last.sort_key })).toString('base64url') : null;
  return { movies: selected.map(({ sort_key, collection_id, ...movie }: any) => movie), nextCursor };
}

/** Temporary compatibility for cached clients. Remove only after client migration. */
export async function readCollectionResponse(db: Queryable, userId: number, query: Record<string, unknown>) {
  if (query.pagination === 'cursor') return readCollection(db, userId, parseCollectionQuery(userId, query));
  if (query.pagination !== undefined) throw new CollectionInputError('Unknown pagination format');
  const { sql, params } = collectionQuery(userId, parseCollectionQuery(userId, {}));
  const [rows] = await db.query(sql.replace(/ LIMIT \?$/, ''), params.slice(0, -1));
  return { movies: rows.map(({ sort_key, collection_id, ...movie }: any) => movie) };
}
