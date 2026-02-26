import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getStates } from '../api';
import { normalizeQueryParams } from '../utils/query';
import { buildSearchFromFilters, parseFiltersFromSearch } from '../utils/urlFilters';
import FilterBar from './FilterBar';

const defaultFilters = {
  state_name: '',
  country_code: '',
  min_population: '',
  max_population: ''
};

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
    
    getStates(cleanParams)
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
          <button className="retry-btn" type="button" onClick={() => fetchData()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const attributes = Object.keys(states[0] || {});
  
  const filterConfig = [
    {
      name: 'state_name',
      label: 'State Name',
      type: 'text',
      value: filters.state_name,
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
      name: 'min_population',
      label: 'Min Population',
      type: 'number',
      value: filters.min_population,
      placeholder: 'e.g., 100000'
    },
    {
      name: 'max_population',
      label: 'Max Population',
      type: 'number',
      value: filters.max_population,
      placeholder: 'e.g., 50000000'
    }
  ];

  return (
    <div className="container">
      <h2>States Dashboard</h2>
      <p className="endpoint-badge">
        Showing {states.length} records from states
      </p>
      
      <FilterBar
        filters={filterConfig}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      
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
                  state.state_code && navigate(`/cities?state_code=${state.state_code}`)
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
