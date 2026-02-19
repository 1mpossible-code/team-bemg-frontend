import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

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

  useEffect(() => {
    fetch('/states') 
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then((data) => {
        setStates(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading states...</div>;
  if (error) return <div>Error: {error}</div>;

  const attributes = Object.keys(states[0] || {});

  return (
    <div className="container">
      <h2>States</h2>
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
