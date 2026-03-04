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
};

const CreateCountryForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

    if (!form.country_name.trim()) {
      newErrors.country_name = "Country name is required";
    }
    if (!form.country_code.trim()) {
      newErrors.country_code = "Country code is required";
    }
    if (!form.continent.trim()) {
      newErrors.continent = "Continent is required";
    }
    if (!form.capital.trim()) {
      newErrors.capital = "Capital is required";
    }
    if (!form.population.trim()) {
      newErrors.population = "Population is required";
    }
    if (!form.area_km2.trim()) {
      newErrors.area_km2 = "Area is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
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
      ...form,
      population: form.population !== '' ? Number(form.population) : undefined,
      area_km2: form.area_km2 !== '' ? Number(form.area_km2) : undefined,
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

        <div className="form-group">
          <label htmlFor="country_name">Country Name</label>
          <input
            id="country_name"
            name="country_name"
            type="text"
            value={form.country_name}
            onChange={handleChange}
            placeholder="e.g., United States"
            aria-invalid={!!errors.country_name}
            aria-describedby={errors.country_name ? "country_name-error" : undefined}
          />
          {errors.country_name && (
            <p id="country_name-error" className="field-error">
              {errors.country_name}
            </p>
          )}
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
            aria-invalid={!!errors.country_code}
            aria-describedby={errors.country_code ? "country_code-error" : undefined}
          />
          {errors.country_code && (
            <p id="country_code-error" className="field-error">
              {errors.country_code}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="continent">Continent</label>
          <select
            id="continent"
            name="continent"
            value={form.continent}
            onChange={handleChange}
            aria-invalid={!!errors.continent}
            aria-describedby={errors.continent ? "continent-error" : undefined}
          >
            <option value="">Select a continent</option>
            {CONTINENT_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.continent && (
            <p id="continent-error" className="field-error">
              {errors.continent}
            </p>
          )}
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
            aria-invalid={!!errors.capital}
            aria-describedby={errors.capital ? "capital-error" : undefined}
          />
          {errors.capital && (
            <p id="capital-error" className="field-error">
              {errors.capital}
            </p>
          )}
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
            value={form.area_km2}
            onChange={handleChange}
            placeholder="e.g., 9833517"
            aria-invalid={!!errors.area_km2}
            aria-describedby={errors.area_km2 ? "area_km2-error" : undefined}
          />
          {errors.area_km2 && (
            <p id="area_km2-error" className="field-error">
              {errors.area_km2}
            </p>
          )}
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
