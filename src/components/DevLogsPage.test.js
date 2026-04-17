import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevLogsPage from './DevLogsPage';
import * as api from '../api';

jest.mock('../api');

beforeEach(() => {
  window.sessionStorage.clear();
  api.getDevLogs.mockResolvedValue({
    data: {
      logs: [
        {
          timestamp: '2026-04-17T12:00:00Z',
          level: 'WARNING',
          logger: 'server.tests.dev_logs',
          message: 'developer log endpoint smoke test',
        },
      ],
    },
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads dev logs after entering a token and saves it in session storage', async () => {
  await act(async () => {
    render(<DevLogsPage />);
  });

  expect(screen.getByText(/Enter a token to load logs/i)).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText(/Developer Token/i), 'secret-token');
  await userEvent.click(screen.getByRole('button', { name: /Refresh/i }));

  await waitFor(() => {
    expect(api.getDevLogs).toHaveBeenCalledWith(50, 'secret-token');
  });

  expect(await screen.findByText('developer log endpoint smoke test')).toBeInTheDocument();
  expect(window.sessionStorage.getItem('team-bemg-dev-logs-token')).toBe('secret-token');
});
