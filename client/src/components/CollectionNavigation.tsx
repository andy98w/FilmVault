interface Props {
  page: number; nextCursor: string | null; loading: boolean; error: string;
  previous: () => void; next: () => void; reload: () => void;
}
export default function CollectionNavigation({ page, nextCursor, loading, error, previous, next, reload }: Props) {
  return <nav aria-label="Collection pages" style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '24px 0' }}>
    <button type="button" disabled={loading || page === 1} onClick={previous}>Previous</button>
    <span role="status">{loading ? 'Loading…' : `Page ${page}`}</span>
    <button type="button" disabled={loading || !!error || !nextCursor} onClick={next}>Next</button>
    {error && <span role="alert">{error} <button onClick={reload}>Retry</button></span>}
  </nav>;
}
