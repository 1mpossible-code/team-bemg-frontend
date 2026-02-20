import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getStatesAll } from '../api';

const formatAttributeName = (attribute) =>
  attribute
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const StateList = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getStatesAll()
      .then((res) => {
        setStates(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to fetch');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading states...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <p>Error: {error}</p>
          <button className="retry-btn" type="button" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const attributes = Object.keys(states[0] || {});

  return (
    <div className="container">
      <h2>States</h2>
      <p className="endpoint-badge">
        Showing {states.length} records from states
      </p>
      <div className="stats-grid">
        <div className="stat-card">
            <span className="stat-label">Total States</span>
            <span className="stat-value">{states.length}</span>
        </div>
        <div className="stat-card">
            <span className="stat-label">Total Population</span>
            <span className="stat-value">
            {(states.reduce((acc, curr) => acc + (curr.population || 0), 0) / 1000000).toFixed(1)}M
            </span>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            {attributes.map((attribute) => (
              <th key={attribute}>{formatAttributeName(attribute)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.length === 0 ? (
            <tr>
              <td colSpan={attributes.length || 1}>No states found.</td>
            </tr>
          ) : (
            states.map((state, index) => (
              <tr
                key={state.state_code || index}
                onClick={() =>
                  state.state_code && navigate(`/states?country_code=${state.state_code}`)
                }
                style={{ cursor: state.state_code ? 'pointer' : 'default' }}
              >
                {attributes.map((attribute) => (
                  <td key={attribute}>{formatCellValue(state[attribute])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StateList;
