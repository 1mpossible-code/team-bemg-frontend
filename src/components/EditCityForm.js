import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getCity, updateCity } from '../api';

const initialForm = {
  population: '',
  area_km2: '',
  latitude: '',
  longitude: '',
};

const REDIRECT_DELAY_MS = 600;

const EditCityForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const redirectTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { stateCode, cityName } = useParams();

  useEffect(() => {
    getCity(stateCode, cityName)
      .then((res) => {
        const city = res.data;
        setForm({
          population: city.population?.toString() || '',
          area_km2: city.area_km2?.toString() || '',
          latitude: city.coordinates?.latitude?.toString() || '',
          longitude: city.coordinates?.longitude?.toString() || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Failed to load city');
        setLoading(false);
      });
  }, [cityName, stateCode]);

  useEffect(() => () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
  }, []);

  const validate = (formValues) => {
    const nextErrors = {};

    if (!formValues.population.trim()) {
      nextErrors.population = 'Population is required';
    } else if (Number.isNaN(Number(formValues.population)) || Number(formValues.population) < 0) {
      nextErrors.population = 'Population must be a non-negative number';
    }
    if (!formValues.area_km2.trim()) {
      nextErrors.area_km2 = 'Area is required';
    } else if (Number.isNaN(Number(formValues.area_km2)) || Number(formValues.area_km2) < 0) {
      nextErrors.area_km2 = 'Area must be a non-negative number';
    }
    if (!formValues.latitude.trim()) {
      nextErrors.latitude = 'Latitude is required';
    } else if (Number.isNaN(Number(formValues.latitude)) || Number(formValues.latitude) < -90 || Number(formValues.latitude) > 90) {
      nextErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (!formValues.longitude.trim()) {
      nextErrors.longitude = 'Longitude is required';
    } else if (Number.isNaN(Number(formValues.longitude)) || Number(formValues.longitude) < -180 || Number(formValues.longitude) > 180) {
      nextErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(null);

    setErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);
    setSuccess(null);

    const normalizedForm = {
      population: form.population.trim(),
      area_km2: form.area_km2.trim(),
      latitude: form.latitude.trim(),
      longitude: form.longitude.trim(),
    };

    setForm(normalizedForm);

    if (!validate(normalizedForm)) {
      return;
    }

    setSubmitting(true);

    try {
      await updateCity(stateCode, cityName, {
        population: Number(normalizedForm.population),
        area_km2: Number(normalizedForm.area_km2),
        coordinates: {
          latitude: Number(normalizedForm.latitude),
          longitude: Number(normalizedForm.longitude),
        },
      });
      setSuccess('City updated successfully. Redirecting...');
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/cities');
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update city');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  const handleCancel = () => {
    navigate('/cities');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading city...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="create-form-wrapper">
        <h2>Edit City</h2>
        <p className="endpoint-badge">Editing {cityName}, {stateCode}</p>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="field-success" role="status">
            {success}
          </p>
        )}

        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="population">Population</label>
            <input
              id="population"
              name="population"
              type="number"
              min="0"
              value={form.population}
              onChange={handleChange}
              aria-invalid={!!errors.population}
              aria-describedby={errors.population ? 'population-error' : undefined}
            />
            {errors.population && <p id="population-error" className="field-error">{errors.population}</p>}
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
              aria-invalid={!!errors.area_km2}
              aria-describedby={errors.area_km2 ? 'area_km2-error' : undefined}
            />
            {errors.area_km2 && <p id="area_km2-error" className="field-error">{errors.area_km2}</p>}
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
              aria-invalid={!!errors.latitude}
              aria-describedby={errors.latitude ? 'latitude-error' : undefined}
            />
            {errors.latitude && <p id="latitude-error" className="field-error">{errors.latitude}</p>}
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
              aria-invalid={!!errors.longitude}
              aria-describedby={errors.longitude ? 'longitude-error' : undefined}
            />
            {errors.longitude && <p id="longitude-error" className="field-error">{errors.longitude}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save City'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCityForm;
