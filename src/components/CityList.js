import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getCitiesAll } from '../api';

const CityList = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getCitiesAll()
      .then((res) => {
        setCities(res.data);
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
          <p>Loading cities...</p>
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

  return (
    <div className="container">
      <h2>Cities List</h2>
      <p className="endpoint-badge">
        Showing {cities.length} records from cities
      </p>
      <div className="stats-grid">
        <div className="stat-card">
            <span className="stat-label">Total Cities</span>
            <span className="stat-value">{cities.length}</span>
        </div>
        <div className="stat-card">
            <span className="stat-label">Total Population</span>
            <span className="stat-value">
            {(cities.reduce((acc, curr) => acc + (curr.population || 0), 0) / 1000000).toFixed(1)}M
            </span>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Population</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr 
              key={city.cities_code} 
              onClick={() => navigate(`/cities?country_code=${city.city_code}`)}
              style={{ cursor: 'pointer' }}
            >
              <td>{city.city_name}</td>
              <td>{city.population?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CityList;