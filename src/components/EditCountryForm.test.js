import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import EditCountryForm from './EditCountryForm';
import * as api from '../api';

const mockNavigate = jest.fn();

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const renderEditCountryForm = () => {
  render(
    <MemoryRouter initialEntries={['/countries/US/edit']}>
      <Routes>
        <Route path="/countries/:countryCode/edit" element={<EditCountryForm />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  api.getContinents.mockResolvedValue({
    data: [{ continent_name: 'North America' }, { continent_name: 'Europe' }],
  });
  api.getCountry.mockResolvedValue({
    data: {
      country_name: 'United States',
      country_code: 'US',
      continent: 'North America',
      capital: 'Washington',
      population: 331000000,
      area_km2: 9833517,
    },
  });
  api.updateCountry.mockResolvedValue({ data: { ok: true } });
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads existing country data into the edit form', async () => {
  renderEditCountryForm();

  expect(await screen.findByDisplayValue('United States')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Washington')).toBeInTheDocument();
  expect(screen.getByDisplayValue('331000000')).toBeInTheDocument();
});

test('validates before submitting', async () => {
  renderEditCountryForm();

  const countryNameInput = await screen.findByLabelText(/Country Name/i);
  await userEvent.clear(countryNameInput);
  await userEvent.click(screen.getByRole('button', { name: /Save Country/i }));

  expect(await screen.findByText(/Country name is required/i)).toBeInTheDocument();
  expect(api.updateCountry).not.toHaveBeenCalled();
});

test('submits updated country data and redirects', async () => {
  renderEditCountryForm();

  const capitalInput = await screen.findByLabelText(/Capital/i);
  await userEvent.clear(capitalInput);
  await userEvent.type(capitalInput, 'New Washington');
  await userEvent.click(screen.getByRole('button', { name: /Save Country/i }));

  await waitFor(() => {
    expect(api.updateCountry).toHaveBeenCalledWith('US', expect.objectContaining({
      capital: 'New Washington',
      population: 331000000,
      area_km2: 9833517,
    }));
  });

  expect(await screen.findByRole('status')).toHaveTextContent(/Country updated successfully/i);
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
