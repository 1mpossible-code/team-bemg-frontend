import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getCountry, getContinents, updateCountry } from '../api';

const initialForm = {
  country_name: '',
  continent: '',
  capital: '',
  population: '',
  area_km2: '',
};

const REDIRECT_DELAY_MS = 600;

const EditCountryForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [continentOptions, setContinentOptions] = useState([]);
  const redirectTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { countryCode } = useParams();

  useEffect(() => {
    getContinents()
      .then((res) =>
        setContinentOptions(
          [...res.data].sort((a, b) => a.continent_name.localeCompare(b.continent_name))
        )
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    getCountry(countryCode)
      .then((res) => {
        const country = res.data;
        setForm({
          country_name: country.country_name || '',
          continent: country.continent || '',
          capital: country.capital || '',
          population: country.population?.toString() || '',
          area_km2: country.area_km2?.toString() || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Failed to load country');
        setLoading(false);
      });
  }, [countryCode]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const validate = (formValues) => {
    const nextErrors = {};

    if (!formValues.country_name.trim()) {
      nextErrors.country_name = 'Country name is required';
    }
    if (!formValues.continent.trim()) {
      nextErrors.continent = 'Continent is required';
    }
    if (!formValues.capital.trim()) {
      nextErrors.capital = 'Capital is required';
    }
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
      country_name: form.country_name.trim(),
      continent: form.continent.trim(),
      capital: form.capital.trim(),
      population: form.population.trim(),
      area_km2: form.area_km2.trim(),
    };

    setForm(normalizedForm);

    if (!validate(normalizedForm)) {
      return;
    }

    setSubmitting(true);

    try {
      await updateCountry(countryCode, {
        ...normalizedForm,
        population: Number(normalizedForm.population),
        area_km2: Number(normalizedForm.area_km2),
      });
      setSuccess('Country updated successfully. Redirecting...');
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/');
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update country');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading country...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="create-form-wrapper">
        <h2>Edit Country</h2>
        <p className="endpoint-badge">Editing {countryCode}</p>

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
            <label htmlFor="country_name">Country Name</label>
            <input
              id="country_name"
              name="country_name"
              type="text"
              value={form.country_name}
              onChange={handleChange}
              aria-invalid={!!errors.country_name}
              aria-describedby={errors.country_name ? 'country_name-error' : undefined}
            />
            {errors.country_name && <p id="country_name-error" className="field-error">{errors.country_name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="continent">Continent</label>
            <select
              id="continent"
              name="continent"
              value={form.continent}
              onChange={handleChange}
              aria-invalid={!!errors.continent}
              aria-describedby={errors.continent ? 'continent-error' : undefined}
            >
              <option value="">Select a continent</option>
              {continentOptions.map((continent) => (
                <option key={continent.continent_name} value={continent.continent_name}>
                  {continent.continent_name}
                </option>
              ))}
            </select>
            {errors.continent && <p id="continent-error" className="field-error">{errors.continent}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="capital">Capital</label>
            <input
              id="capital"
              name="capital"
              type="text"
              value={form.capital}
              onChange={handleChange}
              aria-invalid={!!errors.capital}
              aria-describedby={errors.capital ? 'capital-error' : undefined}
            />
            {errors.capital && <p id="capital-error" className="field-error">{errors.capital}</p>}
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
              value={form.area_km2}
              onChange={handleChange}
              aria-invalid={!!errors.area_km2}
              aria-describedby={errors.area_km2 ? 'area_km2-error' : undefined}
            />
            {errors.area_km2 && <p id="area_km2-error" className="field-error">{errors.area_km2}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Country'}
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

export default EditCountryForm;
