import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

const CityList = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/cities') 
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then((data) => {
        setCities(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading cities...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container">
      <h2>Cities</h2>
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