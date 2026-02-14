// Polyfill TextEncoder for react-router v7 under Jest
import { TextEncoder } from 'util';

global.TextEncoder = TextEncoder;

// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
