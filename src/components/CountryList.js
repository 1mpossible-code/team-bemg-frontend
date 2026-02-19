import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

const CountryList = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/countries') 
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then((data) => {
        setCountries(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading countries...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container">
      <h2>Countries</h2>
      <div className="stats-grid">
        <div className="stat-card">
            <span className="stat-label">Total Countries</span>
            <span className="stat-value">{countries.length}</span>
        </div>
        <div className="stat-card">
            <span className="stat-label">Total Population</span>
            <span className="stat-value">
            {(countries.reduce((acc, curr) => acc + (curr.population || 0), 0) / 1000000).toFixed(1)}M
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
          {countries.map((country) => (
            <tr 
              key={country.country_code} 
              onClick={() => navigate(`/states?country_code=${country.country_code}`)}
              style={{ cursor: 'pointer' }}
            >
              <td>{country.country_name}</td>
              <td>{country.country_code}</td>
              <td>{country.population?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CountryList;