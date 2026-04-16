# Geographic Database Frontend

A React-based frontend for the Geographic Database API, providing an intuitive interface to explore countries, states, and cities data.

## Features

- **Multiple Dashboards**: Browse countries, states, and cities with comprehensive data views
- **Search & Filter**: Dynamic filtering by name, location codes, and population ranges
- **Statistics**: Real-time aggregate metrics including total counts and populations
- **Responsive Design**: Clean, modern UI that works on all devices
- **Error Handling**: Graceful error states with retry functionality
- **Role-aware UI controls**: Create/Edit/Delete actions are shown only for `admin` role tokens

## Technology Stack

- **React 19** with hooks
- **React Router** for navigation
- **Axios** for API calls
- **CSS3** with modern styling

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Running instance of the Geographic Database API (default local: http://127.0.0.1:8000)

### Installation

```bash
npm install
```

### Running the App

Use Make targets (recommended):

```bash
make run-local
```

- Starts the frontend in local mode
- Calls the local backend directly at `http://127.0.0.1:8000` (from `run-local.sh`)
- Open [http://localhost:3000](http://localhost:3000)

```bash
make run-cloud
```

- Starts the frontend against the hosted API configured in `run-cloud.sh`
- Useful when your local backend is not running

You can still run scripts directly if needed:

```bash
sh ./run-local.sh
sh ./run-cloud.sh
```

### Optional: `.env` configuration

The app defaults to the local API at `http://127.0.0.1:8000/` if no env var is provided. If you prefer not to use `make run-local` / `make run-cloud`, you can set env vars manually and run:

```bash
npm start
```

Examples:

```bash
# local (direct backend calls)
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/

# cloud (direct API calls)
REACT_APP_API_BASE_URL=https://your-api.example.com
```

## Available Filters

**Countries**: Name search, continent selector, population range  
**States**: Name search, country code, population range  
**Cities**: Name search, country/state codes, population range

## Role-Based Access Testing (Frontend)

This frontend reads the role claim from the access token in local storage and hides mutation controls for non-admin users:

- `admin` role: Create/Edit/Delete controls are visible on Countries/States/Cities list views.
- non-admin or missing role: list views stay readable, but Create/Edit/Delete controls are hidden.

Important: this is UI-level gating for UX. Backend authorization must still enforce access.

### Generate local dev tokens

From this frontend folder:

```bash
npm run token:admin
npm run token:user
npm run token:clear
```

These commands print copy/paste snippets for browser DevTools.

### Apply token in browser

1. Open your app in the browser.
2. Open DevTools Console.
3. Run the printed `localStorage.setItem(...)` command.
4. Reload the page.

## Test Files

Run all tests:

```bash
npm test
```

- `src/App.test.js`: Verifies top-level app behavior, including title rendering, nav links, and route navigation to Countries, States, and Cities views.
- `src/components/CountryList.test.js`: Verifies country list states: loading, API error with retry UI, and successful country data rendering.
- `src/components/StateList.test.js`: Verifies state list states, URL-query filter parsing, search/clear behavior, retry flow, and row click navigation to filtered cities.
- `src/components/CityList.test.js`: Verifies city list states, URL-query filter parsing, search/clear behavior, retry flow, and stats/empty state rendering.
- `src/components/CreateCountryForm.test.js`: Verifies validation, duplicate country code handling, timeout error messaging, and success redirect behavior.
- `src/components/ErrorBoundary.test.js`: Verifies fallback UI is shown when a child component throws.
- `src/api.test.js`: Verifies API helper functions call the expected endpoints (`/countries`, `/states`, `/cities`) with correct query params.

Test setup:

- `src/setupTests.js`: Loads `@testing-library/jest-dom`, applies a `TextEncoder` polyfill for router tests, and filters known React `act(...)` warning noise in test output.

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
