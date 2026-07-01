import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActiveRidesAPI, findMatchAPI, joinRideAPI, createRideAPI } from '../utils/api';
import MapView from '../components/MapView';
import CostCard from '../components/CostCard';
import Navbar from '../components/Navbar';

// Reverse geocode coordinates to a place name using OpenStreetMap Nominatim
async function getPlaceName(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`
    );
    const data = await res.json();
    const a = data.address || {};

    // Priority: most specific → least specific
    const primary =
      a.village ||
      a.hamlet ||
      a.suburb ||
      a.neighbourhood ||
      a.quarter ||
      a.residential ||
      a.town ||
      a.city_district ||
      a.city;

    const secondary =
      a.city ||
      a.town ||
      a.county ||
      a.state_district;

    if (primary && secondary && primary !== secondary) {
      return `${primary}, ${secondary}`;
    }
    if (primary) return primary;

    // Fallback: first 2 parts of display_name
    return data.display_name?.split(',').slice(0, 2).join(', ').trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Forward geocode a place name to lat/lng using Nominatim
async function geocodePlace(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  );
  const data = await res.json();
  if (data && data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

export default function Dashboard() {
  const { employee }              = useAuth();
  const [activeRides, setActive]  = useState([]);
  const [matched,     setMatched] = useState([]);
  const [myLocation,  setMyLoc]   = useState(null);
  const [myPlaceName, setMyPlace] = useState('Detecting your location...');
  const [destination, setDest]    = useState({ address: '' });
  const [selectedRide, setSelected] = useState(null);
  const [costs,       setCosts]   = useState(null);
  const [msg,         setMsg]     = useState('');
  const [tab,         setTab]     = useState('find'); // find | create
  const [geocoding,   setGeocoding] = useState(false);

  // Get current location on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLoc({ lat, lng });
        const name = await getPlaceName(lat, lng);
        setMyPlace(name);
      },
      () => {
        setMyLoc({ lat: 17.3850, lng: 78.4867 });
        setMyPlace('Hyderabad, Telangana');
      }
    );
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const res = await getActiveRidesAPI();
      setActive(res.data);
    } catch {}
  };

  const findMatches = async () => {
    if (!myLocation) return;
    try {
      const res = await findMatchAPI(myLocation.lat, myLocation.lng);
      setMatched(res.data.rides);
      setMsg(`${res.data.count} matching rides found near you`);
    } catch { setMsg('Error finding rides'); }
  };

  const joinRide = async (rideId) => {
    try {
      const res = await joinRideAPI({ rideId });
      setCosts(res.data.costs);
      setSelected(res.data.ride);
      setMsg('✅ Successfully joined ride!');
      loadRides();
    } catch (err) { setMsg(err.response?.data?.message || 'Error joining ride'); }
  };

  const createRide = async () => {
    if (!myLocation) return alert('Location not detected yet');
    if (!destination.address.trim()) return alert('Enter destination address');

    setGeocoding(true);
    setMsg('📍 Looking up destination...');
    const coords = await geocodePlace(destination.address);
    setGeocoding(false);

    if (!coords) {
      setMsg('❌ Could not find that destination. Try a more specific address.');
      return;
    }

    try {
      const res = await createRideAPI({
        startLocation: { latitude: myLocation.lat, longitude: myLocation.lng, address: myPlaceName },
        destination:   { latitude: coords.lat, longitude: coords.lng, address: destination.address },
        vehicleType:   employee.vehicleType || 'car'
      });
      setCosts(res.data.costs);
      setSelected(res.data.ride);
      setMsg('✅ Ride created! Waiting for passengers...');
      loadRides();
    } catch (err) { setMsg(err.response?.data?.message || 'Error creating ride'); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FF' }}>
      <Navbar />
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'20px 16px' }}>

        {/* Welcome */}
        <div style={{ marginBottom:'20px' }}>
          <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1E1B4B', margin:'0 0 4px' }}>
            Welcome back, {employee?.name?.split(' ')[0]}! 👋
          </h2>
          <p style={{ color:'#6B7280', fontSize:'14px' }}>Find or offer a ride to your office today</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>

          {/* Left — Map */}
          <div>
            <MapView rides={activeRides} myLocation={myLocation} selectedRide={selectedRide} />
          </div>

          {/* Right — Actions */}
          <div>
            {/* Tabs */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
              {['find','create'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'14px',
                    background: tab===t ? '#4F46E5' : 'white', color: tab===t ? 'white' : '#6B7280' }}>
                  {t === 'find' ? '🔍 Find Ride' : '🚗 Offer Ride'}
                </button>
              ))}
            </div>

            {tab === 'find' ? (
              <div style={S.panel}>
                <p style={S.label}>Your Location (auto-detected)</p>
                <div style={S.locBox}>
                  📍 {myPlaceName}
                </div>
                <button style={S.btn} onClick={findMatches}>Find Matching Rides</button>

                {msg && <p style={S.msg}>{msg}</p>}

                {matched.map(ride => (
                  <div key={ride._id} style={S.rideCard}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <p style={{ fontWeight:'600', margin:'0 0 4px', color:'#1E1B4B' }}>
                          {ride.rider?.name} — {ride.vehicleType === 'bike' ? '🏍️' : '🚗'}
                        </p>
                        <p style={{ fontSize:'12px', color:'#6B7280', margin:'0 0 4px' }}>
                          {ride.rider?.companyName}
                        </p>
                        <p style={{ fontSize:'12px', color:'#6B7280', margin:0 }}>
                          Seats: {ride.maxPassengers - ride.passengers.length} left •
                          Distance: {ride.distanceInKm?.toFixed(1)} km
                        </p>
                      </div>
                      <button style={S.joinBtn} onClick={() => joinRide(ride._id)}>
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={S.panel}>
                <p style={S.label}>Your Location (Pickup Point)</p>
                <div style={S.locBox}>
                  📍 {myPlaceName}
                </div>
                <p style={S.label}>Destination</p>
                <input style={S.inp} placeholder="Enter destination (e.g. Infosys Pocharam, Hyderabad)"
                  value={destination.address}
                  onChange={e => setDest({ address: e.target.value })} />
                <button style={{ ...S.btn, opacity: geocoding ? 0.7 : 1 }} onClick={createRide} disabled={geocoding}>
                  {geocoding ? '📍 Finding destination...' : 'Create Ride'}
                </button>
                {msg && <p style={S.msg}>{msg}</p>}
              </div>
            )}

            {/* Cost Card */}
            {costs && <CostCard costs={costs} isRider={tab === 'create'} />}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  panel:   { background:'white', borderRadius:'14px', padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  label:   { fontSize:'12px', fontWeight:'600', color:'#6B7280', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' },
  locBox:  { background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'#4F46E5', marginBottom:'12px' },
  btn:     { width:'100%', padding:'12px', background:'#4F46E5', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', marginBottom:'12px' },
  inp:     { width:'100%', padding:'10px 12px', marginBottom:'10px', border:'1.5px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box' },
  msg:     { background:'#F0FDF4', color:'#16A34A', padding:'10px 12px', borderRadius:'8px', fontSize:'13px', marginBottom:'12px' },
  rideCard:{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px', marginBottom:'10px' },
  joinBtn: { background:'#4F46E5', color:'white', border:'none', borderRadius:'8px', padding:'8px 16px', cursor:'pointer', fontWeight:'600', fontSize:'13px' }
};
