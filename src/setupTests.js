// Polyfill TextEncoder for react-router v7 under Jest
import { TextEncoder } from 'util';

global.TextEncoder = TextEncoder;
process.env.REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const originalConsoleError = console.error;

console.error = (...args) => {
  const firstArg = args[0];
  if (
    typeof firstArg === 'string' &&
    firstArg.includes('not wrapped in act(...)')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
