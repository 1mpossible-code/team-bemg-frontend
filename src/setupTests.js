// Polyfill TextEncoder for react-router v7 under Jest
import { TextEncoder } from 'util';

global.TextEncoder = TextEncoder;

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
