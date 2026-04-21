import { act, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
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

jest.mock('./Globe3D', () => ({
  __esModule: true,
  default: ({ markers = [], onMarkerClick, onMarkerHover }) => (
    <div data-testid="globe-fallback">
      <p>Mock globe</p>
      <span>{markers.length} plotted markers</span>
      {markers.map((marker) => (
        <button
          key={`${marker.city?.state_code || 'none'}-${marker.city?.city_name || marker.label}`}
          type="button"
          onMouseEnter={() => onMarkerHover?.(marker)}
          onClick={() => onMarkerClick?.(marker)}
        >
          Select marker {marker.city?.city_name || marker.label}
        </button>
      ))}
    </div>
  ),
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
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437,
    },
  },
  {
    city_name: 'Houston',
    state_code: 'TX',
    country_code: 'US',
    population: 2320268,
    coordinates: {
      latitude: 29.7604,
      longitude: -95.3698,
    },
  },
];

const createCity = (index) => ({
  city_name: `City ${String(index).padStart(2, '0')}`,
  state_code: `S${String(index).padStart(2, '0')}`,
  country_code: 'US',
  population: index * 1000,
});

beforeEach(() => {
  api.getCities.mockResolvedValue({ data: mockCities });
  api.deleteCity.mockResolvedValue({});
  api.getStoredAccessTokenRole.mockReturnValue('admin');
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

test('uses query string filters on initial load and reflects them in inputs', async () => {
  mockLocation.search = '?state_code=CA&name=Los&min_population=10000&max_population=999999';

  await renderCityList();

  await waitFor(() => {
    expect(api.getCities).toHaveBeenCalledWith({
      state_code: 'CA',
      name: 'Los',
      min_population: 10000,
      max_population: 999999,
    });
  });

  expect(await screen.findByText(/^Cities Dashboard$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/City Name/i)).toHaveValue('Los');
  expect(screen.getByLabelText(/State Code/i)).toHaveValue('CA');
  expect(screen.getByLabelText(/Min Population/i)).toHaveValue(10000);
  expect(screen.getByLabelText(/Max Population/i)).toHaveValue(999999);
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

test('cancels a city delete without calling the delete API', async () => {
  await renderCityList();
  await screen.findByText(/^Cities Dashboard$/i);

  const deleteButtons = await screen.findAllByRole('button', { name: /Delete city/i });
  await userEvent.click(deleteButtons[0]);

  expect(screen.getByText(/Are you sure you want to delete Los Angeles/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));

  expect(screen.queryByText(/Are you sure you want to delete Los Angeles/i)).not.toBeInTheDocument();
  expect(api.deleteCity).not.toHaveBeenCalled();
  expect(api.getCities).toHaveBeenCalledTimes(1);
});

test('deletes a city after confirmation and refetches with current filters', async () => {
  mockLocation.search = '?state_code=CA&min_population=10000';
  api.getCities
    .mockResolvedValueOnce({ data: mockCities })
    .mockResolvedValueOnce({ data: [mockCities[1]] });

  await renderCityList();
  await screen.findByText(/^Cities Dashboard$/i);

  const deleteButtons = await screen.findAllByRole('button', { name: /Delete city/i });
  await userEvent.click(deleteButtons[0]);

  expect(screen.getByText(/Are you sure you want to delete Los Angeles/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }));

  await waitFor(() => {
    expect(api.deleteCity).toHaveBeenCalledWith('CA', 'Los Angeles');
  });

  await waitFor(() => {
    expect(api.getCities).toHaveBeenNthCalledWith(2, {
      state_code: 'CA',
      min_population: 10000,
    });
  });

  expect(screen.queryByText(/Are you sure you want to delete Los Angeles/i)).not.toBeInTheDocument();
});

test('shows delete error and closes the modal when delete fails', async () => {
  api.deleteCity.mockRejectedValueOnce(new Error('Delete failed'));

  await renderCityList();
  await screen.findByText(/^Cities Dashboard$/i);

  const deleteButtons = await screen.findAllByRole('button', { name: /Delete city/i });
  await userEvent.click(deleteButtons[0]);
  await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }));

  expect(await screen.findByText(/Error: Delete failed/i)).toBeInTheDocument();
  expect(screen.queryByText(/Are you sure you want to delete Los Angeles/i)).not.toBeInTheDocument();
  expect(api.getCities).toHaveBeenCalledTimes(1);
});

test('normalizes numeric query filters when location search changes and rerenders', async () => {
  const { rerender } = render(<CityList />);

  await screen.findByText(/^Cities Dashboard$/i);
  expect(api.getCities).toHaveBeenNthCalledWith(1, {});

  mockLocation.search = '?state_code=TX&min_population=12345&max_population=';
  api.getCities.mockResolvedValueOnce({ data: [mockCities[1]] });

  await act(async () => {
    rerender(<CityList />);
  });

  await waitFor(() => {
    expect(api.getCities).toHaveBeenNthCalledWith(2, {
      state_code: 'TX',
      min_population: 12345,
    });
  });

  expect(screen.getByLabelText(/State Code/i)).toHaveValue('TX');
  expect(screen.getByLabelText(/Min Population/i)).toHaveValue(12345);
  expect(screen.getByLabelText(/Max Population/i)).toHaveValue(null);
});

test('hovering and clicking a globe marker updates active marker details and navigates with marker filters', async () => {
  await renderCityList();
  await screen.findByText(/^Cities Dashboard$/i);

  expect(screen.getByText(/Largest mapped city/i)).toBeInTheDocument();
  expect(screen.getByText(/CA, US - Population 3,979,576/i)).toBeInTheDocument();

  const markerButton = screen.getByRole('button', { name: /Select marker Houston/i });
  await userEvent.hover(markerButton);

  await waitFor(() => {
    expect(screen.getByText(/TX, US - Population 2,320,268/i)).toBeInTheDocument();
  });

  await userEvent.click(markerButton);

  expect(mockNavigate).toHaveBeenCalledWith({
    pathname: '/cities',
    search: '?name=Houston&country_code=US&state_code=TX',
  });
});

test('renders globe panel summary from mapped cities only and highlights the largest mapped city', async () => {
  const globeCities = [
    {
      city_name: 'Mapped Major',
      state_code: 'MA',
      country_code: 'US',
      population: 5000000,
      coordinates: { latitude: 40.7128, longitude: -74.006 },
    },
    {
      city_name: 'Mapped Mid',
      state_code: 'MM',
      country_code: 'US',
      population: 1250000,
      coordinates: { latitude: 34.0522, longitude: -118.2437 },
    },
    {
      city_name: 'Unmapped Giant',
      state_code: 'UG',
      country_code: 'US',
      population: 9000000,
    },
  ];
  api.getCities.mockResolvedValueOnce({ data: globeCities });

  await renderCityList();
  await screen.findByText(/^Cities Dashboard$/i);

  expect(screen.getByText(/Global city pulse/i)).toBeInTheDocument();
  expect(screen.getByText('2 plotted markers')).toBeInTheDocument();

  const largestMappedCityPill = screen.getByText(/Largest mapped city/i).closest('.globe-stat-pill');
  expect(within(largestMappedCityPill).getByText('Mapped Major')).toBeInTheDocument();

  const activeMarkerCard = screen.getByText(/Active marker/i).closest('.globe-active-card');
  expect(within(activeMarkerCard).getByText('Mapped Major')).toBeInTheDocument();
  expect(within(activeMarkerCard).getByText(/MA, US - Population 5,000,000/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Select marker Unmapped Giant/i })).not.toBeInTheDocument();
});

