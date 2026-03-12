import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router';
import './App.css';
import 'leaflet/dist/leaflet.css';


import CountryList from './components/CountryList';
import StateList from './components/StateList';
import CityList from './components/CityList';
import CreateCountryForm from './components/CreateCountryForm';
import CreateStateForm from './components/CreateStateForm';
import CreateCityForm from './components/CreateCityForm';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>Geographic Database</h1>
          <ul>
            <li><NavLink to="/" end>Countries</NavLink></li>
            <li><NavLink to="/states">States</NavLink></li>
            <li><NavLink to="/cities">Cities</NavLink></li>
          </ul>
        </nav>

        <main className="content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<CountryList />} />
              <Route path="/countries/create" element={<CreateCountryForm />} />
              <Route path="/states" element={<StateList />} />
              <Route path="/states/create" element={<CreateStateForm />} />
              <Route path="/cities" element={<CityList />} />
              <Route path="/cities/create" element={<CreateCityForm />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;
