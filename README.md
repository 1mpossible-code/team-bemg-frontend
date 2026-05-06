# Geographic Database Frontend

A React-based frontend for the Geographic Database API, providing an intuitive interface to explore countries, states, and cities data.

## Features

- **Multiple Dashboards**: Browse countries, states, and cities with comprehensive data views
- **Search & Filter**: Dynamic filtering by name, location codes, and population ranges
- **Statistics**: Real-time aggregate metrics including total counts and populations
- **Responsive Design**: Clean, modern UI that works on all devices
- **Error Handling**: Graceful error states with retry functionality
- **Role-aware UI controls**: Create/Edit/Delete actions are shown only for `admin` role tokens
- **Developer Logs Viewer**: Token-gated `/dev/logs` page with auto-refresh, level color-coding, and error/critical count cards (see [Developer Logs](#developer-logs))

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

## Developer Logs

The app exposes a developer-only log viewer at [`/dev/logs`](http://localhost:3000/dev/logs) that consumes the backend's `GET /dev/logs` endpoint.

- **Auth**: paste the backend's `DEV_LOGS_TOKEN` into the *Developer Token* field. The token is held in `sessionStorage` for the tab and sent as the `X-Dev-Token` header on every request — it is never written to `localStorage` and never embedded in URLs.
- **Limit**: choose how many recent records to fetch (`20`, `50`, `100`).
- **Auto-refresh**: a styled toggle switch controls a 5-second polling loop. Disable it for static inspection.
- **Stat cards**: at-a-glance counts of *Visible Logs*, *Errors*, and *Criticals* across the current view.
- **Level color-coding**: each row is themed by the log level (`info`, `warn`, `error`, `critical`) via `log-<level>` CSS classes, so problems stand out without filtering.
- **Empty state**: clear messaging for "no token entered" vs. "no logs available" so the page is never silently blank.

The page does not appear in the main navigation; deep-link to `/dev/logs` to reach it. See the backend `README.md` for how to set `DEV_LOGS_TOKEN` and mint a token locally.

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

### Top-level

- `src/App.test.js`: App shell — title, nav links, route navigation to Countries/States/Cities dashboards, theme toggle, and theme restoration from `localStorage` and `prefers-color-scheme`.
- `src/api.test.js`: API client — token storage helpers (`storeAccessToken`, `clearAccessToken`, `applyAccessToken`), role extraction from JWT payload, and the country/state/city `get`/`delete` calls (including the cascade flag).
- `src/ConfirmModal.test.js`: Open/close behavior, overlay click cancels, confirm/cancel callbacks, `confirmDisabled`, and the `Deleting...` in-progress state.

### Components

- `src/components/CountryList.test.js`: Loading, API error with retry UI, and successful country data rendering.
- `src/components/StateList.test.js`: List states, URL-query filter parsing, search/clear, retry flow, and row-click navigation to filtered cities.
- `src/components/CityList.test.js`: List states, URL-query filter parsing, search/clear, retry flow, and stats / empty-state rendering.
- `src/components/CreateCountryForm.test.js`: Validation, duplicate country code handling, timeout error messaging, success redirect.
- `src/components/CreateStateForm.test.js`: Validation, country selector population, error/success flows, and navigation back to the states list.
- `src/components/CreateCityForm.test.js`: Validation, cascading country/state selectors, latitude/longitude inputs, submit loading feedback, and success redirect.
- `src/components/EditCountryForm.test.js`: Preloads an existing country, validates dirty fields, submit success and error paths.
- `src/components/EditStateForm.test.js`: Preloads an existing state, validates fields, submit success and error paths.
- `src/components/EditCityForm.test.js`: Preloads an existing city (including coordinates), validates fields, submit success and error paths.
- `src/components/ErrorBoundary.test.js`: Fallback UI is shown when a child component throws.
- `src/components/FilterBar.test.js`: Renders text/number/select filters with the right types and default `All` option, propagates `(name, value)` changes, and wires Search/Clear buttons.
- `src/components/Globe3D.test.js`: Fallback preview rendering in the test environment, marker count display, and custom `className` propagation to the fallback container.
- `src/components/DevLogsPage.test.js`: Token-required validation, session-storage token restore on mount, refresh button calls `/dev/logs` with the configured limit, and 5-second auto-refresh polling that stops when the toggle is disabled.

### Utilities

- `src/utils/urlFilters.test.js`: `parseFiltersFromSearch` only reads known keys and preserves defaults; `buildSearchFromFilters` omits empty/null/undefined values and stringifies the rest.
- `src/utils/query.test.js`: `normalizeQueryParams` drops empty/null/undefined values, coerces configured numeric keys (with whitespace handling), and preserves original strings on parse failure.

### Test setup

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
