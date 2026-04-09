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

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText(/City Name/i), 'Los Angeles');
  await userEvent.type(screen.getByLabelText(/State Code/i), 'CA');
  await userEvent.type(screen.getByLabelText(/Country Code/i), 'US');
  await userEvent.type(screen.getByLabelText(/Population/i), '3979576');
  await userEvent.type(screen.getByLabelText(/Area \(km²\)/i), '1302');
  await userEvent.type(screen.getByLabelText(/Latitude/i), '34.0522');
  await userEvent.type(screen.getByLabelText(/Longitude/i), '-118.2437');
};

beforeEach(() => {
  api.createCity.mockResolvedValue({ data: { ok: true } });
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('rejects invalid coordinates before submission', async () => {
  render(<CreateCityForm />);

  await fillValidForm();
  const latitudeInput = screen.getByLabelText(/Latitude/i);
  await userEvent.clear(latitudeInput);
  await userEvent.type(latitudeInput, '100');

  await userEvent.click(screen.getByRole('button', { name: /Create City/i }));

  expect(await screen.findByText(/Latitude must be between -90 and 90/i)).toBeInTheDocument();
  expect(api.createCity).not.toHaveBeenCalled();
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
