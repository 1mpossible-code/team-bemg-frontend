import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getCities, deleteCity } from '../api';
import { normalizeQueryParams } from '../utils/query';
import { buildSearchFromFilters, parseFiltersFromSearch } from '../utils/urlFilters';
import { formatCellValue } from '../utils/formatters';
import FilterBar from './FilterBar';
import CityMap from './CityMap'
import ConfirmModal from './ConfirmModal';

const defaultFilters = {
  name: '',
  country_code: '',
  state_code: '',
  min_population: '',
  max_population: ''
};

const formatAttributeName = (attribute) =>
  attribute
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());


const CityList = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState(null);
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

  const handleDeleteClick = (city) => {
    setCityToDelete(city);
    setModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!cityToDelete) return;
    
    setIsDeleting(true);
    deleteCity(cityToDelete.state_code, cityToDelete.city_name)
      .then(() => {
        setModalOpen(false);
        setCityToDelete(null);
        setIsDeleting(false);
        fetchData(filters);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to delete city');
        setModalOpen(false);
        setCityToDelete(null);
        setIsDeleting(false);
      });
  };

  const handleDeleteCancel = () => {
    setModalOpen(false);
    setCityToDelete(null);
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
      <div className="list-header">
        <h2>Cities Dashboard</h2>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/cities/create')}
        >
          Create City
        </button>
      </div>
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
      <CityMap cities=  {cities} />
      <table className="data-table">
        <thead>
          <tr>
            {attributes.map((attribute) => (
              <th key={attribute}>{formatAttributeName(attribute)}</th>
            ))}
            {cities.length > 0 && <th>Actions</th>}
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
                key={city.city_name && city.state_code ? `${city.state_code}-${city.city_name}` : index}
              >
                {attributes.map((attribute) => (
                  <td key={attribute}>{formatCellValue(city[attribute], attribute)}</td>
                ))}
                <td>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(city);
                    }}
                    aria-label="Delete city"
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
        title="Delete City"
        message={`Are you sure you want to delete ${cityToDelete?.city_name || 'this city'}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CityList;
