import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevLogsPage from './DevLogsPage';
import * as api from '../api';

jest.mock('../api');

const DEV_LOGS_TOKEN_KEY = 'team-bemg-dev-logs-token';
const DEV_LOGS_LIMIT_KEY = 'team-bemg-dev-logs-limit';
const DEV_LOGS_AUTO_REFRESH_KEY = 'team-bemg-dev-logs-auto-refresh';
const mockLogs = [
  {
    timestamp: '2026-04-17T12:00:00Z',
    level: 'WARNING',
    logger: 'server.tests.dev_logs',
    message: 'developer log endpoint smoke test',
  },
];

beforeEach(() => {
  window.sessionStorage.clear();
  api.getDevLogs.mockResolvedValue({
    data: {
      logs: mockLogs,
    },
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

const renderDevLogsPage = () => {
  render(<DevLogsPage />);
};

test('shows a validation error and skips the API call when no token is available on mount', async () => {
  renderDevLogsPage();

  expect(screen.getByText('Developer token is required')).toBeInTheDocument();
  expect(screen.getByText(/Enter a token to load logs/i)).toBeInTheDocument();
  expect(api.getDevLogs).not.toHaveBeenCalled();
});

test('restores saved token and preferences from session storage', async () => {
  window.sessionStorage.setItem(DEV_LOGS_TOKEN_KEY, 'saved-token');
  window.sessionStorage.setItem(DEV_LOGS_LIMIT_KEY, '100');
  window.sessionStorage.setItem(DEV_LOGS_AUTO_REFRESH_KEY, 'false');

  renderDevLogsPage();

  expect(screen.getByLabelText(/Developer Token/i)).toHaveValue('saved-token');
  expect(screen.getByLabelText(/Log Limit/i)).toHaveValue('100');
  expect(screen.getByLabelText(/Auto Refresh/i)).not.toBeChecked();

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(100, 'saved-token');
  });

  expect(await screen.findByText('developer log endpoint smoke test')).toBeInTheDocument();
});

test('loads dev logs after entering a token and saves it in session storage', async () => {
  renderDevLogsPage();

  expect(screen.getByText(/Enter a token to load logs/i)).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/Developer Token/i), 'secret-token');
  await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(50, 'secret-token');
  });

  expect(await screen.findByText('developer log endpoint smoke test')).toBeInTheDocument();
  expect(window.sessionStorage.getItem(DEV_LOGS_TOKEN_KEY)).toBe('secret-token');
});

test('persists the selected log limit when it changes', async () => {
  renderDevLogsPage();

  await userEvent.selectOptions(screen.getByLabelText(/Log Limit/i), '100');

  expect(window.sessionStorage.getItem(DEV_LOGS_LIMIT_KEY)).toBe('100');
});

test('passes the selected log limit to the API when refreshing', async () => {
  renderDevLogsPage();

  await userEvent.type(screen.getByLabelText(/Developer Token/i), 'secret-token');
  await userEvent.selectOptions(screen.getByLabelText(/Log Limit/i), '100');
  await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(100, 'secret-token');
  });
});

test('persists auto-refresh when toggled off', async () => {
  renderDevLogsPage();

  await userEvent.click(screen.getByLabelText(/Auto Refresh/i));

  expect(window.sessionStorage.getItem(DEV_LOGS_AUTO_REFRESH_KEY)).toBe('false');
});

test('auto-refresh polls every five seconds when enabled and stops when disabled', async () => {
  jest.useFakeTimers();
  window.sessionStorage.setItem(DEV_LOGS_TOKEN_KEY, 'saved-token');

  renderDevLogsPage();

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(50, 'saved-token');
  });
  expect(api.getDevLogs).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(5000);

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledTimes(2);
  });

  await userEvent.click(screen.getByLabelText(/Auto Refresh/i));
  jest.advanceTimersByTime(10000);

  expect(api.getDevLogs).toHaveBeenCalledTimes(2);
});
