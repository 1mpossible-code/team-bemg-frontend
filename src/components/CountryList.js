import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getCountries } from '../api';
import { normalizeQueryParams } from '../utils/query';
import { buildSearchFromFilters, parseFiltersFromSearch } from '../utils/urlFilters';
import { formatCellValue } from '../utils/formatters';
import FilterBar from './FilterBar';

const defaultFilters = {
  country_name: '',
  continent: '',
  min_population: '',
  max_population: ''
};

const formatAttributeName = (attribute) =>
  attribute
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());


const CountryList = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchData = useCallback((params = {}) => {
    setLoading(true);
    setError(null);
    
    const cleanParams = normalizeQueryParams(params, [
      'min_population',
      'max_population'
    ]);
    
    getCountries(cleanParams)
      .then((res) => {
        setCountries(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to fetch');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (location.search) {
      const nextFilters = parseFiltersFromSearch(
        location.search,
        defaultFilters
      );
      setFilters(nextFilters);
      fetchData(nextFilters);
      return;
    }

    setFilters(defaultFilters);
    fetchData();
  }, [fetchData, location.search]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const search = buildSearchFromFilters(filters);
    navigate({ pathname: location.pathname, search });
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    navigate({ pathname: location.pathname, search: '' });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading countries...</p>
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

  const attributes = Object.keys(countries[0] || {});
  
  const filterConfig = [
    {
      name: 'country_name',
      label: 'Country Name',
      type: 'text',
      value: filters.country_name,
      placeholder: 'Search by name...'
    },
    {
      name: 'continent',
      label: 'Continent',
      type: 'select',
      value: filters.continent,
      options: [
        { value: 'Africa', label: 'Africa' },
        { value: 'Asia', label: 'Asia' },
        { value: 'Europe', label: 'Europe' },
        { value: 'North America', label: 'North America' },
        { value: 'South America', label: 'South America' },
        { value: 'Oceania', label: 'Oceania' },
        { value: 'Antarctica', label: 'Antarctica' }
      ]
    },
    {
      name: 'min_population',
      label: 'Min Population',
      type: 'number',
      value: filters.min_population,
      placeholder: 'e.g., 1000000'
    },
    {
      name: 'max_population',
      label: 'Max Population',
      type: 'number',
      value: filters.max_population,
      placeholder: 'e.g., 100000000'
    }
  ];

  return (
    <div className="container">
      <div className="list-header">
        <h2>Countries Dashboard</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/countries/create')}
        >
          Create Country
        </button>
      </div>
      <p className="endpoint-badge">
        Showing {countries.length} records from countries
      </p>
      
      <FilterBar
        filters={filterConfig}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      
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
            {attributes.map((attribute) => (
              <th key={attribute}>{formatAttributeName(attribute)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {countries.length === 0 ? (
            <tr>
              <td colSpan={attributes.length || 1}>No countries found.</td>
            </tr>
          ) : (
            countries.map((country, index) => (
              <tr
                key={country.country_code || index}
                onClick={() =>
                  country.country_code && navigate(`/states?country_code=${country.country_code}`)
                }
                style={{ cursor: country.country_code ? 'pointer' : 'default' }}
              >
                {attributes.map((attribute) => (
                  <td key={attribute}>{formatCellValue(country[attribute], attribute)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CountryList;
