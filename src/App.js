import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router';
import { MoonStar, SunMedium } from 'lucide-react';
import './App.css';


import CountryList from './components/CountryList';
import StateList from './components/StateList';
import CityList from './components/CityList';
import CreateCountryForm from './components/CreateCountryForm';
import CreateStateForm from './components/CreateStateForm';
import CreateCityForm from './components/CreateCityForm';
import EditCountryForm from './components/EditCountryForm';
import EditStateForm from './components/EditStateForm';
import EditCityForm from './components/EditCityForm';
import ErrorBoundary from './components/ErrorBoundary';

const THEME_KEY = 'team-bemg-theme';

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);

    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const themeLabel = useMemo(
    () => (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'),
    [theme]
  );

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="navbar-shell">
            <div className="navbar-branding">
              <h1>Geographic Database</h1>
              <ul>
                <li><NavLink to="/" end>Countries</NavLink></li>
                <li><NavLink to="/states">States</NavLink></li>
                <li><NavLink to="/cities">Cities</NavLink></li>
              </ul>
            </div>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
              aria-label={themeLabel}
            >
              {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </nav>

        <main className="content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<CountryList />} />
              <Route path="/countries/create" element={<CreateCountryForm />} />
              <Route path="/states" element={<StateList />} />
              <Route path="/states/create" element={<CreateStateForm />} />
              <Route path="/states/:stateCode/edit" element={<EditStateForm />} />
              <Route path="/cities" element={<CityList />} />
              <Route path="/cities/create" element={<CreateCityForm />} />
              <Route path="/cities/:stateCode/:cityName/edit" element={<EditCityForm />} />
              <Route path="/countries/:countryCode/edit" element={<EditCountryForm />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;
