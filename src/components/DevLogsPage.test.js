import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevLogsPage from './DevLogsPage';
import * as api from '../api';

jest.mock('../api');

const DEV_LOGS_TOKEN_KEY = 'team-bemg-dev-logs-token';
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

const renderDevLogsPage = async () => {
  await act(async () => {
    render(<DevLogsPage />);
  });
};

test('shows a validation error and skips the API call when no token is available on mount', async () => {
  await renderDevLogsPage();

  expect(screen.getByText('Developer token is required')).toBeInTheDocument();
  expect(screen.getByText(/Enter a token to load logs/i)).toBeInTheDocument();
  expect(api.getDevLogs).not.toHaveBeenCalled();
});

test('restores the saved token from session storage and loads logs on mount', async () => {
  window.sessionStorage.setItem(DEV_LOGS_TOKEN_KEY, 'saved-token');

  await renderDevLogsPage();

  expect(screen.getByLabelText(/Developer Token/i)).toHaveValue('saved-token');

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(50, 'saved-token');
  });

  expect(await screen.findByText('developer log endpoint smoke test')).toBeInTheDocument();
});

test('loads dev logs after entering a token and saves it in session storage', async () => {
  await renderDevLogsPage();

  expect(screen.getByText(/Enter a token to load logs/i)).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/Developer Token/i), 'secret-token');
  await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(50, 'secret-token');
  });

  expect(await screen.findByText('developer log endpoint smoke test')).toBeInTheDocument();
  expect(window.sessionStorage.getItem(DEV_LOGS_TOKEN_KEY)).toBe('secret-token');
});

test('passes the selected log limit to the API when refreshing', async () => {
  await renderDevLogsPage();

  await userEvent.type(screen.getByLabelText(/Developer Token/i), 'secret-token');
  await userEvent.selectOptions(screen.getByLabelText(/Log Limit/i), '100');
  await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(100, 'secret-token');
  });
});

test('auto-refresh polls every five seconds when enabled and stops when disabled', async () => {
  jest.useFakeTimers();
  window.sessionStorage.setItem(DEV_LOGS_TOKEN_KEY, 'saved-token');

  await renderDevLogsPage();

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledTimes(1);
    expect(api.getDevLogs).toHaveBeenCalledWith(50, 'saved-token');
  });

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledTimes(2);
  });

  await act(async () => {
    screen.getByLabelText(/Auto Refresh/i).click();
  });

  await act(async () => {
    jest.advanceTimersByTime(10000);
  });

  expect(api.getDevLogs).toHaveBeenCalledTimes(2);
});
