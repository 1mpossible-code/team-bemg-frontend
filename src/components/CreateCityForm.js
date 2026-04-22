import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { createCity, getCountries, getStates } from '../api';

const initialForm = {
  city_name: '',
  state_code: '',
  country_code: '',
  population: '',
  area_km2: '',
  latitude: '',
  longitude: '',
};

const CreateCityForm = () => {
  const [form, setForm] = useState(initialForm);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState(null);
  const latestStatesRequestRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    setCountriesLoading(true);
    setCountriesError(null);

    getCountries()
      .then((res) => {
        setCountries(res.data);
      })
      .catch((err) => {
        setCountries([]);
        setCountriesError(err.message || 'Failed to load countries');
      })
      .finally(() => {
        setCountriesLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!form.country_code) {
      latestStatesRequestRef.current += 1;
      setStates([]);
      return;
    }

    const requestId = latestStatesRequestRef.current + 1;
    latestStatesRequestRef.current = requestId;
    const selectedCountryCode = form.country_code;

    getStates({ country_code: selectedCountryCode })
      .then((res) => {
        if (latestStatesRequestRef.current !== requestId) {
          return;
        }

        setStates(res.data);
      })
      .catch((err) => {
        if (latestStatesRequestRef.current !== requestId) {
          return;
        }

        console.error(err);
      });
  }, [form.country_code]);

  const validate = () => {
    const newErrors = {};

    if (!form.city_name.trim()) {
      newErrors.city_name = "City name is required";
    }
    if (!form.state_code.trim()) {
      newErrors.state_code = "State code is required";
    }
    if (!form.country_code.trim()) {
      newErrors.country_code = "Country code is required";
    }
    if (!form.population.trim()) {
      newErrors.population = "Population is required";
    }
    if (!form.area_km2.trim()) {
      newErrors.area_km2 = "Area is required";
    }
    if (!form.latitude.trim()) {
      newErrors.latitude = "Latitude is required";
    } else if (isNaN(form.latitude) || form.latitude < -90 || form.latitude > 90) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }
    if (!form.longitude.trim()) {
      newErrors.longitude = "Longitude is required";
    } else if (isNaN(form.longitude) || form.longitude < -180 || form.longitude > 180) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === 'country_code') {
        return {
          ...prev,
          country_code: value,
          state_code: '',
        };
      }

      return { ...prev, [name]: value };
    });

    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[name];

      if (name === 'country_code') {
        delete nextErrors.state_code;
      }

      return nextErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    const payload = {
      city_name: form.city_name,
      state_code: form.state_code,
      country_code: form.country_code,
      population: form.population !== '' ? Number(form.population) : undefined,
      area_km2: form.area_km2 !== '' ? Number(form.area_km2) : undefined,
      coordinates: {
        latitude: form.latitude !== '' ? Number(form.latitude) : undefined,
        longitude: form.longitude !== '' ? Number(form.longitude) : undefined,
      },
    };

    createCity(payload)
      .then(() => {
        navigate('/cities');
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to create city');
        setSubmitting(false);
      });
  };

  const handleCancel = () => {
    navigate('/cities');
  };

  return (
    <div className="container">
      <div className="create-form-wrapper">
        <h2>Create City</h2>

        <form className="create-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="city_name">City Name</label>
          <input
            id="city_name"
            name="city_name"
            type="text"
            value={form.city_name}
            onChange={handleChange}
            placeholder="e.g., New York"
            aria-invalid={!!errors.city_name}
            aria-describedby={errors.city_name ? "city_name-error" : undefined}
          />
          {errors.city_name && (
            <p id="city_name-error" className="field-error">
              {errors.city_name}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="country_code">Country</label>
          <select
            id="country_code"
            name="country_code"
            value={form.country_code}
            onChange={handleChange}
            aria-invalid={!!errors.country_code}
            aria-describedby={countriesError ? 'country_code-load-error' : undefined}
            disabled={countriesLoading || !!countriesError}
          >
            <option value="">
              {countriesLoading
                ? 'Loading countries...'
                : countriesError
                  ? 'Countries unavailable'
                  : 'Select a Country'}
            </option>
            {countries.map(c => (
              <option key={c.country_code} value={c.country_code}>
                {c.country_name} ({c.country_code})
              </option>
            ))}
          </select>
          {countriesError && (
            <p id="country_code-load-error" className="field-error">
              Failed to load countries. Please refresh and try again.
            </p>
          )}
          {errors.country_code && <p className="field-error">{errors.country_code}</p>}
        </div>
          
        <div className="form-group">
          <label htmlFor="state_code">State</label>
          <select
            id="state_code"
            name="state_code"
            value={form.state_code}
            onChange={handleChange}
            aria-invalid={!!errors.state_code}
            disabled={!form.country_code}
          >
            <option value="">Select a State</option>
            {states.map(s => (
              <option key={s.state_code} value={s.state_code}>
                {s.state_name} ({s.state_code})
              </option>
            ))}
          </select>
          {errors.state_code && <p className="field-error">{errors.state_code}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="population">Population</label>
          <input
            id="population"
            name="population"
            type="number"
            min="0"
            value={form.population}
            onChange={handleChange}
            placeholder="e.g., 8468000"
            aria-invalid={!!errors.population}
            aria-describedby={errors.population ? "population-error" : undefined}
          />
          {errors.population && (
            <p id="population-error" className="field-error">
              {errors.population}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="area_km2">Area (km²)</label>
          <input
            id="area_km2"
            name="area_km2"
            type="number"
            min="0"
            step="0.01"
            value={form.area_km2}
            onChange={handleChange}
            placeholder="e.g., 783.8"
            aria-invalid={!!errors.area_km2}
            aria-describedby={errors.area_km2 ? "area_km2-error" : undefined}
          />
          {errors.area_km2 && (
            <p id="area_km2-error" className="field-error">
              {errors.area_km2}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="latitude">Latitude</label>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={handleChange}
            placeholder="e.g., 40.7128"
            aria-invalid={!!errors.latitude}
            aria-describedby={errors.latitude ? "latitude-error" : undefined}
          />
          {errors.latitude && (
            <p id="latitude-error" className="field-error">
              {errors.latitude}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={handleChange}
            placeholder="e.g., -74.006"
            aria-invalid={!!errors.longitude}
            aria-describedby={errors.longitude ? "longitude-error" : undefined}
          />
          {errors.longitude && (
            <p id="longitude-error" className="field-error">
              {errors.longitude}
            </p>
          )}
        </div>

        {error && (
          <div className="form-error">
            <p>{error}</p>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create City'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCityForm;
