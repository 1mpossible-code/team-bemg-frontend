import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { createState, getCountries } from '../api';

const initialForm = {
  state_code: '',
  state_name: '',
  country_code: '',
  capital: '',
  population: '',
  area_km2: '',
};

const CreateStateForm = () => {
  const [form, setForm] = useState(initialForm);
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState(null);
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

  const validate = () => {
    const newErrors = {};

    if (!form.state_name.trim()) {
      newErrors.state_name = "State name is required";
    }
    if (!form.state_code.trim()) {
      newErrors.state_code = "State code is required";
    }
    if (!form.country_code.trim()) {
      newErrors.country_code = "Country code is required";
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

    createState(payload)
      .then(() => {
        navigate('/states');
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Failed to create state');
        setSubmitting(false);
      });
  };

  const handleCancel = () => {
    navigate('/states');
  };

  return (
    <div className="container">
      <div className="create-form-wrapper">
        <h2>Create State</h2>

        <form className="create-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="state_name">State Name</label>
          <input
            id="state_name"
            name="state_name"
            type="text"
            value={form.state_name}
            onChange={handleChange}
            placeholder="e.g., California"
            aria-invalid={!!errors.state_name}
            aria-describedby={errors.state_name ? "state_name-error" : undefined}
          />
          {errors.state_name && (
            <p id="state_name-error" className="field-error">
              {errors.state_name}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="state_code">State Code</label>
          <input
            id="state_code"
            name="state_code"
            type="text"
            value={form.state_code}
            onChange={handleChange}
            placeholder="e.g., CA"
            aria-invalid={!!errors.state_code}
            aria-describedby={errors.state_code ? "state_code-error" : undefined}
          />
          {errors.state_code && (
            <p id="state_code-error" className="field-error">
              {errors.state_code}
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
          <label htmlFor="capital">Capital</label>
          <input
            id="capital"
            name="capital"
            type="text"
            value={form.capital}
            onChange={handleChange}
            placeholder="e.g., Sacramento"
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
            placeholder="e.g., 39538223"
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
            placeholder="e.g., 423970"
            aria-invalid={!!errors.area_km2}
            aria-describedby={errors.area_km2 ? "area_km2-error" : undefined}
          />
          {errors.area_km2 && (
            <p id="area_km2-error" className="field-error">
              {errors.area_km2}
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
            {submitting ? 'Creating...' : 'Create State'}
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

export default CreateStateForm;
