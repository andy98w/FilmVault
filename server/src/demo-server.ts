import express from 'express';
import cors from 'cors';

type Media = {
  MovieID: number;
  Title: string;
  PosterPath: string;
  BackdropPath: string;
  Overview: string;
  ReleaseDate: string;
  Runtime: number;
  Genres: { id: number; name: string }[];
  VoteAverage: number;
  VoteCount: number;
  media_type: 'movie' | 'tv';
};

const app = express();
const port = Number(process.env.PORT || 5001);
const origin = process.env.CLIENT_URL || 'http://127.0.0.1:3004';

app.use(cors({ origin, credentials: true }));
app.use(express.json());

const makeMedia = (
  id: number,
  title: string,
  year: number,
  rating: number,
  type: 'movie' | 'tv',
  overview: string,
  genres: string[],
): Media => ({
  MovieID: id,
  Title: title,
  PosterPath: `http://127.0.0.1:${port}/demo/posters/${id}.svg`,
  BackdropPath: `http://127.0.0.1:${port}/demo/backdrops/${id}.svg`,
  Overview: overview,
  ReleaseDate: `${year}-06-15T12:00:00`,
  Runtime: type === 'movie' ? 128 : 52,
  Genres: genres.map((name, index) => ({ id: id * 10 + index, name })),
  VoteAverage: rating,
  VoteCount: 1200 + id * 13,
  media_type: type,
});

const movies = [
  makeMedia(101, 'Perfect Days', 2023, 7.8, 'movie', 'A Tokyo caretaker finds a quiet rhythm in work, music, books, and the city around him.', ['Drama']),
  makeMedia(102, 'Past Lives', 2023, 7.9, 'movie', 'Two childhood friends reconnect in New York and reckon with the lives they might have shared.', ['Drama', 'Romance']),
  makeMedia(103, 'The Holdovers', 2023, 8.0, 'movie', 'A teacher, a student, and a cook spend a winter break together at an empty boarding school.', ['Comedy', 'Drama']),
  makeMedia(104, 'Anatomy of a Fall', 2023, 7.7, 'movie', 'A writer faces trial after her husband dies under uncertain circumstances.', ['Mystery', 'Drama']),
  makeMedia(105, 'The Zone of Interest', 2023, 7.4, 'movie', 'A family builds an ordinary domestic life beside the machinery of catastrophe.', ['History', 'Drama']),
  makeMedia(106, 'Dune: Part Two', 2024, 8.5, 'movie', 'Paul Atreides joins the Fremen while facing a choice between love and the fate of the universe.', ['Science Fiction', 'Adventure']),
];

const shows = [
  makeMedia(201, 'Shōgun', 2024, 8.7, 'tv', 'Power, faith, and survival collide in seventeenth-century Japan.', ['Drama', 'History']),
  makeMedia(202, 'Severance', 2022, 8.7, 'tv', 'Office workers undergo a procedure that separates their work memories from their personal lives.', ['Drama', 'Mystery']),
  makeMedia(203, 'The Bear', 2022, 8.6, 'tv', 'A young chef returns home to run his family sandwich shop.', ['Comedy', 'Drama']),
  makeMedia(204, 'Succession', 2018, 8.9, 'tv', 'A media dynasty turns succession planning into a family war.', ['Drama']),
  makeMedia(205, 'Dark', 2017, 8.7, 'tv', 'A missing child exposes a small town’s secrets across generations.', ['Mystery', 'Science Fiction']),
  makeMedia(206, 'Mr. Robot', 2015, 8.6, 'tv', 'A cybersecurity engineer is drawn into a plan to rewrite the financial order.', ['Drama', 'Thriller']),
];

