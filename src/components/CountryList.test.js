import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CountryList from './CountryList';
import * as api from '../api';

const mockNavigate = jest.fn();

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '' }),
}));

const mockCountries = [
  { country_code: 'US', country_name: 'United States', population: 331000000 },
  { country_code: 'CA', country_name: 'Canada', population: 38000000 }
];

beforeEach(() => {
  api.getCountries.mockResolvedValue({ data: mockCountries });
  api.getContinents.mockResolvedValue({ data: [] });
  api.getStoredAccessTokenRole.mockReturnValue('admin');
  api.getCountryDeleteImpact.mockResolvedValue({
    data: {
      states: 2,
      cities: 5,
      direct_dependency_count: 2,
      total_dependency_count: 7,
    }
  });
  api.deleteCountry.mockResolvedValue({});
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

const renderCountryList = async () => {
  await act(async () => {
    render(
      <CountryList />
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

test('clicking edit navigates to the country edit page', async () => {
  await renderCountryList();

  const editButtons = await screen.findAllByRole('button', { name: /Edit country/i });
  await userEvent.click(editButtons[0]);

  expect(mockNavigate).toHaveBeenCalledWith('/countries/US/edit');
});

test('shows delete impact preview when opening delete confirmation', async () => {
  await renderCountryList();

  const deleteButtons = await screen.findAllByRole('button', { name: /Delete country/i });
  await userEvent.click(deleteButtons[0]);

  await waitFor(() => {
    expect(api.getCountryDeleteImpact).toHaveBeenCalledWith('US');
  });

  expect(screen.getByText('Delete Country')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText('Are you sure you want to delete "United States"? This action cannot be undone.')).toBeInTheDocument();
  });
  expect(
    screen.getByText('This will also delete 2 state(s) and 5 city/cities (direct dependencies: 2, total dependencies removed: 7).')
  ).toBeInTheDocument();
});

test('confirms deletion with a single cascade delete request', async () => {
  await renderCountryList();

  const deleteButtons = await screen.findAllByRole('button', { name: /Delete country/i });
  await userEvent.click(deleteButtons[0]);

  const confirmButton = await screen.findByRole('button', { name: 'Delete' });
  await waitFor(() => {
    expect(confirmButton).toBeEnabled();
  });
  await userEvent.click(confirmButton);

  await waitFor(() => {
    expect(api.deleteCountry).toHaveBeenCalledWith('US', { cascade: true });
  });
  expect(api.getCountries).toHaveBeenCalledTimes(2);
});

test('hides country mutation controls for non-admin users', async () => {
  api.getStoredAccessTokenRole.mockReturnValue('user');
  await renderCountryList();

  await waitFor(() => {
    expect(screen.getByText(/Countries Dashboard/i)).toBeInTheDocument();
  });

  expect(screen.queryByRole('button', { name: /Create Country/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Edit country/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Delete country/i })).not.toBeInTheDocument();
});
