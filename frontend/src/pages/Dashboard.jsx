import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActiveRidesAPI, findMatchAPI, joinRideAPI, createRideAPI } from '../utils/api';
import MapView from '../components/MapView';
import CostCard from '../components/CostCard';
import Navbar from '../components/Navbar';

// ─── OpenStreetMap Nominatim helpers ─────────────────────────────────────────
async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=in`;
  const res  = await fetch(url, { headers: { 'Accept-Language':'en','User-Agent':'SmartCommute/1.0' } });
  return res.json();
}

async function reverseGeocode(lat, lng) {
  const url  = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res  = await fetch(url, { headers: { 'Accept-Language':'en','User-Agent':'SmartCommute/1.0' } });
  const data = await res.json();
  const a    = data.address || {};
  return a.village || a.hamlet || a.suburb || a.town || a.city_district || data.display_name || '';
}

// ─── Persist confirmed location in localStorage ───────────────────────────────
// Laptops have no GPS chip — Wi-Fi-based detection gives a DIFFERENT result
// on every page load (sometimes wildly wrong). The correct fix is:
// 1. Let the user confirm their real location ONCE via manual search
// 2. Save it to localStorage
// 3. Always load that confirmed location on every login/refresh
// 4. Provide a "Detect again" button ONLY when the user explicitly wants it
const KEY = 'smartcommute_pickup';

const savePickup  = (lat, lng, address) =>
  localStorage.setItem(KEY, JSON.stringify({ lat, lng, address }));

const loadPickup  = () => {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
};

const clearPickup = () => localStorage.removeItem(KEY);

export default function Dashboard() {
  const { employee } = useAuth();

  const [activeRides, setActive]   = useState([]);
  const [matched,     setMatched]  = useState([]);

  // Pickup
  const [myLocation,    setMyLoc]      = useState(null);
  const [pickupAddress, setPickupAddr] = useState('');
  const [locationSet,   setLocationSet]= useState(false); // true once a confirmed location is loaded
  const [detecting,     setDetecting]  = useState(false);
  const [pickupSearch,  setPickupSearch] = useState('');
  const [pickupSugg,    setPickupSugg] = useState([]);
  const [searchingPickup, setSearchingPickup] = useState(false);

  // Destination
  const [destAddress,   setDestAddr]  = useState('');
  const [destSugg,      setDestSugg]  = useState([]);
  const [selectedDest,  setSelDest]   = useState(null);
  const [searchingDest, setSearchingDest] = useState(false);

  const [selectedRide, setSelected] = useState(null);
  const [costs,        setCosts]    = useState(null);
  const [msg,          setMsg]      = useState('');
  const [tab,          setTab]      = useState('find');

  // ─── On login/refresh: load confirmed location immediately ──────────────────
  // No GPS call here — GPS on laptops gives a different wrong answer every
  // time. Instead, load the saved confirmed location which the user verified
  // once manually. Only fall back to GPS if they have never set one.
  useEffect(() => {
    const saved = loadPickup();
    if (saved) {
      setMyLoc({ lat: saved.lat, lng: saved.lng });
      setPickupAddr(saved.address);
      setLocationSet(true);
    }
    // If no saved location yet, show a prompt to set it manually — don't
    // attempt GPS auto-detect (it will be wrong every time on a laptop)
    loadRides();
  }, []);

  const loadRides = async () => {
    try { const res = await getActiveRidesAPI(); setActive(res.data); } catch {}
  };

  // ─── Manual GPS detect — only when user explicitly clicks ──────────────────
  const detectGPS = () => {
    setDetecting(true);
    setMsg('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLoc({ lat, lng });
        try {
          const name = await reverseGeocode(lat, lng);
          setPickupAddr(name);
          savePickup(lat, lng, name);
        } catch {
          setPickupAddr(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          savePickup(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        setLocationSet(true);
        setDetecting(false);
        setMsg('📍 Location detected! If the name looks wrong, search manually below to correct it.');
      },
      () => {
        setDetecting(false);
        setMsg('❌ GPS detection failed. Please search your location manually below.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ─── Manual pickup search ──────────────────────────────────────────────────
  const searchPickup = async () => {
    if (!pickupSearch.trim()) return;
    setSearchingPickup(true);
    setPickupSugg([]);
    try {
      const results = await geocodeAddress(pickupSearch);
      if (results.length === 0) setMsg('❌ Location not found. Try adding district/state (e.g. Nagasamudram, Anantapur, Andhra Pradesh)');
      else { setPickupSugg(results); setMsg(''); }
    } catch { setMsg('❌ Error searching. Check your internet.'); }
    setSearchingPickup(false);
  };

  const selectPickup = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setMyLoc({ lat, lng });
    setPickupAddr(place.display_name);
    setLocationSet(true);
    savePickup(lat, lng, place.display_name); // saved — will load correctly on every future login
    setPickupSugg([]);
    setPickupSearch('');
    setMsg('✅ Location confirmed and saved!');
  };

  const changeLocation = () => {
    clearPickup();
    setMyLoc(null);
    setPickupAddr('');
    setLocationSet(false);
    setMsg('');
  };

  // ─── Destination search ────────────────────────────────────────────────────
  const searchDestination = async () => {
    if (!destAddress.trim()) return;
    setSearchingDest(true);
    setDestSugg([]);
    setSelDest(null);
    try {
      const results = await geocodeAddress(destAddress);
      if (results.length === 0) setMsg('❌ Destination not found. Try a more specific address.');
      else { setDestSugg(results); setMsg(''); }
    } catch { setMsg('❌ Error searching destination.'); }
    setSearchingDest(false);
  };

  const selectDest = (place) => {
    setSelDest({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), address: place.display_name });
    setDestAddr(place.display_name);
    setDestSugg([]);
    setMsg('✅ Destination confirmed!');
  };

  // ─── Ride actions ──────────────────────────────────────────────────────────
  const findMatches = async () => {
    if (!myLocation) return setMsg('⚠️ Set your pickup location first.');
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
    if (!myLocation)   return alert('Set your pickup location first.');
    if (!selectedDest) return alert('Search and select a destination first.');
    try {
      const res = await createRideAPI({
        startLocation: { latitude: myLocation.lat, longitude: myLocation.lng, address: pickupAddress },
        destination:   { latitude: selectedDest.lat, longitude: selectedDest.lng, address: selectedDest.address },
        vehicleType:   employee.vehicleType || 'car'
      });
      setCosts(res.data.costs);
      setSelected(res.data.ride);
      setMsg('✅ Ride created! Waiting for passengers...');
      setDestAddr(''); setSelDest(null);
      loadRides();
    } catch (err) { setMsg(err.response?.data?.message || 'Error creating ride'); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FF' }}>
      <Navbar />
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'20px 16px' }}>

        <div style={{ marginBottom:'20px' }}>
          <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1E1B4B', margin:'0 0 4px' }}>
            Welcome back, {employee?.name?.split(' ')[0]}! 👋
          </h2>
          <p style={{ color:'#6B7280', fontSize:'14px' }}>Find or offer a ride to your office today</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>

          {/* ── MAP ── */}
          <MapView rides={activeRides} myLocation={myLocation} selectedRide={selectedRide} />

          {/* ── RIGHT PANEL ── */}
          <div>

            {/* ── LOCATION NOT SET YET ── */}
            {!locationSet ? (
              <div style={S.panel}>
                <p style={{ fontWeight:'700', fontSize:'16px', color:'#1E1B4B', marginBottom:'8px' }}>
                  📍 Set Your Pickup Location
                </p>
                <p style={{ fontSize:'13px', color:'#6B7280', marginBottom:'16px' }}>
                </p>

                {/* Option 1 — GPS */}
                <button style={S.btn} onClick={detectGPS} disabled={detecting}>
                  {detecting ? '⏳ Detecting...' : '📡 Detect My Current Location (GPS)'}
                </button>

                <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:'12px', margin:'8px 0' }}>
                  — or search manually —
                </p>

                {/* Option 2 — Manual search */}
                <div style={{ position:'relative' }}>
                  <input
                    style={S.inp}
                    placeholder="e.g. Banglore,Karnataka,India"
                    value={pickupSearch}
                    onChange={e => setPickupSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchPickup()}
                  />
                  <button style={S.searchBtn} onClick={searchPickup} disabled={searchingPickup}>
                    {searchingPickup ? '⏳' : '🔍 Search'}
                  </button>
                  {pickupSugg.length > 0 && (
                    <div style={S.dropdown}>
                      {pickupSugg.map((place, i) => (
                        <div key={i} style={S.suggestion} onClick={() => selectPickup(place)}>
                          📍 <span style={{ fontSize:'12px', color:'#374151', lineHeight:'1.5' }}>{place.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {msg && <p style={S.msgBox(msg)}>{msg}</p>}
              </div>

            ) : (
              /* ── LOCATION SET — show main ride UI ── */
              <>
                {/* Tabs */}
                <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
                  {['find','create'].map(t => (
                    <button key={t} onClick={() => { setTab(t); setMsg(''); }}
                      style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', cursor:'pointer',
                        fontWeight:'600', fontSize:'14px',
                        background: tab===t ? '#4F46E5' : 'white',
                        color: tab===t ? 'white' : '#6B7280' }}>
                      {t === 'find' ? '🔍 Find Ride' : '🚗 Offer Ride'}
                    </button>
                  ))}
                </div>

                <div style={S.panel}>
                  {/* Pickup display */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                    <p style={S.label}>📍 Your Pickup Location</p>
                    <span style={{ fontSize:'11px', color:'#4F46E5', cursor:'pointer', fontWeight:'600' }}
                      onClick={changeLocation}>✏️ Change</span>
                  </div>
                  <div style={S.locBox}>
                    {pickupAddress || `${myLocation?.lat?.toFixed(4)}, ${myLocation?.lng?.toFixed(4)}`}
                  </div>

                  {/* ── FIND TAB ── */}
                  {tab === 'find' ? (
                    <>
                      <button style={S.btn} onClick={findMatches}>🔍 Find Matching Rides</button>
                      {msg && <p style={S.msgBox(msg)}>{msg}</p>}
                      {matched.map(ride => (
                        <div key={ride._id} style={S.rideCard}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                              <p style={{ fontWeight:'600', margin:'0 0 4px', color:'#1E1B4B' }}>
                                {ride.vehicleType === 'bike' ? '🏍️' : '🚗'} {ride.rider?.name}
                              </p>
                              <p style={{ fontSize:'12px', color:'#6B7280', margin:'0 0 2px' }}>{ride.rider?.companyName}</p>
                              <p style={{ fontSize:'12px', color:'#6B7280', margin:0 }}>
                                Seats: {ride.maxPassengers - ride.passengers.length} left • {ride.distanceInKm?.toFixed(1)} km
                              </p>
                            </div>
                            <button style={S.joinBtn} onClick={() => joinRide(ride._id)}>Join</button>
                          </div>
                        </div>
                      ))}
                    </>

                  ) : (
                    /* ── CREATE TAB ── */
                    <>
                      <p style={S.label}>🏢 Destination</p>
                      <div style={{ position:'relative' }}>
                        <input
                          style={S.inp}
                          placeholder="e.g. Infosys, Hyderabad"
                          value={destAddress}
                          onChange={e => { setDestAddr(e.target.value); setSelDest(null); setDestSugg([]); }}
                          onKeyDown={e => e.key === 'Enter' && searchDestination()}
                        />
                        <button style={S.searchBtn} onClick={searchDestination} disabled={searchingDest}>
                          {searchingDest ? '⏳' : '🔍 Search'}
                        </button>
                        {destSugg.length > 0 && (
                          <div style={S.dropdown}>
                            {destSugg.map((place, i) => (
                              <div key={i} style={S.suggestion} onClick={() => selectDest(place)}>
                                📍 <span style={{ fontSize:'12px', color:'#374151', lineHeight:'1.5' }}>{place.display_name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedDest && (
                        <div style={S.selectedDest}>
                          <p style={{ fontSize:'12px', fontWeight:'600', color:'#059669', margin:'0 0 2px' }}>✅ Destination Confirmed</p>
                          <p style={{ fontSize:'12px', color:'#374151', margin:0 }}>{selectedDest.address.substring(0, 100)}</p>
                        </div>
                      )}

                      {msg && <p style={S.msgBox(msg)}>{msg}</p>}

                      <button
                        style={{ ...S.btn, opacity: selectedDest ? 1 : 0.5 }}
                        onClick={createRide}
                        disabled={!selectedDest}>
                        🚗 Create Ride
                      </button>
                    </>
                  )}
                </div>

                {costs && <CostCard costs={costs} isRider={tab === 'create'} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  panel:       { background:'white', borderRadius:'14px', padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  label:       { fontSize:'12px', fontWeight:'600', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 6px', display:'block' },
  locBox:      { background:'#F5F3FF', border:'1px solid #DDD6FE', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'#4F46E5', marginBottom:'12px' },
  btn:         { width:'100%', padding:'12px', background:'#4F46E5', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer', marginBottom:'10px' },
  searchBtn:   { width:'100%', padding:'10px', background:'#F3F4F6', color:'#374151', border:'1.5px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', fontWeight:'600', cursor:'pointer', marginBottom:'10px' },
  inp:         { width:'100%', padding:'10px 12px', marginBottom:'8px', border:'1.5px solid #E5E7EB', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box' },
  rideCard:    { background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'10px', padding:'12px', marginBottom:'10px' },
  joinBtn:     { background:'#4F46E5', color:'white', border:'none', borderRadius:'8px', padding:'8px 16px', cursor:'pointer', fontWeight:'600', fontSize:'13px', whiteSpace:'nowrap' },
  dropdown:    { position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #E5E7EB', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:100, maxHeight:'220px', overflowY:'auto' },
  suggestion:  { display:'flex', gap:'8px', alignItems:'flex-start', padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid #F3F4F6' },
  selectedDest:{ background:'#F0FDF4', border:'1px solid #A7F3D0', borderRadius:'8px', padding:'10px 12px', marginBottom:'10px' },
  msgBox:      (msg) => ({ padding:'10px 12px', borderRadius:'8px', fontSize:'13px', marginBottom:'10px', marginTop:'4px',
    background: msg.includes('❌') || msg.includes('⚠️') ? '#FEF2F2' : '#F0FDF4',
    color:      msg.includes('❌') || msg.includes('⚠️') ? '#DC2626'  : '#16A34A' })
};
