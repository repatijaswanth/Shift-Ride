import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons for Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker
const colorMarker = color => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

// ─── Recenter helper ───────────────────────────────────────────────────────
// MapContainer's `center` prop only applies on FIRST mount. Since myLocation
// starts as null and is set a moment later (after the async GPS lookup
// resolves), the map would otherwise stay frozen on the fallback center.
// This component watches for center changes and calls map.setView() to
// actually move the map whenever the coordinates change.
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ rides = [], myLocation, selectedRide }) {
  const fallback = [17.3850, 78.4867]; // Used only until GPS resolves
  const center   = myLocation ? [myLocation.lat, myLocation.lng] : fallback;

  return (
    <div style={{ borderRadius:'14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.1)', height:'480px' }}>
      <MapContainer center={fallback} zoom={13} style={{ height:'100%', width:'100%' }}>

        {/* Re-centers the map whenever myLocation (or selected destination) changes */}
        <RecenterMap center={center} zoom={14} />

        {/* OpenStreetMap tiles — 100% FREE */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {/* Your location — Blue marker */}
        {myLocation && (
          <Marker position={[myLocation.lat, myLocation.lng]} icon={colorMarker('blue')}>
            <Popup>📍 Your Location</Popup>
          </Marker>
        )}

        {/* Active rides — Green markers */}
        {rides.map(ride => (
          <Marker
            key={ride._id}
            position={[ride.startLocation.latitude, ride.startLocation.longitude]}
            icon={colorMarker('green')}
          >
            <Popup>
              <strong>{ride.rider?.name}</strong><br />
              🚗 {ride.vehicleType}<br />
              Seats left: {ride.maxPassengers - ride.passengers.length}<br />
              Distance: {ride.distanceInKm?.toFixed(1)} km
            </Popup>
          </Marker>
        ))}

        {/* Selected ride destination — Red marker */}
        {selectedRide && (
          <>
            <Marker
              position={[selectedRide.destination.latitude, selectedRide.destination.longitude]}
              icon={colorMarker('red')}
            >
              <Popup>🏢 Destination</Popup>
            </Marker>

            {/* Draw route line */}
            <Polyline
              positions={[
                [selectedRide.startLocation.latitude, selectedRide.startLocation.longitude],
                [selectedRide.destination.latitude,   selectedRide.destination.longitude]
              ]}
              color="#4F46E5"
              weight={4}
              dashArray="8"
            />
          </>
        )}

      </MapContainer>
    </div>
  );
}