const people = [
  { id: 301, name: 'Greta Lee', known_for_department: 'Acting', popularity: 87 },
  { id: 302, name: 'Hiroyuki Sanada', known_for_department: 'Acting', popularity: 92 },
  { id: 303, name: 'Celine Song', known_for_department: 'Directing', popularity: 74 },
  { id: 304, name: 'Ayo Edebiri', known_for_department: 'Acting', popularity: 90 },
  { id: 305, name: 'Denis Villeneuve', known_for_department: 'Directing', popularity: 89 },
  { id: 306, name: 'Kōji Yakusho', known_for_department: 'Acting', popularity: 71 },
].map((person) => ({
  ...person,
  profile_path: `http://127.0.0.1:${port}/demo/people/${person.id}.svg`,
  gender: '',
  media_type: 'person',
  known_for: [],
}));

let savedTitles = [
  { ...movies[1], Rating: 9 },
  { ...shows[1], Rating: 8 },
];

const hasDemoSession = (req: express.Request) => req.header('authorization') === 'Bearer filmvault-demo-token';

const palette: Record<number, [string, string]> = {
  1: ['#29465f', '#d99f6c'], 2: ['#7d8c73', '#e8d8bb'], 3: ['#6e2430', '#d6b56d'],
  4: ['#28344f', '#c3c8d4'], 5: ['#6a7468', '#c9a77b'], 6: ['#9b4e34', '#e9c46a'],
};

const xml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char] || char));
const colors = (id: number) => palette[(id % 6) + 1] || palette[1];

app.get('/demo/posters/:id.svg', (req, res) => {
  const id = Number(req.params.id);
  const media = [...movies, ...shows].find((item) => item.MovieID === id);
  const [ink, paper] = colors(id);
  const title = xml(media?.Title || 'FilmVault');
  res.type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750"><rect width="500" height="750" fill="${ink}"/><circle cx="390" cy="150" r="170" fill="${paper}" opacity=".86"/><path d="M-30 590L280 240l250 290v220H-30z" fill="#101c2c" opacity=".62"/><text x="42" y="606" fill="#fff" font-family="Arial,sans-serif" font-size="46" font-weight="700">${title}</text><text x="44" y="663" fill="${paper}" font-family="Arial,sans-serif" font-size="18" letter-spacing="5">FILMVAULT</text></svg>`);
});

app.get('/demo/backdrops/:id.svg', (req, res) => {
  const id = Number(req.params.id);
  const [ink, paper] = colors(id);
  res.type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="${ink}"/><circle cx="1260" cy="190" r="430" fill="${paper}" opacity=".72"/><path d="M0 900L710 170l890 730z" fill="#101c2c" opacity=".65"/></svg>`);
});

app.get('/demo/people/:id.svg', (req, res) => {
  const id = Number(req.params.id);
  const person = people.find((item) => item.id === id);
  const initials = xml((person?.name || 'FV').split(' ').map((part) => part[0]).join('').slice(0, 2));
  const [ink, paper] = colors(id);
  res.type('image/svg+xml').send(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="${ink}"/><circle cx="150" cy="144" r="72" fill="${paper}"/><text x="150" y="169" text-anchor="middle" fill="${ink}" font-family="Arial,sans-serif" font-size="64" font-weight="700">${initials}</text><path d="M40 400c12-100 72-148 110-148s98 48 110 148" fill="${paper}" opacity=".8"/></svg>`);
});

const withCast = (media: Media) => ({
  ...media,
  Cast: people.slice(0, 5).map((person, index) => ({ ...person, character: ['Lead', 'Mika', 'Nora', 'Sydney', 'Director'][index] })),
  Similar: (media.media_type === 'tv' ? shows : movies).filter((item) => item.MovieID !== media.MovieID).slice(0, 5),
});

