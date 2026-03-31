import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import EditCityForm from './EditCityForm';
import * as api from '../api';

const mockNavigate = jest.fn();

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const renderEditCityForm = () => {
  render(
    <MemoryRouter initialEntries={['/cities/CA/Los%20Angeles/edit']}>
      <Routes>
        <Route path="/cities/:stateCode/:cityName/edit" element={<EditCityForm />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  api.getCity.mockResolvedValue({
    data: {
      city_name: 'Los Angeles',
      state_code: 'CA',
      population: 3979576,
      area_km2: 1302,
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437,
      },
    },
  });
  api.updateCity.mockResolvedValue({ data: { ok: true } });
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads existing city data into the edit form', async () => {
  renderEditCityForm();

  expect(await screen.findByDisplayValue('3979576')).toBeInTheDocument();
  expect(screen.getByDisplayValue('34.0522')).toBeInTheDocument();
});

test('validates city coordinates before save', async () => {
  renderEditCityForm();

  const latitudeInput = await screen.findByLabelText(/Latitude/i);
  await userEvent.clear(latitudeInput);
  await userEvent.type(latitudeInput, '100');
  await userEvent.click(screen.getByRole('button', { name: /Save City/i }));

  expect(await screen.findByText(/Latitude must be between -90 and 90/i)).toBeInTheDocument();
  expect(api.updateCity).not.toHaveBeenCalled();
});

test('submits updated city data and redirects', async () => {
  renderEditCityForm();

  const populationInput = await screen.findByLabelText(/Population/i);
  await userEvent.clear(populationInput);
  await userEvent.type(populationInput, '4000000');
  await userEvent.click(screen.getByRole('button', { name: /Save City/i }));

  await waitFor(() => {
    expect(api.updateCity).toHaveBeenCalledWith('CA', 'Los Angeles', {
      population: 4000000,
      area_km2: 1302,
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437,
      },
    });
  });

  expect(await screen.findByRole('status')).toHaveTextContent(/City updated successfully/i);
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/cities');
  });
});
