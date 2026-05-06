import React, { useCallback, useEffect, useState } from 'react';
import { getDevLogs } from '../api';

const DEV_LOGS_TOKEN_KEY = 'team-bemg-dev-logs-token';
const DEV_LOGS_LIMIT_KEY = 'team-bemg-dev-logs-limit';
const DEV_LOGS_AUTO_REFRESH_KEY = 'team-bemg-dev-logs-auto-refresh';
const DEFAULT_LOG_LIMIT = '50';

const getStoredLogLimit = () =>
  window.sessionStorage.getItem(DEV_LOGS_LIMIT_KEY) || DEFAULT_LOG_LIMIT;

const getStoredAutoRefresh = () =>
  window.sessionStorage.getItem(DEV_LOGS_AUTO_REFRESH_KEY) !== 'false';

const DevLogsPage = () => {
  const [token, setToken] = useState(() => window.sessionStorage.getItem(DEV_LOGS_TOKEN_KEY) || '');
  const [limit, setLimit] = useState(getStoredLogLimit);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(getStoredAutoRefresh);

  const loadLogs = useCallback(async () => {
    if (!token.trim()) {
      setError('Developer token is required');
      setLogs([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      window.sessionStorage.setItem(DEV_LOGS_TOKEN_KEY, token.trim());
      const response = await getDevLogs(Number(limit), token.trim());
      setLogs(response.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(DEV_LOGS_LIMIT_KEY, limit);
  }, [limit]);

  useEffect(() => {
    window.sessionStorage.setItem(
      DEV_LOGS_AUTO_REFRESH_KEY,
      String(autoRefresh)
    );
  }, [autoRefresh]);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const intervalId = window.setInterval(loadLogs, 5000);
    return () => window.clearInterval(intervalId);
  }, [autoRefresh, loadLogs]);

  return (
    <div className="container">
      <div className="list-header">
        <h2>Developer Logs</h2>
      </div>

      <div className="filter-bar">
        <div className="filter-inputs">
          <div className="filter-input-group">
            <label htmlFor="dev-token">Developer Token</label>
            <input
              id="dev-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste X-Dev-Token"
            />
          </div>
          <div className="filter-input-group">
            <label htmlFor="dev-log-limit">Log Limit</label>
            <select id="dev-log-limit" value={limit} onChange={(event) => setLimit(event.target.value)}>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="filter-input-group">
            <label htmlFor="dev-auto-refresh">Auto Refresh</label>
            <input
              id="dev-auto-refresh"
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
          </div>
        </div>
        <div className="filter-actions">
          <button type="button" className="btn btn-primary" onClick={loadLogs} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? <p className="field-error">{error}</p> : null}

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Visible Logs</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Errors</span>
          <span className="stat-value" style={{ color: '#991b1b' }}>{logs.filter((e) => e.level?.toUpperCase() === 'ERROR').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Criticals</span>
          <span className="stat-value" style={{ color: '#7f1d1d' }}>{logs.filter((e) => e.level?.toUpperCase() === 'CRITICAL').length}</span>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Level</th>
            <th>Logger</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={4}>{token.trim() ? 'No logs available.' : 'Enter a token to load logs.'}</td>
            </tr>
          ) : (
            logs.map((entry, index) => (
              <tr key={`${entry.timestamp}-${index}`} className={`log-${entry.level?.toLowerCase().replace('warning', 'warn')}`}>
                <td>{entry.timestamp}</td>
                <td>{entry.level}</td>
                <td>{entry.logger}</td>
                <td>{entry.message}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DevLogsPage;
