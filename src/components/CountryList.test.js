import { act, render, screen, waitFor } from '@testing-library/react';
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

const renderCountryList = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <CountryList />
      </MemoryRouter>
    );
  });
};

test('shows loading state initially', async () => {
  api.getCountries.mockImplementation(() => new Promise(() => {}));
  await renderCountryList();
  expect(screen.getByText(/Loading countries/i)).toBeInTheDocument();
});

test('shows error state when fetch fails', async () => {
  api.getCountries.mockRejectedValue(new Error('Network error'));

  await renderCountryList();

  await waitFor(() => {
    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
  });
  expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
});

test('renders country list when data loads', async () => {
  await renderCountryList();

  await waitFor(() => {
    expect(screen.getByText(/Countries Dashboard/i)).toBeInTheDocument();
  });
  expect(screen.getByText(/United States/i)).toBeInTheDocument();
  expect(screen.getByText(/Canada/i)).toBeInTheDocument();
});
