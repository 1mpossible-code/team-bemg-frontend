import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import CountryList from './CountryList';
import * as api from '../api';

jest.mock('../api');

const mockCountries = [
  { country_code: 'US', name: 'United States', population: 331000000 },
  { country_code: 'CA', name: 'Canada', population: 38000000 }
];

beforeEach(() => {
  api.getCountries.mockResolvedValue({ data: mockCountries });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('shows loading state initially', () => {
  api.getCountries.mockImplementation(() => new Promise(() => {}));
  render(
    <MemoryRouter>
      <CountryList />
    </MemoryRouter>
  );
  expect(screen.getByText(/Loading countries/i)).toBeInTheDocument();
});

test('shows error state when fetch fails', async () => {
  api.getCountries.mockRejectedValue(new Error('Network error'));

  render(
    <MemoryRouter>
      <CountryList />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
});

test('renders country list when data loads', async () => {
  render(
    <MemoryRouter>
      <CountryList />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText(/Countries Dashboard/i)).toBeInTheDocument();
  });
  expect(screen.getByText(/United States/i)).toBeInTheDocument();
  expect(screen.getByText(/Canada/i)).toBeInTheDocument();
});
