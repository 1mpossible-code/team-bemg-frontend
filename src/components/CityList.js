import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { getCities, deleteCity } from '../api';
import { normalizeQueryParams } from '../utils/query';
import { buildSearchFromFilters, parseFiltersFromSearch } from '../utils/urlFilters';
import { formatCellValue } from '../utils/formatters';
import FilterBar from './FilterBar';
import Globe3D from './Globe3D';
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
  const [activeMarker, setActiveMarker] = useState(null);
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

  const createMarkerAvatar = useCallback((city) => {
    const initials = city.city_name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
    const hue = city.country_code
      .split('')
      .reduce((total, char) => total + char.charCodeAt(0), 0) % 360;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="hsl(${hue} 88% 62%)" />
            <stop offset="100%" stop-color="hsl(${(hue + 45) % 360} 76% 34%)" />
          </linearGradient>
        </defs>
        <rect width="72" height="72" rx="36" fill="url(#g)" />
        <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="24" font-weight="700">${initials}</text>
      </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, []);

  const globeMarkers = useMemo(() => {
    return cities
      .filter((city) => {
        const lat = city.coordinates?.latitude;
        const lng = city.coordinates?.longitude;

        return Number.isFinite(lat) && Number.isFinite(lng);
      })
      .sort((left, right) => (right.population || 0) - (left.population || 0))
      .slice(0, 14)
      .map((city) => ({
        lat: city.coordinates.latitude,
        lng: city.coordinates.longitude,
        src: createMarkerAvatar(city),
        label: city.city_name,
        size: Math.min(0.16, Math.max(0.08, Math.sqrt(city.population || 50000) / 12000)),
        city,
      }));
  }, [cities, createMarkerAvatar]);

  useEffect(() => {
    setActiveMarker(globeMarkers[0] || null);
  }, [globeMarkers]);

  const handleMarkerSelect = useCallback((marker) => {
    if (!marker?.city) {
      return;
    }

    setActiveMarker(marker);

    const nextFilters = {
      ...defaultFilters,
      name: marker.city.city_name,
      state_code: marker.city.state_code || '',
      country_code: marker.city.country_code || '',
    };

    setFilters(nextFilters);
    navigate({
      pathname: location.pathname,
      search: buildSearchFromFilters(nextFilters),
    });
  }, [location.pathname, navigate]);

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

  const ONE_MILLION = 1_000_000;


  const renderAvgPoplaitonValue = avgPopulation >= ONE_MILLION ? `${Math.floor(avgPopulation / ONE_MILLION)}M` : `${avgPopulation}K`;

  const mappableCities = globeMarkers.length;
  const largestMappedCity = globeMarkers[0]?.city || null;

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
            {renderAvgPoplaitonValue}
          </span>
        </div>
      </div>

      {mappableCities > 0 && (
        <section className="globe-panel">
          <div className="globe-copy">
            <span className="globe-eyebrow">Aceternity Globe3D</span>
            <h3>Global city pulse</h3>
            <p>
              Explore the biggest mapped cities in your dataset. Hover a marker for context,
              then click it to focus the table on that city.
            </p>

            <div className="globe-stats-grid">
              <div className="globe-stat-pill">
                <span>Plotted markers</span>
                <strong>{mappableCities}</strong>
              </div>
              <div className="globe-stat-pill">
                <span>Largest mapped city</span>
                <strong>{largestMappedCity?.city_name || 'N/A'}</strong>
              </div>
            </div>

            <div className="globe-active-card">
              <span className="globe-card-label">Active marker</span>
              <strong>{activeMarker?.city?.city_name || 'Hover or tap a city'}</strong>
              <p>
                {activeMarker?.city
                  ? `${activeMarker.city.state_code || 'N/A'}, ${activeMarker.city.country_code || 'N/A'} - Population ${(activeMarker.city.population || 0).toLocaleString()}`
                  : 'Pick a marker to filter the dashboard down to a specific city.'}
              </p>
            </div>
          </div>

          <div className="globe-visual-wrap">
            <Globe3D
              markers={globeMarkers}
              className="city-globe"
              config={{
                atmosphereColor: '#66c2ff',
                atmosphereIntensity: 0.95,
                bumpScale: 5,
                autoRotateSpeed: 0.35,
                showWireframe: true,
                enableZoom: true,
                minDistance: 5.8,
                maxDistance: 8,
              }}
              onMarkerClick={handleMarkerSelect}
              onMarkerHover={(marker) => {
                if (marker) {
                  setActiveMarker(marker);
                }
              }}
            />
          </div>
        </section>
      )}

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
