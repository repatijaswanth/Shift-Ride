export default function CostCard({ costs, isRider }) {
  if (!costs) return null;
  const {
    distanceInKm, fuelCost, totalRideCost,
    passengerCount, costPerPassenger,
    riderCollects, dailySaving, monthlySaving
  } = costs;

  const Row = ({ label, value, bold, color }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #F3F4F6' }}>
      <span style={{ fontSize:'13px', color: bold ? '#1E1B4B' : '#6B7280', fontWeight: bold ? '600' : '400' }}>{label}</span>
      <span style={{ fontSize:'13px', fontWeight:'600', color: color || (bold ? '#1E1B4B' : '#374151') }}>{value}</span>
    </div>
  );

  return (
    <div style={{ background:'white', borderRadius:'14px', padding:'16px', marginTop:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
      <h4 style={{ fontWeight:'700', color:'#1E1B4B', marginBottom:'12px', fontSize:'15px' }}>💰 Cost Breakdown</h4>

      {/* Ride level */}
      <div style={{ background:'#F9FAFB', borderRadius:'10px', padding:'10px 12px', marginBottom:'10px' }}>
        <p style={{ fontSize:'11px', fontWeight:'700', color:'#9CA3AF', marginBottom:'6px', letterSpacing:'0.05em' }}>RIDE COST</p>
        <Row label="Distance"        value={`${distanceInKm} km`} />
        <Row label="Fuel Cost"       value={`₹${fuelCost}`} />
        <Row label="Total Ride Cost" value={`₹${totalRideCost}`} bold />
      </div>

      {/* Passenger level */}
      {passengerCount > 0 && (
        <div style={{ background:'#EEF2FF', borderRadius:'10px', padding:'10px 12px', marginBottom:'10px' }}>
          <p style={{ fontSize:'11px', fontWeight:'700', color:'#6366F1', marginBottom:'6px', letterSpacing:'0.05em' }}>
            PER PASSENGER ({passengerCount} {passengerCount === 1 ? 'person' : 'people'}, rider excluded)
          </p>
          <Row label="Total Ride Cost" value={`₹${totalRideCost}`} />
          <Row label="Split By"        value={`${passengerCount} passengers`} />
          <Row label="Each Person Pays" value={`₹${costPerPassenger}`} bold />
        </div>
      )}

      {/* Final result */}
      <div style={{ background: isRider ? '#F0FDF4' : '#EEF2FF', borderRadius:'10px', padding:'12px' }}>
        {isRider ? (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'13px', color:'#6B7280' }}>You Collect from Passengers</span>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#16A34A' }}>₹{riderCollects}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span style={{ fontSize:'15px', fontWeight:'700', color:'#15803D' }}>You Pay</span>
              <span style={{ fontSize:'20px', fontWeight:'700', color:'#15803D' }}>₹0 🎉</span>
            </div>
            <div style={{ fontSize:'12px', color:'#6B7280' }}>
              Daily save: ₹{dailySaving} • Monthly: ₹{monthlySaving}
            </div>
          </>
        ) : (
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:'15px', fontWeight:'700', color:'#4338CA' }}>Your Share</span>
            <span style={{ fontSize:'22px', fontWeight:'700', color:'#4338CA' }}>₹{costPerPassenger}</span>
          </div>
        )}
      </div>

      <p style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'10px', textAlign:'center' }}>
        *Fuel cost split equally among all passengers
      </p>
    </div>
  );
}
