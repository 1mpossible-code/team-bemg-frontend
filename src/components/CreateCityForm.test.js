import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCityForm from './CreateCityForm';
import * as api from '../api';

const mockNavigate = jest.fn();

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const mockCountries = {
  data: [
    { country_code: 'US', country_name: 'United States' },
    { country_code: 'CA', country_name: 'Canada' },
  ],
};
const mockStates = {
  data: [{ state_code: 'CA', state_name: 'California', country_code: 'US' }],
};

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText(/City Name/i), 'Los Angeles');
  await screen.findByRole('option', { name: /United States/i });
  await userEvent.selectOptions(screen.getByLabelText(/Country/i), 'US');
  const stateOption = await screen.findByRole('option', { name: /California/i });
  await userEvent.selectOptions(screen.getByLabelText(/State/i), stateOption);
  await userEvent.type(screen.getByLabelText(/Population/i), '3979576');
  await userEvent.type(screen.getByLabelText(/Area \(km²\)/i), '1302');
  await userEvent.type(screen.getByLabelText(/Latitude/i), '34.0522');
  await userEvent.type(screen.getByLabelText(/Longitude/i), '-118.2437');
};

beforeEach(() => {
  api.getCountries.mockResolvedValue(mockCountries);
  api.getStates.mockResolvedValue(mockStates);
  api.createCity.mockResolvedValue({ data: { ok: true } });
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('shows countries in the dropdown after they load', async () => {
  render(<CreateCityForm />);

  const countrySelect = screen.getByLabelText(/Country/i);

  expect(countrySelect).toBeDisabled();
  expect(screen.getByRole('option', { name: /Loading countries/i })).toBeInTheDocument();

  await waitFor(() => expect(api.getCountries).toHaveBeenCalled());
  await waitFor(() => expect(countrySelect).not.toBeDisabled());

  expect(screen.getByRole('option', { name: /United States \(US\)/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Canada \(CA\)/i })).toBeInTheDocument();
});

test('shows a user-visible error when countries fail to load', async () => {
  api.getCountries.mockRejectedValue(new Error('Network down'));

  render(<CreateCityForm />);

  expect(await screen.findByText(/Failed to load countries\. Please refresh and try again\./i)).toBeInTheDocument();

  const countrySelect = screen.getByLabelText(/Country/i);
  expect(countrySelect).toBeDisabled();
  expect(screen.getByRole('option', { name: /Countries unavailable/i })).toBeInTheDocument();
  expect(api.getStates).not.toHaveBeenCalled();
});

test('rejects invalid coordinates before submission', async () => {
  render(<CreateCityForm />);

  await waitFor(() => expect(api.getCountries).toHaveBeenCalled());

  await fillValidForm();
  const latitudeInput = screen.getByLabelText(/Latitude/i);
  await userEvent.clear(latitudeInput);
  await userEvent.type(latitudeInput, '100');

  await userEvent.click(screen.getByRole('button', { name: /Create City/i }));

  expect(await screen.findByText(/Latitude must be between -90 and 90/i)).toBeInTheDocument();
  expect(api.createCity).not.toHaveBeenCalled();
});

test('keeps state dropdown disabled until a country is selected and fetches matching states', async () => {
  api.getStates.mockResolvedValueOnce({
    data: [{ state_code: 'CA', state_name: 'California', country_code: 'US' }],
  });

  render(<CreateCityForm />);

  const countrySelect = screen.getByLabelText(/Country/i);
  const stateSelect = screen.getByLabelText(/State/i);

  expect(stateSelect).toBeDisabled();
  expect(api.getStates).not.toHaveBeenCalled();

  await screen.findByRole('option', { name: /United States/i });
  await userEvent.selectOptions(countrySelect, 'US');

  await waitFor(() => {
    expect(api.getStates).toHaveBeenCalledWith({ country_code: 'US' });
  });
  expect(stateSelect).toBeEnabled();
  expect(await screen.findByRole('option', { name: /California/i })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: /Ontario/i })).not.toBeInTheDocument();
});

