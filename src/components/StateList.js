import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getStates, deleteState, getStateDeleteImpact } from '../api';
import { normalizeQueryParams } from '../utils/query';
import { buildSearchFromFilters, parseFiltersFromSearch } from '../utils/urlFilters';
import { formatCellValue, formatPopulationSummary } from '../utils/formatters';
import FilterBar from './FilterBar';
import ConfirmModal from './ConfirmModal';
import { Pencil, Trash2, Plus } from 'lucide-react';

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

const formatDeleteImpactDetails = (impact) => {
  if (!impact) {
    return 'Loading delete impact...';
  }

  const cityCount = impact.cities ?? impact.total_dependency_count ?? 0;
  const directCount = impact.direct_dependency_count ?? cityCount;
  const totalCount = impact.total_dependency_count ?? cityCount;

  return `This will cascade delete ${cityCount} associated ${cityCount === 1 ? 'city' : 'cities'} (direct dependencies: ${directCount}, total dependencies removed: ${totalCount}).`;
};

const StateList = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [stateToDelete, setStateToDelete] = useState(null);
  const [deleteImpact, setDeleteImpact] = useState(null);
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

  const handleDeleteClick = async (state) => {
    setError(null);
    setStateToDelete(state);
    setDeleteImpact(null);
    setModalOpen(true);

    try {
      const impactResponse = await getStateDeleteImpact(state.state_code);
      setDeleteImpact(impactResponse.data);
    } catch (err) {
      setDeleteImpact(null);
      setModalOpen(false);
      setStateToDelete(null);
      setError(err.response?.data?.message || err.message || 'Failed to load delete impact');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!stateToDelete) return;

    setIsDeleting(true);

    try {
      await deleteState(stateToDelete.state_code, { cascade: true });

      setModalOpen(false);
      setStateToDelete(null);
      setDeleteImpact(null);
      fetchData(filters);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete state and dependencies');
      setModalOpen(false);
      setStateToDelete(null);
      setDeleteImpact(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setModalOpen(false);
    setStateToDelete(null);
    setDeleteImpact(null);
  };

  const sortedStates = useMemo(() => {
    let sortableStates = [...states];
    if (sortConfig.key !== null) {
      sortableStates.sort((a, b) => {
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
    return sortableStates;
  }, [states, sortConfig]);

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
          className="btn btn-primary btn-with-icon"
          onClick={() => navigate('/states/create')}
        >
          <Plus size={15} />
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
            {formatPopulationSummary(states.reduce((acc, curr) => acc + (curr.population || 0), 0))}
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
            {states.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedStates.length === 0 ? (
            <tr>
              <td colSpan={attributes.length || 1}>No states found.</td>
            </tr>
          ) : (
            sortedStates.map((state, index) => (
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
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn-icon btn-icon-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/states/${state.state_code}/edit`);
                      }}
                      aria-label="Edit state"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-icon-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(state);
                      }}
                      aria-label="Delete state"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <ConfirmModal
        isOpen={modalOpen}
        title="Delete State"
        message={`Are you sure you want to delete ${stateToDelete?.state_name || 'this state'}? This action cannot be undone.`}
        details={stateToDelete ? formatDeleteImpactDetails(deleteImpact) : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
        confirmDisabled={!deleteImpact}
      />
    </div>
  );
};

export default StateList;
