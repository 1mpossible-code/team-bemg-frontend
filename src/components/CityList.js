import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getCities } from '../api';
import FilterBar from './FilterBar';

const formatAttributeName = (attribute) =>
  attribute
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const CityList = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    country_code: '',
    state_code: '',
    min_population: '',
    max_population: ''
  });
  const navigate = useNavigate();

  const fetchData = useCallback((params = {}) => {
    setLoading(true);
    setError(null);
    
    // Remove empty filters
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== '')
    );
    
    getCities(cleanParams)
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

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchData(filters);
  };

  const handleClear = () => {
    setFilters({
      name: '',
      country_code: '',
      state_code: '',
      min_population: '',
      max_population: ''
    });
    fetchData();
  };

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
          <button className="retry-btn" type="button" onClick={() => fetchData()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const attributes = Object.keys(cities[0] || {});
  const avgPopulation = cities.length > 0 
    ? Math.round(cities.reduce((acc, curr) => acc + (curr.population || 0), 0) / cities.length)
    : 0;
  
  const filterConfig = [
    {
      name: 'name',
      label: 'City Name',
      type: 'text',
      value: filters.name,
      placeholder: 'Search by name...'
    },
    {
      name: 'country_code',
      label: 'Country Code',
      type: 'text',
      value: filters.country_code,
      placeholder: 'e.g., US'
    },
    {
      name: 'state_code',
      label: 'State Code',
      type: 'text',
      value: filters.state_code,
      placeholder: 'e.g., CA'
    },
    {
      name: 'min_population',
      label: 'Min Population',
      type: 'number',
      value: filters.min_population,
      placeholder: 'e.g., 10000'
    },
    {
      name: 'max_population',
      label: 'Max Population',
      type: 'number',
      value: filters.max_population,
      placeholder: 'e.g., 10000000'
    }
  ];

  return (
    <div className="container">
      <h2>Cities Dashboard</h2>
      <p className="endpoint-badge">
        Showing {cities.length} records from cities
      </p>
      
      <FilterBar
        filters={filterConfig}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      
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
        <div className="stat-card">
            <span className="stat-label">Avg Population</span>
            <span className="stat-value">
            {(avgPopulation / 1000).toFixed(0)}K
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
          {cities.length === 0 ? (
            <tr>
              <td colSpan={attributes.length || 1}>No cities found.</td>
            </tr>
          ) : (
            cities.map((city, index) => (
              <tr
                key={city.city_code || index}
                onClick={() => navigate(`/cities/${city.city_code}`)}
                style={{ cursor: 'pointer' }}
              >
                {attributes.map((attribute) => (
                  <td key={attribute}>{formatCellValue(city[attribute])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CityList;