test('clears selected state and replaces options when country changes', async () => {
  api.getStates
    .mockResolvedValueOnce({ data: [{ state_code: 'CA', state_name: 'California', country_code: 'US' }] })
    .mockResolvedValueOnce({ data: [{ state_code: 'ON', state_name: 'Ontario', country_code: 'CA' }] });

  render(<CreateCityForm />);

  const countrySelect = screen.getByLabelText(/Country/i);
  const stateSelect = screen.getByLabelText(/State/i);

  await screen.findByRole('option', { name: /United States/i });
  await userEvent.selectOptions(countrySelect, 'US');
  await userEvent.selectOptions(stateSelect, await screen.findByRole('option', { name: /California/i }));
  expect(stateSelect).toHaveValue('CA');

  await userEvent.selectOptions(countrySelect, 'CA');

  expect(stateSelect).toHaveValue('');
  await waitFor(() => {
    expect(api.getStates).toHaveBeenNthCalledWith(2, { country_code: 'CA' });
  });
  expect(await screen.findByRole('option', { name: /Ontario/i })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: /California/i })).not.toBeInTheDocument();
});

test('clears state options and disables the state dropdown when country selection is reset', async () => {
  api.getStates.mockResolvedValueOnce({
    data: [{ state_code: 'CA', state_name: 'California', country_code: 'US' }],
  });

  render(<CreateCityForm />);

  const countrySelect = screen.getByLabelText(/Country/i);
  const stateSelect = screen.getByLabelText(/State/i);

  await screen.findByRole('option', { name: /United States/i });
  await userEvent.selectOptions(countrySelect, 'US');
  await userEvent.selectOptions(stateSelect, await screen.findByRole('option', { name: /California/i }));

  expect(stateSelect).toHaveValue('CA');
  expect(stateSelect).toBeEnabled();

  await userEvent.selectOptions(countrySelect, '');

  await waitFor(() => {
    expect(stateSelect).toHaveValue('');
    expect(stateSelect).toBeDisabled();
  });
  expect(screen.queryByRole('option', { name: /California/i })).not.toBeInTheDocument();
  expect(api.getStates).toHaveBeenCalledTimes(1);
});

test('requires choosing a new state after the country changes', async () => {
  api.getStates
    .mockResolvedValueOnce({ data: [{ state_code: 'TX', state_name: 'Texas', country_code: 'US' }] })
    .mockResolvedValueOnce({ data: [{ state_code: 'ON', state_name: 'Ontario', country_code: 'CA' }] });

  render(<CreateCityForm />);

  await userEvent.type(screen.getByLabelText(/City Name/i), 'Toronto');

  const countrySelect = screen.getByLabelText(/Country/i);
  const stateSelect = screen.getByLabelText(/State/i);

  await screen.findByRole('option', { name: /United States/i });
  await userEvent.selectOptions(countrySelect, 'US');
  await userEvent.selectOptions(stateSelect, await screen.findByRole('option', { name: /Texas/i }));
  await userEvent.selectOptions(countrySelect, 'CA');

  await userEvent.type(screen.getByLabelText(/Population/i), '2930000');
  await userEvent.type(screen.getByLabelText(/Area \(km²\)/i), '630.2');
  await userEvent.type(screen.getByLabelText(/Latitude/i), '43.6532');
  await userEvent.type(screen.getByLabelText(/Longitude/i), '-79.3832');
  await userEvent.click(screen.getByRole('button', { name: /Create City/i }));

  expect(await screen.findByText(/State code is required/i)).toBeInTheDocument();
  expect(api.createCity).not.toHaveBeenCalled();
});

