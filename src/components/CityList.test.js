import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityList from './CityList';
import * as api from '../api';

const mockNavigate = jest.fn();
const mockLocation = { pathname: '/cities', search: '' };

jest.mock('../api');

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children }) => <div data-testid="circle-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

const mockCities = [
  {
    city_name: 'Los Angeles',
    state_code: 'CA',
    country_code: 'US',
    population: 3979576,
  },
  {
    city_name: 'Houston',
    state_code: 'TX',
    country_code: 'US',
    population: 2320268,
  },
];

beforeEach(() => {
  api.getCities.mockResolvedValue({ data: mockCities });
  mockNavigate.mockReset();
  mockLocation.pathname = '/cities';
  mockLocation.search = '';
});

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
  });
  jest.clearAllMocks();
});

const renderCityList = async () => {
  await act(async () => {
    render(<CityList />);
  });
};

test('shows loading state initially', async () => {
  api.getCities.mockImplementation(() => new Promise(() => {}));
  await renderCityList();
  expect(screen.getByText(/Loading cities/i)).toBeInTheDocument();
});

test('shows error state and retries fetch', async () => {
  api.getCities
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ data: mockCities });

  await renderCityList();

  expect(await screen.findByText(/Error:/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Retry/i }));

  await waitFor(() => {
    expect(screen.getByText(/^Cities Dashboard$/i)).toBeInTheDocument();
  });
  expect(api.getCities).toHaveBeenCalledTimes(2);
  expect(api.getCities).toHaveBeenNthCalledWith(2, {});
});

test('uses query string filters on initial load', async () => {
  mockLocation.search = '?state_code=CA&name=Los&min_population=10000';

  await renderCityList();

  await waitFor(() => {
    expect(api.getCities).toHaveBeenCalledWith({
      state_code: 'CA',
      name: 'Los',
      min_population: 10000,
    });
  });

  expect(await screen.findByText(/^Cities Dashboard$/i)).toBeInTheDocument();
});

test('searches with filters and clears query state', async () => {
  await renderCityList();

  await screen.findByText(/^Cities Dashboard$/i);

  await userEvent.type(screen.getByLabelText(/City Name/i), 'Los Angeles');
  await userEvent.type(screen.getByLabelText(/State Code/i), 'CA');
  await userEvent.click(screen.getByRole('button', { name: /Search/i }));

  const searchCall = mockNavigate.mock.calls.find(
    ([arg]) => arg && arg.pathname === '/cities' && typeof arg.search === 'string' && arg.search !== ''
  );

  expect(searchCall).toBeTruthy();
  expect(searchCall[0].search).toContain('name=Los+Angeles');
  expect(searchCall[0].search).toContain('state_code=CA');

  await userEvent.click(screen.getByRole('button', { name: /Clear/i }));

  expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/cities', search: '' });
});

test('renders city stats and empty state', async () => {
  api.getCities.mockResolvedValueOnce({ data: [] });
  await renderCityList();

  expect(await screen.findByText(/No cities found/i)).toBeInTheDocument();
  expect(screen.getByText(/Total Cities/i)).toBeInTheDocument();
  expect(screen.getByText(/Avg Population/i)).toBeInTheDocument();
});

test('clicking edit navigates to the city edit page', async () => {
  await renderCityList();

  const editButtons = await screen.findAllByRole('button', { name: /Edit city/i });
  await userEvent.click(editButtons[0]);

  expect(mockNavigate).toHaveBeenCalledWith('/cities/CA/Los Angeles/edit');
});
