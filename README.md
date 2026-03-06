# Geographic Database Frontend

A React-based frontend for the Geographic Database API, providing an intuitive interface to explore countries, states, and cities data.

## Features

- **Multiple Dashboards**: Browse countries, states, and cities with comprehensive data views
- **Search & Filter**: Dynamic filtering by name, location codes, and population ranges
- **Statistics**: Real-time aggregate metrics including total counts and populations
- **Responsive Design**: Clean, modern UI that works on all devices
- **Error Handling**: Graceful error states with retry functionality

## Technology Stack

- **React 18** with hooks
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

If you prefer not to use `make run-local` / `make run-cloud`, you can set env vars manually and run:

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
