import { useState, useEffect } from 'react';
import { getMyRidesAPI, completeRideAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function MyRides() {
  const [rides,   setRides]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { employee }          = useAuth();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await getMyRidesAPI(); setRides(r.data); }
    catch {} finally { setLoading(false); }
  };

  const complete = async (id) => {
    try { await completeRideAPI(id); load(); }
    catch (err) { alert(err.response?.data?.message); }
  };

  const badge = status => ({
    active:    { background:'#D1FAE5', color:'#065F46' },
    completed: { background:'#DBEAFE', color:'#1E40AF' },
    cancelled: { background:'#FEE2E2', color:'#991B1B' }
  }[status] || {});

  return (
    <div style={{ minHeight:'100vh', background:'#F5F7FF' }}>
      <Navbar />
      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'24px 16px' }}>
        <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1E1B4B', marginBottom:'20px' }}>
          🚗 My Rides
        </h2>

        {loading && <p style={{ textAlign:'center', color:'#6B7280' }}>Loading...</p>}
        {!loading && rides.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px', color:'#9CA3AF' }}>
            <p style={{ fontSize:'48px' }}>🚗</p>
            <p>No rides yet. Go to dashboard to book or offer a ride!</p>
          </div>
        )}

        {rides.map(ride => {
          const isRider     = ride.rider?._id === employee?.id || ride.rider === employee?.id;
          const myPassenger = ride.passengers?.find(p =>
            p.employee?._id === employee?.id || p.employee === employee?.id
          );

          return (
            <div key={ride._id} style={S.card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                <div>
                  <span style={{ fontSize:'12px', fontWeight:'600', padding:'3px 10px', borderRadius:'20px', ...badge(ride.status) }}>
                    {ride.status}
                  </span>
                  <span style={{ marginLeft:'8px', fontSize:'12px', color:'#9CA3AF' }}>
                    {isRider ? '🚗 You are Rider' : '👤 You are Passenger'}
                  </span>
                </div>
                <span style={{ fontSize:'12px', color:'#9CA3AF' }}>
                  {new Date(ride.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
                <div style={S.info}>
                  <p style={S.infoLabel}>From</p>
                  <p style={S.infoVal}>{ride.startLocation?.address || 'Start Point'}</p>
                </div>
                <div style={S.info}>
                  <p style={S.infoLabel}>To</p>
                  <p style={S.infoVal}>{ride.destination?.address || 'Destination'}</p>
                </div>
                <div style={S.info}>
                  <p style={S.infoLabel}>Distance</p>
                  <p style={S.infoVal}>{ride.distanceInKm?.toFixed(1)} km</p>
                </div>
                <div style={S.info}>
                  <p style={S.infoLabel}>Passengers</p>
                  <p style={S.infoVal}>{ride.passengers?.length || 0} / {ride.maxPassengers}</p>
                </div>
              </div>

              {/* Cost Summary */}
              <div style={{ background:'#F9FAFB', borderRadius:'10px', padding:'10px 12px', marginBottom:'12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontSize:'13px', color:'#6B7280' }}>Total Ride Cost</span>
                  <span style={{ fontSize:'13px', fontWeight:'600' }}>₹{ride.totalRideCost?.toFixed(2)}</span>
                </div>
                {isRider ? (
                  <>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                      <span style={{ fontSize:'13px', color:'#6B7280' }}>You Collected</span>
                      <span style={{ fontSize:'13px', fontWeight:'600', color:'#16A34A' }}>₹{ride.riderCollects?.toFixed(2) || 0}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'13px', fontWeight:'700', color:'#15803D' }}>You Paid</span>
                      <span style={{ fontSize:'16px', fontWeight:'700', color:'#15803D' }}>₹0 🎉</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#4338CA' }}>You Paid</span>
                    <span style={{ fontSize:'16px', fontWeight:'700', color:'#4338CA' }}>
                      ₹{myPassenger?.totalPays?.toFixed(2) || ride.totalPerEmployee?.toFixed(2) || 0}
                    </span>
                  </div>
                )}
              </div>

              {/* Complete button for active rides */}
              {isRider && ride.status === 'active' && (
                <button style={S.completeBtn} onClick={() => complete(ride._id)}>
                  ✅ Mark as Completed
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const S = {
  card:        { background:'white', borderRadius:'14px', padding:'16px', marginBottom:'14px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  info:        { background:'#F9FAFB', borderRadius:'8px', padding:'10px 12px' },
  infoLabel:   { fontSize:'11px', color:'#9CA3AF', margin:'0 0 2px', textTransform:'uppercase' },
  infoVal:     { fontSize:'13px', fontWeight:'500', color:'#1E1B4B', margin:0 },
  completeBtn: { width:'100%', padding:'10px', background:'#ECFDF5', color:'#065F46', border:'1px solid #A7F3D0', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'14px' }
};
