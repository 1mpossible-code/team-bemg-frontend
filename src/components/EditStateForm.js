import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getState, updateState } from '../api';

const initialForm = {
  state_name: '',
  capital: '',
  population: '',
  area_km2: '',
};

const REDIRECT_DELAY_MS = 600;

const EditStateForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const redirectTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { stateCode } = useParams();

  useEffect(() => {
    getState(stateCode)
      .then((res) => {
        const state = res.data;
        setForm({
          state_name: state.state_name || '',
          capital: state.capital || '',
          population: state.population?.toString() || '',
          area_km2: state.area_km2?.toString() || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Failed to load state');
        setLoading(false);
      });
  }, [stateCode]);

  useEffect(() => () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
  }, []);

  const validate = (formValues) => {
    const nextErrors = {};

    if (!formValues.state_name.trim()) {
      nextErrors.state_name = 'State name is required';
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
      state_name: form.state_name.trim(),
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
      await updateState(stateCode, {
        ...normalizedForm,
        population: Number(normalizedForm.population),
        area_km2: Number(normalizedForm.area_km2),
      });
      setSuccess('State updated successfully. Redirecting...');
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/states');
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update state');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  const handleCancel = () => {
    navigate('/states');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true" />
          <p>Loading state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="create-form-wrapper">
        <h2>Edit State</h2>
        <p className="endpoint-badge">Editing {stateCode}</p>

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
            <label htmlFor="state_name">State Name</label>
            <input
              id="state_name"
              name="state_name"
              type="text"
              value={form.state_name}
              onChange={handleChange}
              aria-invalid={!!errors.state_name}
              aria-describedby={errors.state_name ? 'state_name-error' : undefined}
            />
            {errors.state_name && <p id="state_name-error" className="field-error">{errors.state_name}</p>}
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
              {submitting ? 'Saving...' : 'Save State'}
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

export default EditStateForm;
