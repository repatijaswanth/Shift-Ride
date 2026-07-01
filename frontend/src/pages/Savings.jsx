import { useState, useEffect } from 'react';
import { getSavingsAPI, getMyRidesAPI } from '../utils/api';
import Navbar from '../components/Navbar';

export default function Savings() {
  const [stats,  setStats]  = useState(null);
  const [rides,  setRides]  = useState([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([getSavingsAPI(), getMyRidesAPI()]);
        setStats(s.data);
        setRides(r.data);
      } catch {}
      finally { setLoad(false); }
    };
    load();
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'60px' }}>Loading...</div>;

  const cards = [
    { icon:'💰', label:'Total Saved',    value:`₹${stats?.totalSaved || 0}`,       color:'#4F46E5' },
    { icon:'🚗', label:'Total Rides',    value: stats?.totalRides || 0,             color:'#059669' },
    { icon:'📍', label:'KM Traveled',    value:`${stats?.totalDistance || 0} km`,   color:'#D97706' },
    { icon:'🌿', label:'CO₂ Saved',      value:`${stats?.co2Saved || 0} kg`,        color:'#16A34A' }
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FF' }}>
      <Navbar />
      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'24px 16px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1E1B4B', marginBottom:'20px' }}>
          📊 My Savings Dashboard
        </h2>

        {/* Stat Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'28px' }}>
          {cards.map(c => (
            <div key={c.label} style={{ background:'white', borderRadius:'14px', padding:'20px 16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', textAlign:'center' }}>
              <div style={{ fontSize:'32px', marginBottom:'8px' }}>{c.icon}</div>
              <div style={{ fontSize:'22px', fontWeight:'700', color:c.color }}>{c.value}</div>
              <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Savings Breakdown */}
        <div style={{ background:'white', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:'20px' }}>
          <h3 style={{ fontWeight:'600', color:'#1E1B4B', marginBottom:'16px' }}>💡 Savings Breakdown</h3>
          {[
            ['Daily Average',   `₹${((stats?.totalSaved || 0) / Math.max(1, stats?.totalRides || 1)).toFixed(2)}`],
            ['Monthly Estimate', `₹${stats?.monthlySaved || 0}`],
            ['Yearly Estimate',  `₹${((stats?.monthlySaved || 0) * 12).toFixed(2)}`]
          ].map(([l, v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
              <span style={{ color:'#6B7280', fontSize:'14px' }}>{l}</span>
              <span style={{ fontWeight:'600', color:'#4F46E5', fontSize:'14px' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Ride History */}
        <div style={{ background:'white', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontWeight:'600', color:'#1E1B4B', marginBottom:'16px' }}>🕐 Ride History</h3>
          {rides.length === 0 && <p style={{ color:'#6B7280', textAlign:'center' }}>No rides yet</p>}
          {rides.map(ride => (
            <div key={ride._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #F3F4F6' }}>
              <div>
                <p style={{ fontWeight:'500', fontSize:'14px', color:'#1E1B4B', margin:'0 0 2px' }}>
                  {ride.startLocation?.address || 'Start'} → {ride.destination?.address || 'Office'}
                </p>
                <p style={{ fontSize:'12px', color:'#6B7280', margin:0 }}>
                  {ride.distanceInKm?.toFixed(1)} km • {ride.passengers?.length || 0} passengers
                </p>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ fontSize:'13px', fontWeight:'600', color: ride.status === 'completed' ? '#16A34A' : '#D97706' }}>
                  {ride.status}
                </span>
                <p style={{ fontSize:'12px', color:'#6B7280', margin:'2px 0 0' }}>
                  ₹{ride.totalPerEmployee || ride.totalRideCost || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