app.get('/', (_req, res) => res.json({ status: 'online', mode: 'local-demo' }));
app.get('/api/auth/ping', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/login', (req, res) => {
  if (req.body.email !== 'demo@filmvault.local' || req.body.password !== 'filmvault') {
    return res.status(401).json({ message: 'Use the local demo credentials shown in the recording notes.' });
  }
  res.json({
    token: 'filmvault-demo-token',
    user: { id: 7, username: 'andy', email: req.body.email, profilePic: null, is_admin: 0 },
  });
});
app.post('/api/auth/logout', (_req, res) => res.json({ message: 'Signed out' }));
app.get('/api/users/me', (req, res) => {
  if (!hasDemoSession(req)) return res.status(401).json({ message: 'Not signed in' });
  res.json({ id: 7, Usernames: 'andy', Emails: 'demo@filmvault.local', ProfilePic: null, is_admin: 0 });
});
app.get('/api/users/top', (_req, res) => res.json([
  { id: 1, Usernames: 'framebyframe', ProfilePic: null, movie_count: 148, rating_count: 92 },
  { id: 2, Usernames: 'sundaymatinee', ProfilePic: null, movie_count: 116, rating_count: 107 },
  { id: 3, Usernames: 'aftercredits', ProfilePic: null, movie_count: 94, rating_count: 68 },
]));
app.get('/api/movies/top', (_req, res) => res.json({ results: movies, page: 1, total_pages: 1, total_results: movies.length }));
app.get('/api/movies/top-tv', (_req, res) => res.json({ results: shows, page: 1, total_pages: 1, total_results: shows.length }));
app.get('/api/movies/top-rated', (_req, res) => res.json({ results: [...movies].sort((a, b) => b.VoteAverage - a.VoteAverage), page: 1, total_pages: 1, total_results: movies.length }));
app.get('/api/movies/popular-people', (_req, res) => res.json({ results: people, page: 1, total_pages: 1, total_results: people.length }));
app.get('/api/movies/details/:id', (req, res) => {
  const media = [...movies, ...shows].find((item) => item.MovieID === Number(req.params.id));
  media ? res.json(withCast(media)) : res.status(404).json({ message: 'Title not found' });
});
app.get('/api/movies/person/:id', (req, res) => {
  const person = people.find((item) => item.id === Number(req.params.id));
  if (!person) return res.status(404).json({ message: 'Person not found' });
  res.json({ ...person, biography: `${person.name} is represented here with a local demo profile so the FilmVault interface can be reviewed without production services.`, birthday: '1980-01-01', deathday: null, place_of_birth: '', knownFor: movies.slice(0, 4).map((item) => ({ id: item.MovieID, title: item.Title, poster_path: item.PosterPath, media_type: item.media_type, character: '', release_date: item.ReleaseDate, vote_average: item.VoteAverage })) });
});
app.get('/api/movies/user/list', (req, res) => {
  if (!hasDemoSession(req)) return res.status(401).json({ message: 'Not signed in' });
  res.json(savedTitles);
});
app.post('/api/movies/add', (req, res) => {
  if (!hasDemoSession(req)) return res.status(401).json({ message: 'Not signed in' });
  const media = [...movies, ...shows].find((item) => item.MovieID === Number(req.body.movie_id));
  if (!media) return res.status(404).json({ message: 'Title not found' });
  if (!savedTitles.some((item) => item.MovieID === media.MovieID)) savedTitles.push({ ...media, Rating: 0 });
  res.status(201).json({ message: 'Added to your collection' });
});
app.delete('/api/movies/remove/:id', (req, res) => {
  if (!hasDemoSession(req)) return res.status(401).json({ message: 'Not signed in' });
  savedTitles = savedTitles.filter((item) => item.MovieID !== Number(req.params.id));
  res.json({ message: 'Removed from your collection' });
});
app.post('/api/movies/rate', (req, res) => {
  if (!hasDemoSession(req)) return res.status(401).json({ message: 'Not signed in' });
  savedTitles = savedTitles.map((item) => item.MovieID === Number(req.body.movie_id) ? { ...item, Rating: Number(req.body.rating) } : item);
  res.json({ message: 'Rating saved' });
});
app.get('/api/movies/search', (req, res) => {
  const query = String(req.query.query || '').toLowerCase();
  const type = String(req.query.type || 'multi');
  const catalog = type === 'person' ? people : [...movies, ...shows, ...people];
  const results = catalog.filter((item: any) => String(item.Title || item.name).toLowerCase().includes(query));
  res.json({ results, page: 1, total_pages: 1, total_results: results.length, query });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`FilmVault demo API listening on http://127.0.0.1:${port}`);
});
