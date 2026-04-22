import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import CreateStateForm from './CreateStateForm';
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

test('loads country options from the API into the country dropdown', async () => {
  render(<CreateStateForm />);

  const countrySelect = screen.getByLabelText(/Country/i);

  await waitFor(() => expect(api.getCountries).toHaveBeenCalled());
  await waitFor(() => expect(countrySelect).not.toBeDisabled());

  expect(screen.getByRole('option', { name: /United States \(US\)/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Canada \(CA\)/i })).toBeInTheDocument();
  expect(countrySelect).toHaveValue('');
});

test('shows required field errors before submission, including country selection', async () => {
  render(<CreateStateForm />);
  await waitFor(() => expect(api.getCountries).toHaveBeenCalled());

  await userEvent.click(screen.getByRole('button', { name: /Create State/i }));

  expect(await screen.findByText(/State name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/State code is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Country code is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Capital is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Population is required/i)).toBeInTheDocument();
  expect(screen.getByText(/Area is required/i)).toBeInTheDocument();
  expect(api.createState).not.toHaveBeenCalled();
});

test('disables country select while countries are loading', async () => {
  let resolveCountries;
  api.getCountries.mockReturnValue(
    new Promise((resolve) => {
      resolveCountries = resolve;
    })
  );

  render(<CreateStateForm />);

  const countrySelect = screen.getByLabelText(/Country/i);
  expect(countrySelect).toBeDisabled();
  expect(screen.getByRole('option', { name: /Loading countries/i })).toBeInTheDocument();

  resolveCountries(mockCountries);

  await waitFor(() => expect(countrySelect).not.toBeDisabled());
  expect(screen.getByRole('option', { name: /United States \(US\)/i })).toBeInTheDocument();
});

test('shows a user-visible error and keeps country select disabled when countries fail to load', async () => {
  api.getCountries.mockRejectedValue(new Error('Network down'));

  render(<CreateStateForm />);

  expect(await screen.findByText(/Failed to load countries\. Please refresh and try again\./i)).toBeInTheDocument();

  const countrySelect = screen.getByLabelText(/Country/i);
  expect(countrySelect).toBeDisabled();
  expect(screen.getByRole('option', { name: /Countries unavailable/i })).toBeInTheDocument();
});

test('submits selected country_code in the payload and redirects', async () => {
  render(<CreateStateForm />);

  await waitFor(() => expect(screen.getByLabelText(/Country/i)).not.toBeDisabled());
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
