import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from "../App";
import { screen, render, fireEvent } from '@testing-library/react';
import userEvent from "@testing-library/user-event";

const user = userEvent.setup();

const server = setupServer(
  rest.get('/api/movies', (req, res, ctx) => {
    return res(ctx.json([{ movieId: 1, title: 'Test Movie' }]));
  }),
  rest.get("/api/ratings", (req, res, ctx) => {
    return res(ctx.json([{
      ratingId: 1,
      score: 2,
      movieId: 1,
      movie: {
        title: "Test Movie"
      }
    }]))
  }),
  rest.get("/api/movies/:movieId", (req, res, ctx) => {
    return res(ctx.json({
      movieId: 1,
      title: "Test Movie",
      posterPath: 'poster.jpg',
      overview: "Test overview"
    }));
  }),
  rest.post("/api/auth", (req, res, ctx) => {
    return res(ctx.json({ success: "true" }));
  }),
  rest.post("/api/ratings", (req, res, ctx) => {
    return res(ctx.json({ ratingId: 1,score: 2 }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders homepage at /', async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /movie ratings app/i })).toBeInTheDocument();
});

describe('page navigation', () => {
  test('can navigate to all movies page', async () => {
    render(<App />)
    await user.click(screen.getByText(/all movies/i))
    expect(screen.getByText(/test movie/i)).toBeInTheDocument();
  });

  test('can navigate to the login page', async () => {
    render(<App />);
    await user.click(screen.getByRole("link", {name: /log in/i}));
    expect(screen.getByRole("heading", { name : /log in/i})).toBeInTheDocument();
  });

  test('can navigate to the user ratings page', async () => {
    server.use();
    render(<App />);
    expect(screen.getByRole("link", { name: /your ratings/i})).toBeInTheDocument();
  });

  test('can navigate to a movie detail page', async () => {
    render(<App/>);
    await user.click(screen.getByRole("link", { name: /all movies/i }));
    await user.click(screen.getByRole("link", { name: /test movie/i }));
    expect(screen.getByRole('heading', { name: /test movie/i })).toBeInTheDocument();
    // expect(screen.getByText(/test movie/i)).toBeInTheDocument();
  });
});

test('logging in redirects to user ratings page', async () => {
  server.use();
  render(<App />);
  await user.click(screen.getByRole("link", { name: /log in/i }));
  await user.type(screen.getByLabelText(/email/i), "test@test.com");
  await user.type(screen.getByLabelText(/password/i), "password");
  await user.click(screen.getByRole("button", { name: /log in/i }));
  expect(screen.getByRole("heading", { name: /your ratings/i })).toBeInTheDocument();
});

test('creating a rating redirects to user ratings page', async () => {
  server.use();
  render(<App />);
  await user.click(screen.getByRole("link", {name: /all movies/i }));
  await user.click(screen.getByRole("link", {name: /test movie/i }));
  await fireEvent.durationChange(screen.getByRole("combobox", {name: /score/i}, { target: {value: "3"}}));
  await user.click(screen.getByRole("button", { name: /submit/i }));
  expect(screen.getByRole("heading", { name: /your ratings/i }));
});
