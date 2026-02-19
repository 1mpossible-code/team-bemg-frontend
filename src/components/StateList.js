import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

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
            <th>Name</th>
            <th>Code</th>
            <th>Population</th>
          </tr>
        </thead>
        <tbody>
          {states.map((state) => (
            <tr 
              key={state.states_code} 
              onClick={() => navigate(`/states?country_code=${state.state_code}`)}
              style={{ cursor: 'pointer' }}
            >
              <td>{state.state_name}</td>
              <td>{state.state_code}</td>
              <td>{state.population?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StateList;