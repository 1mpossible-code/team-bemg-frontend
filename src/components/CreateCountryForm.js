import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { createCountry } from '../api';

const CONTINENT_OPTIONS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
];

const initialForm = {
  country_code: '',
  country_name: '',
  continent: '',
  capital: '',
  population: '',
  area_km2: '',
  latitude: '',
  longitude: '',
};

const CreateCountryForm = () => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...form,
      population: form.population !== '' ? Number(form.population) : undefined,
      area_km2: form.area_km2 !== '' ? Number(form.area_km2) : undefined,
      latitude: form.latitude !== '' ? Number(form.latitude) : undefined,
      longitude: form.longitude !== '' ? Number(form.longitude) : undefined,
    };

    createCountry(payload)
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to create country');
        setSubmitting(false);
      });
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="container">
      <div className="create-form-wrapper">
        <h2>Create Country</h2>

        <form className="create-form" onSubmit={handleSubmit}>
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="country_name">Country Name</label>
          <input
            id="country_name"
            name="country_name"
            type="text"
            value={form.country_name}
            onChange={handleChange}
            placeholder="e.g., United States"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="country_code">Country Code</label>
          <input
            id="country_code"
            name="country_code"
            type="text"
            value={form.country_code}
            onChange={handleChange}
            placeholder="e.g., US"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="continent">Continent</label>
          <select
            id="continent"
            name="continent"
            value={form.continent}
            onChange={handleChange}
            required
          >
            <option value="">Select a continent</option>
            {CONTINENT_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="capital">Capital</label>
          <input
            id="capital"
            name="capital"
            type="text"
            value={form.capital}
            onChange={handleChange}
            placeholder="e.g., Washington D.C."
          />
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
            placeholder="e.g., 331000000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="area_km2">Area (km²)</label>
          <input
            id="area_km2"
            name="area_km2"
            type="number"
            min="0"
            value={form.area_km2}
            onChange={handleChange}
            placeholder="e.g., 9833517"
          />
        </div>

        <div className="form-group">
          <label htmlFor="latitude">Latitude</label>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            value={form.latitude}
            onChange={handleChange}
            placeholder="e.g., 38.8951"
          />
        </div>

        <div className="form-group">
          <label htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            value={form.longitude}
            onChange={handleChange}
            placeholder="e.g., -77.0364"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Country'}
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

export default CreateCountryForm;
