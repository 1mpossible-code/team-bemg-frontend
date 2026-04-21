import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterBar from './FilterBar';

describe('FilterBar', () => {
  const filters = [
    {
      name: 'city',
      label: 'City',
      value: 'Austin',
      placeholder: 'Search city',
    },
    {
      name: 'population',
      label: 'Population',
      type: 'number',
      value: '1000',
      placeholder: 'Minimum population',
    },
    {
      name: 'country',
      label: 'Country',
      type: 'select',
      value: '',
      options: [
        { value: 'US', label: 'United States' },
        { value: 'CA', label: 'Canada' },
      ],
    },
  ];

  test('renders text, number, and select filters including the default All option', () => {
    render(
      <FilterBar
        filters={filters}
        onFilterChange={jest.fn()}
        onSearch={jest.fn()}
        onClear={jest.fn()}
      />
    );

    const cityInput = screen.getByLabelText(/city/i);
    const populationInput = screen.getByLabelText(/population/i);
    const countrySelect = screen.getByLabelText(/country/i);

    expect(cityInput).toHaveAttribute('type', 'text');
    expect(cityInput).toHaveValue('Austin');
    expect(cityInput).toHaveAttribute('placeholder', 'Search city');

    expect(populationInput).toHaveAttribute('type', 'number');
    expect(populationInput).toHaveValue(1000);
    expect(populationInput).toHaveAttribute('placeholder', 'Minimum population');

    expect(countrySelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All' })).toHaveValue('');
    expect(screen.getByRole('option', { name: 'United States' })).toHaveValue('US');
    expect(screen.getByRole('option', { name: 'Canada' })).toHaveValue('CA');
  });

  test('calls onFilterChange with input and select name/value pairs', async () => {
    const onFilterChange = jest.fn();

    render(
      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onSearch={jest.fn()}
        onClear={jest.fn()}
      />
    );

    const cityInput = screen.getByLabelText(/city/i);
    await userEvent.clear(cityInput);
    await userEvent.type(cityInput, 'Dallas');

    const countrySelect = screen.getByLabelText(/country/i);
    await userEvent.selectOptions(countrySelect, 'CA');

    expect(onFilterChange).toHaveBeenCalledWith('city', '');
    expect(onFilterChange).toHaveBeenCalledWith('city', 'AustinD');
    expect(onFilterChange).toHaveBeenCalledWith('city', 'Austina');
    expect(onFilterChange).toHaveBeenLastCalledWith('country', 'CA');
  });

  test('calls Search and Clear button callbacks', async () => {
    const onSearch = jest.fn();
    const onClear = jest.fn();

    render(
      <FilterBar
        filters={filters}
        onFilterChange={jest.fn()}
        onSearch={onSearch}
        onClear={onClear}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
