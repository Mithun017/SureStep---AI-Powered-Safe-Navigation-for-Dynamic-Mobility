import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import destIconUrl from 'leaflet/dist/images/marker-icon-2x.png'; // Using 2x for destination to differentiate

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

let DestIcon = L.icon({
    iconUrl: markerIcon, // Fallback to same icon but we'll color it via CSS or use a different one
    shadowUrl: markerShadow,
    iconSize: [30, 46],
    iconAnchor: [15, 46],
    className: 'destination-marker'
});

L.Marker.prototype.options.icon = DefaultIcon;

const RecenterMap = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 17, { duration: 1.2 });
  }, [lat, lon, map]);
  return null;
};

const MapView = ({ lat, lon, hazards, destination, style }) => {
  const mapRef = useRef(null);

  const routePath = (lat && lon && destination) ? [
    [lat, lon],
    [destination.lat, destination.lon]
  ] : [];

  return (
    <div className="map-view-wrapper" style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      ...style
    }}>
      <MapContainer 
        center={[lat || 0, lon || 0]} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {lat && lon && (
          <>
            <Circle 
              center={[lat, lon]} 
              radius={20} 
              pathOptions={{ fillColor: 'var(--color-primary)', fillOpacity: 0.3, color: 'var(--color-primary)', weight: 1 }} 
            />
            <Marker position={[lat, lon]}>
              <Popup>Your Location</Popup>
            </Marker>
            <RecenterMap lat={lat} lon={lon} />
          </>
        )}

        {destination && (
          <>
            <Marker position={[destination.lat, destination.lon]} icon={DestIcon}>
              <Popup>{destination.name}</Popup>
            </Marker>
            <Polyline positions={routePath} pathOptions={{ color: 'var(--color-primary)', weight: 4, dashArray: '10, 10', opacity: 0.6 }} />
          </>
        )}

        {hazards.map((h, i) => (
          <Circle 
            key={i}
            center={[h.lat, h.lon]} 
            radius={10} 
            pathOptions={{ fillColor: 'var(--color-danger)', fillOpacity: 0.6, color: 'var(--color-danger)', weight: 2 }} 
          />
        ))}
      </MapContainer>
      <style>{`
        .destination-marker {
          filter: hue-rotate(150deg) brightness(1.2); /* Make it cyan-ish */
        }
      `}</style>
    </div>
  );
};

export default MapView;
