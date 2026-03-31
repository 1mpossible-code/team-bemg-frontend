import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getCountries, deleteCountry, getStates, deleteState, getCities, deleteCity, getContinents } from '../api';
import { normalizeQueryParams } from '../utils/query';
import { buildSearchFromFilters, parseFiltersFromSearch } from '../utils/urlFilters';
import { formatCellValue } from '../utils/formatters';
import FilterBar from './FilterBar';
import ConfirmModal from './ConfirmModal';

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

const ONE_MILLION = 1_000_000;
const ONE_BILLION = 1_000_000_000;

const formatPopulationSummary = (population) => {
  if (population >= ONE_BILLION) {
    return `${(population / ONE_BILLION).toFixed(1)}B`;
  }

  if (population >= ONE_MILLION) {
    return `${(population / ONE_MILLION).toFixed(1)}M`;
  }

  return population.toLocaleString();
};


const CountryList = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [continentOptions, setContinentOptions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
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
    getContinents()
      .then((res) => setContinentOptions(res.data))
      .catch(() => {});
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

  const handleDeleteClick = (country) => {
    setCountryToDelete(country);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!countryToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Fetch all states for this country
      const statesResponse = await getStates({ country_code: countryToDelete.country_code });
      const states = statesResponse.data;
      
      // For each state, delete all its cities
      for (const state of states) {
        const citiesResponse = await getCities({ state_code: state.state_code });
        const cities = citiesResponse.data;
        
        // Delete all cities in this state
        for (const city of cities) {
          await deleteCity(city.state_code, city.city_name);
        }
        
        // Delete the state
        await deleteState(state.state_code);
      }
      
      // Finally, delete the country
      await deleteCountry(countryToDelete.country_code);
      
      setModalOpen(false);
      setCountryToDelete(null);
      setIsDeleting(false);
      fetchData(filters);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete country and dependencies');
      setModalOpen(false);
      setCountryToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setModalOpen(false);
    setCountryToDelete(null);
  };

  const sortedCountries = useMemo(() => {
    let sortableCountries = [...countries];
    if (sortConfig.key !== null) {
      sortableCountries.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCountries;
  }, [countries, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
  const totalPopulation = countries.reduce((acc, curr) => acc + (curr.population || 0), 0);
  
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
      options: [...continentOptions]
        .sort((a, b) => a.continent_name.localeCompare(b.continent_name))
        .map((c) => ({ value: c.continent_name, label: c.continent_name }))
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
            {formatPopulationSummary(totalPopulation)}
            </span>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            {attributes.map((attribute) => (
              <th 
                key={attribute}
                onClick={() => requestSort(attribute)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title={`Sort by ${formatAttributeName(attribute)}`}
              >
                {formatAttributeName(attribute)}
                {sortConfig.key === attribute ? (
                  sortConfig.direction === 'asc' ? ' ▲' : ' ▼'
                ) : null}
              </th>
            ))}
            {countries.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedCountries.length === 0 ? (
            <tr>
              <td colSpan={attributes.length || 1}>No countries found.</td>
            </tr>
          ) : (
            sortedCountries.map((country, index) => (
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
                <td>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(country);
                    }}
                    aria-label="Delete country"
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
        title="Delete Country"
        message={`Are you sure you want to delete ${countryToDelete?.country_name || 'this country'}? This will also delete all associated states and cities. This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CountryList;
