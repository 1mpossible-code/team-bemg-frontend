import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StateList from './StateList';
import * as api from '../api';

const mockNavigate = jest.fn();
const mockLocation = { pathname: '/states', search: '' };

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const mockStates = [
  {
    state_code: 'CA',
    state_name: 'California',
    country_code: 'US',
    population: 39500000,
  },
  {
    state_code: 'TX',
    state_name: 'Texas',
    country_code: 'US',
    population: 29000000,
  },
];

beforeEach(() => {
  api.getStates.mockResolvedValue({ data: mockStates });
  mockNavigate.mockReset();
  mockLocation.pathname = '/states';
  mockLocation.search = '';
});

afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
  });
  jest.clearAllMocks();
});

const renderStateList = async () => {
  await act(async () => {
    render(<StateList />);
  });
};

test('shows loading state initially', async () => {
  api.getStates.mockImplementation(() => new Promise(() => {}));
  await renderStateList();
  expect(screen.getByText(/Loading states/i)).toBeInTheDocument();
});

test('shows error state and retries fetch', async () => {
  api.getStates
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ data: mockStates });

  await renderStateList();

  expect(await screen.findByText(/Error:/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Retry/i }));

  await waitFor(() => {
    expect(screen.getByText(/^States Dashboard$/i)).toBeInTheDocument();
  });
  expect(api.getStates).toHaveBeenCalledTimes(2);
  expect(api.getStates).toHaveBeenNthCalledWith(2, {});
});

test('uses query string filters on initial load', async () => {
  mockLocation.search = '?country_code=US&min_population=100000&state_name=Cal';

  await renderStateList();

  await waitFor(() => {
    expect(api.getStates).toHaveBeenCalledWith({
      country_code: 'US',
      min_population: 100000,
      state_name: 'Cal',
    });
  });

  expect(await screen.findByText(/^States Dashboard$/i)).toBeInTheDocument();
});

test('searches with filters and clears query state', async () => {
  await renderStateList();

  await screen.findByText(/^States Dashboard$/i);

  await userEvent.type(screen.getByLabelText(/State Name/i), 'Texas');
  await userEvent.type(screen.getByLabelText(/Country Code/i), 'US');
  await userEvent.click(screen.getByRole('button', { name: /Search/i }));

  const searchCall = mockNavigate.mock.calls.find(
    ([arg]) => arg && arg.pathname === '/states' && typeof arg.search === 'string' && arg.search !== ''
  );

  expect(searchCall).toBeTruthy();
  expect(searchCall[0].search).toContain('state_name=Texas');
  expect(searchCall[0].search).toContain('country_code=US');

  await userEvent.click(screen.getByRole('button', { name: /Clear/i }));

  expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/states', search: '' });
});

test('clicking a state row navigates to cities filtered by state code', async () => {
  await renderStateList();

  const stateCell = await screen.findByText(/California/i);
  await userEvent.click(stateCell.closest('tr'));

  expect(mockNavigate).toHaveBeenCalledWith('/cities?state_code=CA');
});

test('clicking edit navigates to the state edit page', async () => {
  await renderStateList();

  const editButtons = await screen.findAllByRole('button', { name: /Edit state/i });
  await userEvent.click(editButtons[0]);

  expect(mockNavigate).toHaveBeenCalledWith('/states/CA/edit');
});

test('loads delete impact preview and performs cascade state delete', async () => {
  api.getStateDeleteImpact.mockResolvedValue({
    data: { cities: 2, direct_dependency_count: 2, total_dependency_count: 2 },
  });
  api.deleteState.mockResolvedValue({});
  api.getStates.mockResolvedValueOnce({ data: mockStates }).mockResolvedValueOnce({ data: [mockStates[1]] });

  await renderStateList();

  const deleteButtons = await screen.findAllByRole('button', { name: /Delete state/i });
  await userEvent.click(deleteButtons[0]);

  expect(api.getStateDeleteImpact).toHaveBeenCalledWith('CA');
  expect(
    await screen.findByText(/cascade delete 2 associated cities \(direct dependencies: 2, total dependencies removed: 2\)/i)
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /^Delete$/i }));

  await waitFor(() => {
    expect(api.deleteState).toHaveBeenCalledWith('CA', { cascade: true });
  });
  await waitFor(() => {
    expect(api.getStates).toHaveBeenCalledTimes(2);
  });
});

test('shows zero-city delete impact preview when no dependent cities exist', async () => {
  api.getStateDeleteImpact.mockResolvedValue({
    data: { cities: 0, direct_dependency_count: 0, total_dependency_count: 0 },
  });

  await renderStateList();

  const deleteButtons = await screen.findAllByRole('button', { name: /Delete state/i });
  await userEvent.click(deleteButtons[0]);

  expect(
    await screen.findByText(/cascade delete 0 associated cities \(direct dependencies: 0, total dependencies removed: 0\)/i)
  ).toBeInTheDocument();
});
