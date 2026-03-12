import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CityMap = ({ cities }) => {
  const center = cities.length > 0 && cities[0].coordinates 
    ? [cities[0].coordinates.latitude, cities[0].coordinates.longitude] 
    : [20, 0];

  // Helper to calculate radius based on population
  const getRadius = (population) => {
    if (!population) return 5; // Default for missing data
    return Math.max(4, Math.sqrt(population) / 250); 
  };

  // Helper to highlight massive cities
  const getColor = (population) => {
    return population > 5000000 ? '#1e3a8a' : '#2563eb'; // Darker blue for megacities
  };

  return (
    <div className="map-wrapper" style={{
      height: "400px",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      border: "1px solid #e5e7eb",
      marginBottom: "2rem"
    }}>
      <MapContainer center={center} zoom={3} scrollWheelZoom={true} style={{ height: "100%" }}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        />

        {cities.map((city, idx) => {
          const lat = city.coordinates?.latitude;
          const lng = city.coordinates?.longitude;

          if (lat === undefined || lng === undefined) return null;

          return (
            <CircleMarker
              key={idx}
              center={[lat, lng]}
              radius={getRadius(city.population)}
              pathOptions={{ 
                color: getColor(city.population), 
                fillColor: '#60a5fa', 
                fillOpacity: 0.6,
                weight: 1.5 
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                <div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
                  <strong>{city.city_name}</strong>
                  <br/>
                  <span style={{ color: '#666' }}>Pop: {city.population?.toLocaleString()}</span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default CityMap;