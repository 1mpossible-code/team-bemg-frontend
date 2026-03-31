import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { createCountry, getCountry, getContinents } from '../api';

const initialForm = {
  country_code: '',
  country_name: '',
  continent: '',
  capital: '',
  population: '',
  area_km2: '',
};

const COUNTRY_CODE_REGEX = /^[A-Za-z]{2,3}$/;
const REDIRECT_DELAY_MS = 600;

const CreateCountryForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [continentOptions, setContinentOptions] = useState([]);
  const redirectTimeoutRef = useRef(null);
  const navigate = useNavigate();

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
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const getErrorMessage = (err) => {
    if (err?.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    return err?.response?.data?.message || err?.message || 'Failed to create country';
  };

  const validate = (formValues) => {
    const newErrors = {};

    if (!formValues.country_name.trim()) {
      newErrors.country_name = "Country name is required";
    }
    if (!formValues.country_code.trim()) {
      newErrors.country_code = "Country code is required";
    } else if (!COUNTRY_CODE_REGEX.test(formValues.country_code.trim())) {
      newErrors.country_code = "Country code must be 2-3 alphabetical letters";
    }
    if (!formValues.continent.trim()) {
      newErrors.continent = "Continent is required";
    }
    if (!formValues.capital.trim()) {
      newErrors.capital = "Capital is required";
    }
    if (!formValues.population.trim()) {
      newErrors.population = "Population is required";
    } else if (Number.isNaN(Number(formValues.population)) || Number(formValues.population) < 0) {
      newErrors.population = "Population must be a non-negative number";
    }
    if (!formValues.area_km2.trim()) {
      newErrors.area_km2 = "Area is required";
    } else if (Number.isNaN(Number(formValues.area_km2)) || Number(formValues.area_km2) < 0) {
      newErrors.area_km2 = "Area must be a non-negative number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name } = e.target;
    const value = name === 'country_code' ? e.target.value.toUpperCase() : e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(null);

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
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
      ...form,
      country_name: form.country_name.trim(),
      country_code: form.country_code.trim().toUpperCase(),
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
      try {
        await getCountry(normalizedForm.country_code);
        setErrors((prev) => ({
          ...prev,
          country_code: 'Country code already exists',
        }));
        return;
      } catch (lookupErr) {
        if (lookupErr?.response?.status && lookupErr.response.status !== 404) {
          throw lookupErr;
        }
      }

      const payload = {
        ...normalizedForm,
        population: normalizedForm.population !== '' ? Number(normalizedForm.population) : undefined,
        area_km2: normalizedForm.area_km2 !== '' ? Number(normalizedForm.area_km2) : undefined,
      };

      await createCountry(payload);
      setSuccess('Country created successfully. Redirecting...');
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/');
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="container">
      <div className="create-form-wrapper">
        <h2>Create Country</h2>

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
            {continentOptions.map((c) => (
              <option key={c.continent_name} value={c.continent_name}>{c.continent_name}</option>
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
