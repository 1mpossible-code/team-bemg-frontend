import React from 'react';

const FilterBar = ({ filters, onFilterChange, onSearch, onClear }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  const handleSearchClick = () => {
    onSearch();
  };

  const handleClearClick = () => {
    onClear();
  };

  return (
    <div className="filter-bar">
      <div className="filter-inputs">
        {filters.map((filter) => (
          <div key={filter.name} className="filter-input-group">
            <label htmlFor={filter.name}>{filter.label}</label>
            {filter.type === 'select' ? (
              <select
                id={filter.name}
                name={filter.name}
                value={filter.value}
                onChange={handleInputChange}
              >
                <option value="">All</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={filter.name}
                name={filter.name}
                type={filter.type || 'text'}
                value={filter.value}
                onChange={handleInputChange}
                placeholder={filter.placeholder}
              />
            )}
          </div>
        ))}
      </div>
      <div className="filter-actions">
        <button className="btn btn-primary" onClick={handleSearchClick}>
          Search
        </button>
        <button className="btn btn-secondary" onClick={handleClearClick}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
