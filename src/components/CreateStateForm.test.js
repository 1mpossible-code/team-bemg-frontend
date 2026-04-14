import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateStateForm from './CreateStateForm';
import * as api from '../api';

const mockNavigate = jest.fn();

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const mockCountries = { data: [{ country_code: 'US', country_name: 'United States' }] };

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText(/State Name/i), 'California');
  await userEvent.type(screen.getByLabelText(/State Code/i), 'CA');
  await userEvent.selectOptions(screen.getByLabelText(/Country/i), 'US');
  await userEvent.type(screen.getByLabelText(/Capital/i), 'Sacramento');
  await userEvent.type(screen.getByLabelText(/Population/i), '39538223');
  await userEvent.type(screen.getByLabelText(/Area \(km²\)/i), '423970');
};

beforeEach(() => {
  api.getCountries.mockResolvedValue(mockCountries);
  api.createState.mockResolvedValue({ data: { ok: true } });
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('shows required field errors before submission', async () => {
  render(<CreateStateForm />);
  await waitFor(() => expect(api.getCountries).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Create State/i }));

  expect(await screen.findByText(/State name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/State code is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Country code is required/i)).toBeInTheDocument();
  expect(api.createState).not.toHaveBeenCalled();
});

test('submits numeric state fields and redirects', async () => {
  render(<CreateStateForm />);

  await fillValidForm();
  await userEvent.click(screen.getByRole('button', { name: /Create State/i }));

  await waitFor(() => {
    expect(api.createState).toHaveBeenCalledWith({
      state_name: 'California',
      state_code: 'CA',
      country_code: 'US',
      capital: 'Sacramento',
      population: 39538223,
      area_km2: 423970,
    });
  });

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/states');
  });
});