test('submits the selected country_code and refreshed state_code after country changes', async () => {
  api.getStates
    .mockResolvedValueOnce({ data: [{ state_code: 'TX', state_name: 'Texas', country_code: 'US' }] })
    .mockResolvedValueOnce({ data: [{ state_code: 'ON', state_name: 'Ontario', country_code: 'CA' }] });

  render(<CreateCityForm />);

  await userEvent.type(screen.getByLabelText(/City Name/i), 'Toronto');

  const countrySelect = screen.getByLabelText(/Country/i);
  const stateSelect = screen.getByLabelText(/State/i);

  await screen.findByRole('option', { name: /United States/i });
  await userEvent.selectOptions(countrySelect, 'US');
  await userEvent.selectOptions(stateSelect, await screen.findByRole('option', { name: /Texas/i }));
  expect(stateSelect).toHaveValue('TX');

  await userEvent.selectOptions(countrySelect, 'CA');
  expect(stateSelect).toHaveValue('');

  await userEvent.selectOptions(stateSelect, await screen.findByRole('option', { name: /Ontario/i }));
  await userEvent.type(screen.getByLabelText(/Population/i), '2930000');
  await userEvent.type(screen.getByLabelText(/Area \(km²\)/i), '630.2');
  await userEvent.type(screen.getByLabelText(/Latitude/i), '43.6532');
  await userEvent.type(screen.getByLabelText(/Longitude/i), '-79.3832');

  await userEvent.click(screen.getByRole('button', { name: /Create City/i }));

  await waitFor(() => {
    expect(api.createCity).toHaveBeenCalledWith({
      city_name: 'Toronto',
      state_code: 'ON',
      country_code: 'CA',
      population: 2930000,
      area_km2: 630.2,
      coordinates: {
        latitude: 43.6532,
        longitude: -79.3832,
      },
    });
  });
});

test('ignores stale state responses when countries are changed quickly', async () => {
  let resolveUsStates;
  let resolveCaStates;

  api.getStates.mockImplementation(({ country_code }) => new Promise((resolve) => {
    if (country_code === 'US') {
      resolveUsStates = resolve;
      return;
    }

    if (country_code === 'CA') {
      resolveCaStates = resolve;
    }
  }));

  render(<CreateCityForm />);

  const countrySelect = screen.getByLabelText(/Country/i);
  const stateSelect = screen.getByLabelText(/State/i);

  await screen.findByRole('option', { name: /United States/i });
  await userEvent.selectOptions(countrySelect, 'US');
  await userEvent.selectOptions(countrySelect, 'CA');

  await waitFor(() => {
    expect(api.getStates).toHaveBeenNthCalledWith(1, { country_code: 'US' });
    expect(api.getStates).toHaveBeenNthCalledWith(2, { country_code: 'CA' });
  });

  resolveCaStates({ data: [{ state_code: 'ON', state_name: 'Ontario', country_code: 'CA' }] });
  expect(await screen.findByRole('option', { name: /Ontario/i })).toBeInTheDocument();

  resolveUsStates({ data: [{ state_code: 'CA', state_name: 'California', country_code: 'US' }] });

  await waitFor(() => {
    expect(stateSelect).toHaveValue('');
    expect(screen.getByRole('option', { name: /Ontario/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /California/i })).not.toBeInTheDocument();
  });
});

test('submits nested city coordinates and redirects', async () => {
  render(<CreateCityForm />);

  await fillValidForm();
  await userEvent.click(screen.getByRole('button', { name: /Create City/i }));

  await waitFor(() => {
    expect(api.createCity).toHaveBeenCalledWith({
      city_name: 'Los Angeles',
      state_code: 'CA',
      country_code: 'US',
      population: 3979576,
      area_km2: 1302,
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437,
      },
    });
  });

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/cities');
  });
});

test('shows the API error without navigating away when city creation fails', async () => {
  api.createCity.mockRejectedValue({ response: { data: { message: 'City already exists' } } });

  render(<CreateCityForm />);

  await fillValidForm();
  await userEvent.click(screen.getByRole('button', { name: /Create City/i }));

  expect(await screen.findByText(/City already exists/i)).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /Create City/i })).toBeEnabled();
});
