import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CityMap = ({ cities }) => {
  const center = cities.length > 0 && cities[0].coordinates 
    ? [cities[0].coordinates.latitude, cities[0].coordinates.longitude] 
    : [20, 0];

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
              pathOptions={{ 
                color: '#2563eb',
                fillColor: '#60a5fa', 
                fillOpacity: 0.5,
                weight: 1 
              }}
              radius={7}
            >
              <Popup>
                <div style={{ fontFamily: 'sans-serif' }}>
                  <strong style={{ fontSize: '14px' }}>{city.city_name}</strong>
                  <p style={{ margin: '4px 0 0', color: '#666' }}>
                    Pop: {city.population?.toLocaleString()}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default CityMap;