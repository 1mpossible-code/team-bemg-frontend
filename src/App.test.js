import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as api from './api';

// Mock the API module
jest.mock('./api');

const mockCountries = [
  { country_code: 'US', name: 'United States', population: 331000000 },
  { country_code: 'CA', name: 'Canada', population: 38000000 },
];

const mockStates = [
  { state_code: 'CA', name: 'California', population: 39500000 },
  { state_code: 'TX', name: 'Texas', population: 29000000 },
];

const mockCities = [
  { name: 'Los Angeles', population: 3979576 },
  { name: 'Houston', population: 2320268 },
];

beforeEach(() => {
  // Mock all API functions to return resolved promises
  api.getCountries.mockResolvedValue({ data: mockCountries });
  api.getStates.mockResolvedValue({ data: mockStates });
  api.getCities.mockResolvedValue({ data: mockCities });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders app title', () => {
  render(<App />);
  const heading = screen.getByText(/Geographic Database/i);
  expect(heading).toBeInTheDocument();
});

test('renders nav links', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /countries/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /states/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /cities/i })).toBeInTheDocument();
});

test('navigates to Countries and shows dashboard', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /countries/i }));
  await waitFor(() => {
    expect(screen.getByText(/^Countries Dashboard$/i)).toBeInTheDocument();
  });
});

test('navigates to States and shows list', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /states/i }));
  await waitFor(() => {
    expect(screen.getByText(/^States Dashboard$/i)).toBeInTheDocument();
  });
});

test('navigates to Cities and shows list', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /cities/i }));
  await waitFor(() => {
    expect(screen.getByText(/^Cities Dashboard$/i)).toBeInTheDocument();
  });
});
