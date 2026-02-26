import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router';
import './App.css';


import CountryList from './components/CountryList';
import StateList from './components/StateList';
import CityList from './components/CityList';
import CreateCountryForm from './components/CreateCountryForm';

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
          <Routes>
            <Route path="/" element={<CountryList />} />
            <Route path="/countries/create" element={<CreateCountryForm />} />
            <Route path="/states" element={<StateList />} />
            <Route path="/cities" element={<CityList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;