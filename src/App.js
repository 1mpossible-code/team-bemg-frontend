import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Placeholder components
const CountryList = () => <div><h2>Countries Dashboard</h2><p>Fetch and display countries here.</p></div>;
const StateList = () => <div><h2>States List</h2><p>Filter states by country code.</p></div>;
const CityList = () => <div><h2>Cities List</h2><p>Filter cities by state code.</p></div>;

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