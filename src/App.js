import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router';
import './App.css';


import CountryList from './components/CountryList';
import StateList from './components/StateList';
import CityList from './components/CityList'

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>Geographic Database</h1>
          <ul>
            <li><Link to="/">Countries</Link></li>
            <li><Link to="/states">States</Link></li>
            <li><Link to="/cities">Cities</Link></li>
          </ul>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<CountryList />} />
            <Route path="/states" element={<StateList />} />
            <Route path="/cities" element={<CityList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;