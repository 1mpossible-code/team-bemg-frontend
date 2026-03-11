import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getStates, deleteState, getCities, deleteCity } from '../api';
import { normalizeQueryParams } from '../utils/query';
import { buildSearchFromFilters, parseFiltersFromSearch } from '../utils/urlFilters';
import { formatCellValue } from '../utils/formatters';
import FilterBar from './FilterBar';
import ConfirmModal from './ConfirmModal';

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


const StateList = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [stateToDelete, setStateToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteClick = (state) => {
    setStateToDelete(state);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!stateToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Fetch all cities for this state
      const citiesResponse = await getCities({ state_code: stateToDelete.state_code });
      const cities = citiesResponse.data;
      
      // Delete all cities in this state
      for (const city of cities) {
        await deleteCity(city.state_code, city.city_name);
      }
      
      // Finally, delete the state
      await deleteState(stateToDelete.state_code);
      
      setModalOpen(false);
      setStateToDelete(null);
      setIsDeleting(false);
      fetchData(filters);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete state and dependencies');
      setModalOpen(false);
      setStateToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setModalOpen(false);
    setStateToDelete(null);
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
      <div className="list-header">
        <h2>States Dashboard</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/states/create')}
        >
          Create State
        </button>
      </div>
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
            {states.length > 0 && <th>Actions</th>}
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
                  <td key={attribute}>{formatCellValue(state[attribute], attribute)}</td>
                ))}
                <td>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(state);
                    }}
                    aria-label="Delete state"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <ConfirmModal
        isOpen={modalOpen}
        title="Delete State"
        message={`Are you sure you want to delete ${stateToDelete?.state_name || 'this state'}? This will also delete all associated cities. This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default StateList;
