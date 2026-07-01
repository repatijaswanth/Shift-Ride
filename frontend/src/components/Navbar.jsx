import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { employee, logout } = useAuth();
  const navigate             = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <Link to="/dashboard" style={S.brand}>🚗 SmartCommute</Link>
        <div style={S.links}>
          <Link to="/dashboard" style={S.link}>Dashboard</Link>
          <Link to="/my-rides"  style={S.link}>My Rides</Link>
          <Link to="/savings"   style={S.link}>💰 Savings</Link>
        </div>
        <div style={S.right}>
          <span style={S.name}>{employee?.name}</span>
          <button style={S.logout} onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

const S = {
  nav:    { background:'white', borderBottom:'1px solid #E5E7EB', padding:'0 16px', position:'sticky', top:0, zIndex:100 },
  inner:  { maxWidth:'1200px', margin:'0 auto', display:'flex', alignItems:'center', height:'56px', gap:'24px' },
  brand:  { fontSize:'18px', fontWeight:'700', color:'#4F46E5', textDecoration:'none', marginRight:'8px' },
  links:  { display:'flex', gap:'16px', flex:1 },
  link:   { fontSize:'14px', color:'#6B7280', textDecoration:'none', fontWeight:'500' },
  right:  { display:'flex', alignItems:'center', gap:'12px' },
  name:   { fontSize:'14px', fontWeight:'500', color:'#374151' },
  logout: { padding:'6px 14px', background:'#F3F4F6', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:'#374151' }
};
