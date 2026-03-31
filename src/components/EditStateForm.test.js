import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router';
import EditStateForm from './EditStateForm';
import * as api from '../api';

const mockNavigate = jest.fn();

jest.mock('../api');
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const renderEditStateForm = () => {
  render(
    <MemoryRouter initialEntries={['/states/CA/edit']}>
      <Routes>
        <Route path="/states/:stateCode/edit" element={<EditStateForm />} />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  api.getState.mockResolvedValue({
    data: {
      state_name: 'California',
      state_code: 'CA',
      capital: 'Sacramento',
      population: 39538223,
      area_km2: 423970,
    },
  });
  api.updateState.mockResolvedValue({ data: { ok: true } });
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

test('loads existing state data into the edit form', async () => {
  renderEditStateForm();

  expect(await screen.findByDisplayValue('California')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Sacramento')).toBeInTheDocument();
});

test('shows validation errors for invalid state edits', async () => {
  renderEditStateForm();

  const populationInput = await screen.findByLabelText(/Population/i);
  await userEvent.clear(populationInput);
  await userEvent.click(screen.getByRole('button', { name: /Save State/i }));

  expect(await screen.findByText(/Population is required/i)).toBeInTheDocument();
  expect(api.updateState).not.toHaveBeenCalled();
});

test('submits updated state data and redirects', async () => {
  renderEditStateForm();

  const capitalInput = await screen.findByLabelText(/Capital/i);
  await userEvent.clear(capitalInput);
  await userEvent.type(capitalInput, 'Los Angeles');
  await userEvent.click(screen.getByRole('button', { name: /Save State/i }));

  await waitFor(() => {
    expect(api.updateState).toHaveBeenCalledWith('CA', expect.objectContaining({
      capital: 'Los Angeles',
      population: 39538223,
      area_km2: 423970,
    }));
  });

  expect(await screen.findByRole('status')).toHaveTextContent(/State updated successfully/i);
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/states');
  });
});