test('sorts rows by selected column and paginates long result sets with page reset on sort', async () => {
  const paginatedCities = Array.from({ length: 51 }, (_, index) => createCity(index + 1));
  api.getCities.mockResolvedValueOnce({ data: paginatedCities });

  await renderCityList();
  await screen.findByText(/^Cities Dashboard$/i);

  expect(screen.getByText('City 01')).toBeInTheDocument();
  expect(screen.queryByText('City 51')).not.toBeInTheDocument();
  expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();

  await userEvent.click(screen.getByRole('button', { name: /Next/i }));

  expect(screen.getByText('City 51')).toBeInTheDocument();
  expect(screen.queryByText('City 01')).not.toBeInTheDocument();
  expect(screen.getByText(/Page 2 of 2/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Previous/i })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();

  await userEvent.click(screen.getByTitle(/Sort by City Name/i));

  expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
  expect(screen.getByText('City 01')).toBeInTheDocument();
  expect(screen.queryByText('City 51')).not.toBeInTheDocument();

  const cityNameHeader = screen.getByTitle(/Sort by City Name/i);
  await userEvent.click(cityNameHeader);

  const rows = screen.getAllByRole('row');
  const firstDataRow = rows[1];
  expect(within(firstDataRow).getByText('City 51')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Next/i }));
  await userEvent.click(screen.getByRole('button', { name: /Previous/i }));

  expect(screen.getByText(/Page 1 of 2/i)).toBeInTheDocument();
  expect(screen.getByText('City 51')).toBeInTheDocument();
});

test('hides city mutation controls for non-admin users', async () => {
  api.getStoredAccessTokenRole.mockReturnValue('user');
  await renderCityList();

  await waitFor(() => {
    expect(screen.getByText(/^Cities Dashboard$/i)).toBeInTheDocument();
  });

  expect(screen.queryByRole('button', { name: /Create City/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Edit city/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Delete city/i })).not.toBeInTheDocument();
});
