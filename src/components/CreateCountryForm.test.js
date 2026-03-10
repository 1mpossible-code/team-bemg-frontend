import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateCountryForm from './CreateCountryForm';
import * as api from '../api';

const mockNavigate = jest.fn();

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText(/Country Name/i), 'Canada');
  await userEvent.type(screen.getByLabelText(/Country Code/i), 'CA');
  await userEvent.selectOptions(screen.getByLabelText(/Continent/i), 'North America');
  await userEvent.type(screen.getByLabelText(/Capital/i), 'Ottawa');
  await userEvent.type(screen.getByLabelText(/Population/i), '39000000');
  await userEvent.type(screen.getByLabelText(/Area \(km²\)/i), '9984670');
};

beforeEach(() => {
  api.getCountry.mockRejectedValue({ response: { status: 404 } });
  api.createCountry.mockResolvedValue({ data: { ok: true } });
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('shows validation error for non-alphabetical country code', async () => {
  render(<CreateCountryForm />);

  await fillValidForm();
  const countryCodeInput = screen.getByLabelText(/Country Code/i);
  await userEvent.clear(countryCodeInput);
  await userEvent.type(countryCodeInput, 'U1');

  await userEvent.click(screen.getByRole('button', { name: /Create Country/i }));

  expect(await screen.findByText(/must be 2-3 alphabetical letters/i)).toBeInTheDocument();
  expect(api.createCountry).not.toHaveBeenCalled();
});

test('blocks duplicate country code and shows field error', async () => {
  api.getCountry.mockResolvedValue({ data: { country_code: 'CA' } });
  render(<CreateCountryForm />);

  await fillValidForm();
  await userEvent.click(screen.getByRole('button', { name: /Create Country/i }));

  expect(await screen.findByText(/Country code already exists/i)).toBeInTheDocument();
  expect(api.createCountry).not.toHaveBeenCalled();
});

test('shows timeout message when create request times out', async () => {
  api.createCountry.mockRejectedValue({ code: 'ECONNABORTED' });
  render(<CreateCountryForm />);

  await fillValidForm();
  await userEvent.click(screen.getByRole('button', { name: /Create Country/i }));

  expect(await screen.findByText(/Request timed out\. Please try again\./i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Create Country/i })).toBeEnabled();
  });
});

test('shows success feedback then navigates to home', async () => {
  render(<CreateCountryForm />);

  await fillValidForm();
  await userEvent.click(screen.getByRole('button', { name: /Create Country/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(/Country created successfully/i);
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
