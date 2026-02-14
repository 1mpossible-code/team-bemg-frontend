import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const heading = screen.getByText(/Geographic Database/i);
  expect(heading).toBeInTheDocument();
});

test('renders nav links', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /countries/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /states/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /cities/i })).toBeInTheDocument();
});

test('navigates to Countries and shows dashboard', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /countries/i }));
  expect(screen.getByText(/Countries Dashboard/i)).toBeInTheDocument();
});

test('navigates to States and shows list', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /states/i }));
  expect(screen.getByText(/States List/i)).toBeInTheDocument();
});

test('navigates to Cities and shows list', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('link', { name: /cities/i }));
  expect(screen.getByText(/Cities List/i)).toBeInTheDocument();
});
